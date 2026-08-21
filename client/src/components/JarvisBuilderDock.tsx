import { Braces, CheckCircle2, CircleDashed, Cloud, CloudCog, Container, Database, ExternalLink, FileCode2, FolderTree, Github, Globe2, Hammer, LockKeyhole, Server, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import React, { useMemo, useState } from "react";
import { createJarvisBuilderPlan, type JarvisBuilderCapability, type JarvisBuilderProjectType } from "@shared/jarvisBuilder";
import { buildJarvisGitHubHandoff, type JarvisGitHubHandoff } from "@shared/jarvisGitHub";
import { cn } from "@/lib/utils";

type BuilderProposalInput = { operation: "code"; path: string; content: string };
type ApprovalRecord = { id: number };
type CloudBuildTarget = "web" | "android" | "service";
type ApprovalInput = { action: string; riskLevel: "medium"; details: string };
type ApprovalResolution = { id: number; decision: "approved" | "rejected" };

const capabilityCards: { id: JarvisBuilderCapability; title: string; description: string; icon: typeof Server }[] = [
  { id: "api", title: "Server API", description: "Validated private routes", icon: Server },
  { id: "database", title: "Database", description: "Scoped structured data", icon: Database },
  { id: "authentication", title: "Auth", description: "Identity and access control", icon: LockKeyhole },
  { id: "storage", title: "Storage", description: "Private file references", icon: Cloud },
];

const cloudBuildTargets: { id: CloudBuildTarget; title: string; detail: string; toolchain: string }[] = [
  { id: "web", title: "Web build", detail: "Production site or web application", toolchain: "Node, package install, tests, and production bundle" },
  { id: "android", title: "Android package", detail: "APK/AAB readiness and signing boundary", toolchain: "Android SDK, Gradle, signing profile, and release checks" },
  { id: "service", title: "Cloud service", detail: "API, worker, or container deployment", toolchain: "Runtime image, environment checks, health probes, and deployment target" },
];

export function JarvisBuilderDock({
  onGenerate,
  onPropose,
  onOpenWorkspace,
  onActivity,
  onProposeGitHub,
  onResolveGitHub,
  onProposeConfirmation,
  onResolveConfirmation,
}: {
  onGenerate: (prompt: string) => void;
  onPropose: (input: BuilderProposalInput) => Promise<unknown>;
  onOpenWorkspace: () => void;
  onActivity: (entry: string) => void;
  onProposeGitHub?: (input: ApprovalInput) => Promise<ApprovalRecord>;
  onResolveGitHub?: (input: ApprovalResolution) => Promise<unknown>;
  onProposeConfirmation?: (input: ApprovalInput) => Promise<ApprovalRecord>;
  onResolveConfirmation?: (input: ApprovalResolution) => Promise<unknown>;
}) {
  const [name, setName] = useState("My next project");
  const [brief, setBrief] = useState("");
  const [projectType, setProjectType] = useState<JarvisBuilderProjectType>("web_app");
  const [capabilities, setCapabilities] = useState<JarvisBuilderCapability[]>(["api", "database", "authentication"]);
  const [isStaging, setIsStaging] = useState(false);
  const [blueprintStaged, setBlueprintStaged] = useState(false);
  const [stageError, setStageError] = useState("");
  const [githubDestination, setGithubDestination] = useState("sign in");
  const [githubProposal, setGithubProposal] = useState<{ id: number; action: JarvisGitHubHandoff; approved: boolean }>();
  const [githubError, setGithubError] = useState("");
  const [cloudBuildTarget, setCloudBuildTarget] = useState<CloudBuildTarget>("web");
  const [cloudProposal, setCloudProposal] = useState<{ id: number; target: CloudBuildTarget; approved: boolean }>();
  const [cloudError, setCloudError] = useState("");
  const plan = useMemo(() => createJarvisBuilderPlan({ name, brief, projectType, capabilities }), [name, brief, projectType, capabilities]);
  const selectedCloudTarget = cloudBuildTargets.find((target) => target.id === cloudBuildTarget) ?? cloudBuildTargets[0];
  const canGenerate = name.trim().length > 1 && brief.trim().length > 8;
  const proposeApproval = onProposeConfirmation ?? onProposeGitHub;
  const resolveApproval = onResolveConfirmation ?? onResolveGitHub;

  const toggleCapability = (capability: JarvisBuilderCapability) => {
    setCapabilities((current) => current.includes(capability) ? current.filter((item) => item !== capability) : [...current, capability]);
  };

  const stageBlueprint = async () => {
    if (!canGenerate || isStaging) return;
    setIsStaging(true);
    setStageError("");
    try {
      await onPropose({ operation: "code", path: `projects/${plan.slug}/BUILD_PLAN.md`, content: plan.blueprint });
      setBlueprintStaged(true);
      onActivity("Builder blueprint staged for private workspace approval");
    } catch (error) {
      setStageError(error instanceof Error ? error.message : "Jarvis could not stage this private blueprint.");
    } finally {
      setIsStaging(false);
    }
  };

  const prepareGitHub = async () => {
    if (!proposeApproval) return setGithubError("Jarvis approval controls are unavailable.");
    try {
      const action = buildJarvisGitHubHandoff(githubDestination);
      const approval = await proposeApproval({
        action: action.label,
        riskLevel: action.riskLevel,
        details: `Jarvis will open ${action.destination} in a new browser tab after your approval. GitHub authentication happens on github.com; Jarvis does not receive or store your GitHub password, token, or OAuth callback.`,
      });
      setGithubProposal({ id: approval.id, action, approved: false });
      setGithubError("");
      onActivity(`${action.label} prepared — explicit approval required before opening`);
    } catch (error) {
      setGithubError(error instanceof Error ? error.message : "Jarvis could not prepare the GitHub handoff.");
    }
  };

  const resolveGitHub = async (decision: "approved" | "rejected") => {
    if (!githubProposal || !resolveApproval) return;
    if (decision === "rejected") {
      await resolveApproval({ id: githubProposal.id, decision });
      setGithubProposal(undefined);
      onActivity("GitHub handoff rejected — nothing was opened");
      return;
    }
    const destinationWindow = window.open("", "_blank", "noopener,noreferrer");
    try {
      await resolveApproval({ id: githubProposal.id, decision });
      if (!destinationWindow) {
        setGithubProposal((current) => current ? { ...current, approved: true } : current);
        onActivity("GitHub handoff approved — your browser blocked the new tab, so use the safe open link");
        return;
      }
      destinationWindow.opener = null;
      destinationWindow.location.href = githubProposal.action.url;
      setGithubProposal(undefined);
      onActivity(`${githubProposal.action.label} opened after explicit approval`);
    } catch (error) {
      destinationWindow?.close();
      setGithubError(error instanceof Error ? error.message : "Jarvis could not record that GitHub approval.");
    }
  };

  const prepareCloudRunner = async () => {
    if (!proposeApproval) return setCloudError("Jarvis approval controls are unavailable.");
    try {
      const approval = await proposeApproval({
        action: `Prepare ${selectedCloudTarget.title} runner proposal`,
        riskLevel: "medium",
        details: `Jarvis will prepare a reviewed ${selectedCloudTarget.title.toLowerCase()} runner plan using ${selectedCloudTarget.toolchain}. This records no cloud account, does not install dependencies, start a build, sign an artifact, publish a release, or create a deployment. A separately connected runner and a further explicit execution approval are required before any real build work can begin.`,
      });
      setCloudProposal({ id: approval.id, target: cloudBuildTarget, approved: false });
      setCloudError("");
      onActivity(`${selectedCloudTarget.title} runner proposal prepared — explicit approval required`);
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : "Jarvis could not prepare the cloud runner proposal.");
    }
  };

  const resolveCloudRunner = async (decision: "approved" | "rejected") => {
    if (!cloudProposal || !resolveApproval) return;
    try {
      await resolveApproval({ id: cloudProposal.id, decision });
      if (decision === "rejected") {
        setCloudProposal(undefined);
        onActivity("Cloud runner proposal rejected — no build or cloud action was started");
        return;
      }
      setCloudProposal((current) => current ? { ...current, approved: true } : current);
      onActivity("Cloud runner proposal approved — runner remains unconnected until you choose a provider and approve execution");
    } catch (error) {
      setCloudError(error instanceof Error ? error.message : "Jarvis could not record that cloud runner decision.");
    }
  };

  return (
    <section aria-label="Jarvis Builder" className="mx-auto w-full max-w-[1540px]">
      <div className="hud-panel overflow-hidden">
        <div className="relative border-b border-cyan-300/15 px-5 py-5 sm:px-7">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_65%)]" aria-hidden="true" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-sm border border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-100"><WandSparkles className="size-4" /></span><p className="hud-label text-fuchsia-100">JARVIS // BUILDER</p></div>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">From concept to a reviewable build plan.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Shape a website or app, review its compile requirements, and prepare explicit GitHub, cloud-runner, or deployment proposals. Jarvis never runs generated code, writes files, applies migrations, signs artifacts, or deploys without your review.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-medium tracking-[0.16em]"><span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-cyan-100">01 PLAN</span><span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-400/10 px-2.5 py-1 text-fuchsia-100">02 REVIEW</span><span className="rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-slate-400">03 BUILD</span></div>
          </div>
        </div>

        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.95fr)]">
          <div className="border-b border-cyan-300/10 p-5 sm:p-7 xl:border-b-0 xl:border-r">
            <div className="flex items-center gap-2"><Braces className="size-4 text-cyan-200" /><p className="hud-label">PROJECT INPUT</p></div>
            <label className="mt-5 block"><span className="text-xs font-medium text-slate-300">Project name</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="mt-2 w-full rounded-sm border border-white/10 bg-black/35 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300/45" placeholder="e.g. Local study companion" /></label>
            <label className="mt-4 block"><span className="text-xs font-medium text-slate-300">What should it do?</span><textarea value={brief} onChange={(event) => setBrief(event.target.value)} maxLength={2200} className="mt-2 min-h-32 w-full resize-y rounded-sm border border-white/10 bg-black/35 p-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/45" placeholder="Describe the user, the main job to be done, and the essential screen or workflow…" /></label>
            <div className="mt-5"><p className="text-xs font-medium text-slate-300">Delivery shape</p><div className="mt-2 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => setProjectType("website")} className={cn("rounded-sm border p-3 text-left transition", projectType === "website" ? "border-cyan-300/35 bg-cyan-300/[0.08]" : "border-white/10 bg-white/[0.02] hover:border-white/20")}><Globe2 className="size-4 text-cyan-200" /><p className="mt-2 text-sm text-slate-100">Website</p><p className="mt-1 text-xs leading-5 text-slate-500">Responsive pages and content.</p></button><button type="button" onClick={() => setProjectType("web_app")} className={cn("rounded-sm border p-3 text-left transition", projectType === "web_app" ? "border-fuchsia-400/35 bg-fuchsia-400/[0.08]" : "border-white/10 bg-white/[0.02] hover:border-white/20")}><FileCode2 className="size-4 text-fuchsia-200" /><p className="mt-2 text-sm text-slate-100">Web application</p><p className="mt-1 text-xs leading-5 text-slate-500">UI, logic, and private data.</p></button></div></div>
            <div className="mt-5"><p className="text-xs font-medium text-slate-300">Backend capabilities</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{capabilityCards.map((item) => { const Icon = item.icon; const selected = capabilities.includes(item.id); return <button key={item.id} type="button" aria-pressed={selected} onClick={() => toggleCapability(item.id)} className={cn("flex items-start gap-3 rounded-sm border p-3 text-left transition", selected ? "border-cyan-300/30 bg-cyan-300/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/20")}><span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border", selected ? "border-cyan-300/35 text-cyan-100" : "border-white/10 text-slate-600")}><Icon className="size-3" /></span><span><span className="block text-xs text-slate-200">{item.title}</span><span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{item.description}</span></span></button>; })}</div></div>
          </div>

          <div className="bg-black/15 p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><CircleDashed className="size-4 text-fuchsia-200" /><p className="hud-label">BUILD &amp; COMPILE READINESS</p></div><span className={cn("rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[0.13em]", canGenerate ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.025] text-slate-500")}>{canGenerate ? "READY TO PLAN" : "NEEDS BRIEF"}</span></div>
            <div className="mt-5 rounded-sm border border-cyan-300/15 bg-cyan-300/[0.025] p-4"><p className="text-sm font-medium text-white">{plan.name}</p><p className="mt-1 text-xs text-slate-500">{plan.projectType === "website" ? "Responsive website" : "Full-stack web application"} · <span className="font-mono text-slate-400">/{plan.slug}</span></p><div className="mt-4 space-y-2">{plan.readinessChecks.map((check) => <div className="flex gap-2" key={check}><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-cyan-200" /><p className="text-xs leading-5 text-slate-400">{check}</p></div>)}</div></div>
            <div className="mt-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-300">Proposed file map</p><FolderTree className="size-3.5 text-slate-500" /></div><div className="mt-2 grid gap-1.5">{plan.recommendedFiles.map((file) => <code className="truncate rounded-sm border border-white/[0.07] bg-black/25 px-2.5 py-2 font-mono text-[11px] text-slate-400" key={file}>{file}</code>)}</div></div>
            <div className="mt-5 rounded-sm border border-amber-300/15 bg-amber-300/[0.035] p-3 text-xs leading-5 text-slate-400"><ShieldCheck className="mr-2 inline size-3.5 text-amber-200" />Jarvis can prepare build targets, toolchain checks, reviewed artifacts, and cloud-runner proposals. Real compilation, signing, publication, and deployment remain separately connected and approval-gated.</div>
            <section aria-label="Cloud build control" className="mt-4 rounded-sm border border-fuchsia-300/20 bg-fuchsia-300/[0.035] p-3"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-2.5"><span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-100"><CloudCog className="size-3.5" /></span><div><p className="text-xs font-medium text-slate-100">Cloud build control</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Choose a build target, review its toolchain, then prepare a runner proposal. No build job can start from this panel.</p></div></div><span className="shrink-0 rounded-full border border-white/10 bg-black/20 px-2 py-1 font-mono text-[9px] tracking-[0.12em] text-slate-500">RUNNER UNCONNECTED</span></div><div className="mt-3 grid gap-2 sm:grid-cols-3">{cloudBuildTargets.map((target) => <button type="button" key={target.id} aria-pressed={cloudBuildTarget === target.id} onClick={() => setCloudBuildTarget(target.id)} className={cn("rounded-sm border p-2.5 text-left transition", cloudBuildTarget === target.id ? "border-fuchsia-300/35 bg-fuchsia-300/[0.10]" : "border-white/10 bg-black/15 hover:border-white/20")}><p className="text-[11px] font-medium text-slate-200">{target.title}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{target.detail}</p></button>)}</div><div className="mt-3 flex items-start gap-2 rounded-sm border border-white/[0.08] bg-black/20 p-2.5"><Container className="mt-0.5 size-3.5 shrink-0 text-cyan-200" /><p className="text-[11px] leading-5 text-slate-400"><span className="text-slate-200">{selectedCloudTarget.toolchain}.</span> Jarvis turns this into a reviewable runner requirement, not a silent command or background task.</p></div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={() => void prepareCloudRunner()} className="rounded-sm border border-fuchsia-300/35 bg-fuchsia-300/10 px-3 py-2 text-[10px] font-semibold text-fuchsia-50 transition hover:bg-fuchsia-300/20"><Hammer className="mr-1 inline size-3.5" />PREPARE RUNNER PROPOSAL</button><p className="text-[10px] leading-5 text-slate-600">Connect a compatible runner separately; then approve a specific build command, artifact destination, and deployment target.</p></div>{cloudError && <p role="alert" className="mt-2 text-[11px] text-rose-300">{cloudError}</p>}{cloudProposal && <div className="mt-3 rounded-sm border border-amber-300/25 bg-amber-300/[0.04] p-2.5"><p className="text-[11px] leading-5 text-slate-400">{cloudProposal.approved ? "Runner proposal approved. A cloud runner has not been connected and no build was started." : `Prepare ${cloudBuildTargets.find((target) => target.id === cloudProposal.target)?.title ?? "cloud build"} runner?`}</p>{!cloudProposal.approved && <div className="mt-2 flex flex-wrap gap-2"><button type="button" onClick={() => void resolveCloudRunner("rejected")} className="rounded-sm border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white">REJECT</button><button type="button" onClick={() => void resolveCloudRunner("approved")} className="rounded-sm border border-amber-300/35 bg-amber-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-amber-100 hover:bg-amber-300/20">APPROVE PROPOSAL</button></div>}</div>}</section>
            <div className="mt-4 rounded-sm border border-white/[0.09] bg-black/20 p-3"><div className="flex items-start gap-2.5"><span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-cyan-300/25 bg-cyan-300/[0.06] text-cyan-100"><Github className="size-3.5" /></span><div><p className="text-xs font-medium text-slate-200">GitHub connection</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Open GitHub sign in or a repository after explicit approval. Authentication occurs only on GitHub; Jarvis never requests or stores GitHub passwords, tokens, or OAuth callbacks.</p></div></div><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input aria-label="GitHub repository destination" value={githubDestination} onChange={(event) => setGithubDestination(event.target.value)} placeholder="sign in or github.com/owner/repository" className="min-w-0 flex-1 rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/35" /><button type="button" onClick={() => void prepareGitHub()} className="shrink-0 rounded-sm border border-cyan-300/30 bg-cyan-300/[0.08] px-3 py-2 text-[10px] font-semibold text-cyan-50 transition hover:bg-cyan-300/15"><Github className="mr-1 inline size-3.5" />PREPARE GITHUB</button></div>{githubError && <p role="alert" className="mt-2 text-[11px] text-rose-300">{githubError}</p>}{githubProposal && <div className="mt-3 rounded-sm border border-amber-300/25 bg-amber-300/[0.04] p-2.5"><p className="text-[11px] leading-5 text-slate-400">{githubProposal.action.label}: <span className="text-slate-200">{githubProposal.action.destination}</span></p><div className="mt-2 flex flex-wrap gap-2">{!githubProposal.approved ? <><button type="button" onClick={() => void resolveGitHub("rejected")} className="rounded-sm border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white">REJECT</button><button type="button" onClick={() => void resolveGitHub("approved")} className="rounded-sm border border-amber-300/35 bg-amber-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-amber-100 hover:bg-amber-300/20">APPROVE &amp; OPEN</button></> : <a href={githubProposal.action.url} target="_blank" rel="noreferrer" onClick={() => onActivity(`${githubProposal.action.label} opened after explicit approval`)} className="rounded-sm border border-cyan-300/35 bg-cyan-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-50"><ExternalLink className="mr-1 inline size-3.5" />OPEN APPROVED GITHUB</a>}</div></div>}</div>
            {stageError && <p role="alert" className="mt-3 text-xs text-fuchsia-200">{stageError}</p>}
            <div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" disabled={!canGenerate || isStaging} onClick={() => void stageBlueprint()} className="rounded-sm border border-white/15 bg-white/[0.035] px-3 py-3 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/35 hover:text-cyan-50 disabled:cursor-not-allowed disabled:opacity-40">{isStaging ? "STAGING…" : blueprintStaged ? "BLUEPRINT STAGED" : "STAGE BLUEPRINT"}</button><button type="button" disabled={!canGenerate} onClick={() => { onGenerate(plan.generationPrompt); onActivity("Builder brief sent to the Coding agent for a reviewable plan"); }} className="rounded-sm border border-fuchsia-400/35 bg-fuchsia-400/10 px-3 py-3 text-xs font-semibold text-fuchsia-50 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles className="mr-2 inline size-3.5" />GENERATE WITH JARVIS</button></div>
            {blueprintStaged && <button type="button" onClick={onOpenWorkspace} className="mt-3 w-full text-center text-xs text-cyan-100 transition hover:text-white">Review approval in Private Workspace →</button>}
          </div>
        </div>
      </div>
    </section>
  );
}
