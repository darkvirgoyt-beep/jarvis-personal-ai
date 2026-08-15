import { Braces, CheckCircle2, CircleDashed, Cloud, Database, FileCode2, FolderTree, Globe2, LockKeyhole, Server, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import React, { useMemo, useState } from "react";
import { createJarvisBuilderPlan, type JarvisBuilderCapability, type JarvisBuilderProjectType } from "@shared/jarvisBuilder";
import { cn } from "@/lib/utils";

type BuilderProposalInput = { operation: "code"; path: string; content: string };

const capabilityCards: { id: JarvisBuilderCapability; title: string; description: string; icon: typeof Server }[] = [
  { id: "api", title: "Server API", description: "Validated private routes", icon: Server },
  { id: "database", title: "Database", description: "Scoped structured data", icon: Database },
  { id: "authentication", title: "Auth", description: "Identity and access control", icon: LockKeyhole },
  { id: "storage", title: "Storage", description: "Private file references", icon: Cloud },
];

export function JarvisBuilderDock({ onGenerate, onPropose, onOpenWorkspace, onActivity }: {
  onGenerate: (prompt: string) => void;
  onPropose: (input: BuilderProposalInput) => Promise<unknown>;
  onOpenWorkspace: () => void;
  onActivity: (entry: string) => void;
}) {
  const [name, setName] = useState("My next project");
  const [brief, setBrief] = useState("");
  const [projectType, setProjectType] = useState<JarvisBuilderProjectType>("web_app");
  const [capabilities, setCapabilities] = useState<JarvisBuilderCapability[]>(["api", "database", "authentication"]);
  const [isStaging, setIsStaging] = useState(false);
  const [blueprintStaged, setBlueprintStaged] = useState(false);
  const [stageError, setStageError] = useState("");
  const plan = useMemo(() => createJarvisBuilderPlan({ name, brief, projectType, capabilities }), [name, brief, projectType, capabilities]);
  const canGenerate = name.trim().length > 1 && brief.trim().length > 8;

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

  return (
    <section aria-label="Jarvis Builder" className="mx-auto w-full max-w-[1540px]">
      <div className="hud-panel overflow-hidden">
        <div className="relative border-b border-cyan-300/15 px-5 py-5 sm:px-7">
          <div className="absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_65%)]" aria-hidden="true" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-sm border border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-100"><WandSparkles className="size-4" /></span><p className="hud-label text-fuchsia-100">JARVIS // BUILDER</p></div><h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">From concept to a reviewable build plan.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Shape a website or app, separate frontend from backend needs, then send a precise blueprint to Jarvis. Builder never runs generated code, writes files, applies migrations, or deploys without your review.</p></div>
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
            <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><CircleDashed className="size-4 text-fuchsia-200" /><p className="hud-label">COMPILE READINESS</p></div><span className={cn("rounded-full border px-2.5 py-1 font-mono text-[9px] tracking-[0.13em]", canGenerate ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : "border-white/10 bg-white/[0.025] text-slate-500")}>{canGenerate ? "READY TO PLAN" : "NEEDS BRIEF"}</span></div>
            <div className="mt-5 rounded-sm border border-cyan-300/15 bg-cyan-300/[0.025] p-4"><p className="text-sm font-medium text-white">{plan.name}</p><p className="mt-1 text-xs text-slate-500">{plan.projectType === "website" ? "Responsive website" : "Full-stack web application"} · <span className="font-mono text-slate-400">/{plan.slug}</span></p><div className="mt-4 space-y-2">{plan.readinessChecks.map((check) => <div className="flex gap-2" key={check}><CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-cyan-200" /><p className="text-xs leading-5 text-slate-400">{check}</p></div>)}</div></div>
            <div className="mt-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-300">Proposed file map</p><FolderTree className="size-3.5 text-slate-500" /></div><div className="mt-2 grid gap-1.5">{plan.recommendedFiles.map((file) => <code className="truncate rounded-sm border border-white/[0.07] bg-black/25 px-2.5 py-2 font-mono text-[11px] text-slate-400" key={file}>{file}</code>)}</div></div>
            <div className="mt-5 rounded-sm border border-amber-300/15 bg-amber-300/[0.035] p-3 text-xs leading-5 text-slate-400"><ShieldCheck className="mr-2 inline size-3.5 text-amber-200" />This is a readiness review, not a code compiler. Generated plans and code require your review; workspace writes remain approval-gated.</div>
            {stageError && <p role="alert" className="mt-3 text-xs text-fuchsia-200">{stageError}</p>}
            <div className="mt-5 grid gap-2 sm:grid-cols-2"><button type="button" disabled={!canGenerate || isStaging} onClick={() => void stageBlueprint()} className="rounded-sm border border-white/15 bg-white/[0.035] px-3 py-3 text-xs font-semibold text-slate-200 transition hover:border-cyan-300/35 hover:text-cyan-50 disabled:cursor-not-allowed disabled:opacity-40">{isStaging ? "STAGING…" : blueprintStaged ? "BLUEPRINT STAGED" : "STAGE BLUEPRINT"}</button><button type="button" disabled={!canGenerate} onClick={() => { onGenerate(plan.generationPrompt); onActivity("Builder brief sent to the Coding agent for a reviewable plan"); }} className="rounded-sm border border-fuchsia-400/35 bg-fuchsia-400/10 px-3 py-3 text-xs font-semibold text-fuchsia-50 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles className="mr-2 inline size-3.5" />GENERATE WITH JARVIS</button></div>
            {blueprintStaged && <button type="button" onClick={onOpenWorkspace} className="mt-3 w-full text-center text-xs text-cyan-100 transition hover:text-white">Review approval in Private Workspace →</button>}
          </div>
        </div>
      </div>
    </section>
  );
}
