import { JarvisAuthDialog } from "@/components/JarvisAuthDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { JARVIS_OPEN_AUTH_EVENT } from "@/const";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, ArrowLeft, Bot, Check, ChevronRight, Code2, FileCode2, FolderKanban, HardDrive, History, Laptop, LockKeyhole, Play, Plus, Radio, Rocket, ScrollText, Settings2, ShieldCheck, TerminalSquare, Wrench, X } from "lucide-react";

type WorkspaceTab = "chat" | "projects" | "files" | "terminal" | "agents" | "settings";

const tabs: { id: WorkspaceTab; label: string; icon: typeof Bot }[] = [
  { id: "chat", label: "Chat", icon: Bot },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "files", label: "Files", icon: FileCode2 },
  { id: "terminal", label: "Terminal", icon: TerminalSquare },
  { id: "agents", label: "Agents", icon: Wrench },
  { id: "settings", label: "Settings", icon: Settings2 },
];

const toolKinds = [
  { id: "file_write" as const, label: "Write a file", risk: "medium" as const },
  { id: "file_delete" as const, label: "Delete a file", risk: "high" as const },
  { id: "terminal_command" as const, label: "Run terminal command", risk: "high" as const },
  { id: "browser_navigate" as const, label: "Open browser destination", risk: "medium" as const },
  { id: "git_operation" as const, label: "Git operation", risk: "high" as const },
  { id: "deployment" as const, label: "Deployment", risk: "high" as const },
] as const;

function formatTime(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusPill({ value }: { value: string }) {
  const tone = value === "succeeded" || value === "complete" || value === "approved" || value === "active"
    ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
    : value === "failed" || value === "blocked" || value === "rejected"
      ? "border-rose-300/25 bg-rose-300/10 text-rose-100"
      : value === "pending" || value === "planning" || value === "waiting_approval"
        ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
        : "border-cyan-300/25 bg-cyan-300/10 text-cyan-100";
  return <span className={cn("rounded-full border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em]", tone)}>{value.replaceAll("_", " ")}</span>;
}

export default function VirgoYTAgent() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [tab, setTab] = useState<WorkspaceTab>("chat");
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<number>();
  const [activeRunId, setActiveRunId] = useState<number>();
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [request, setRequest] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<"coding" | "research" | "ui" | "security" | "devops">("coding");
  const [proposalKind, setProposalKind] = useState<(typeof toolKinds)[number]["id"]>("file_write");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDetails, setProposalDetails] = useState("");
  const [providerLabel, setProviderLabel] = useState("");
  const [providerEndpoint, setProviderEndpoint] = useState("");
  const [runnerName, setRunnerName] = useState("");
  const [runnerType, setRunnerType] = useState<"local_cli" | "remote_isolated">("local_cli");
  const [notice, setNotice] = useState("");

  const catalogQuery = trpc.virgoyt.catalog.useQuery(undefined, { enabled: Boolean(user) });
  const projectsQuery = trpc.virgoyt.projects.list.useQuery(undefined, { enabled: Boolean(user), refetchInterval: 6_000 });
  const runsQuery = trpc.virgoyt.runs.list.useQuery({ projectId: activeProjectId ?? 0 }, { enabled: Boolean(user && activeProjectId), refetchInterval: 6_000 });
  const planQuery = trpc.virgoyt.plans.list.useQuery({ projectId: activeProjectId ?? 0, runId: activeRunId ?? 0 }, { enabled: Boolean(user && activeProjectId && activeRunId), refetchInterval: 6_000 });
  const proposalsQuery = trpc.virgoyt.proposals.list.useQuery({ projectId: activeProjectId ?? 0 }, { enabled: Boolean(user && activeProjectId), refetchInterval: 6_000 });
  const auditQuery = trpc.virgoyt.audit.list.useQuery({ projectId: activeProjectId ?? 0 }, { enabled: Boolean(user && activeProjectId), refetchInterval: 6_000 });
  const providersQuery = trpc.virgoyt.providers.list.useQuery(undefined, { enabled: Boolean(user) });
  const runnersQuery = trpc.virgoyt.runners.list.useQuery({ projectId: activeProjectId ?? 0 }, { enabled: Boolean(user && activeProjectId), refetchInterval: 6_000 });

  const createProject = trpc.virgoyt.projects.create.useMutation();
  const createRun = trpc.virgoyt.runs.create.useMutation();
  const createPlanStep = trpc.virgoyt.plans.create.useMutation();
  const createProposal = trpc.virgoyt.proposals.create.useMutation();
  const resolveProposal = trpc.virgoyt.proposals.resolve.useMutation();
  const createProvider = trpc.virgoyt.providers.create.useMutation();
  const registerRunner = trpc.virgoyt.runners.register.useMutation();

  const activeProject = useMemo(() => (projectsQuery.data ?? []).find((project) => project.id === activeProjectId), [activeProjectId, projectsQuery.data]);
  const activeRun = useMemo(() => (runsQuery.data ?? []).find((run) => run.id === activeRunId), [activeRunId, runsQuery.data]);
  const pendingProposalCount = (proposalsQuery.data ?? []).filter((proposal) => proposal.status === "pending").length;

  useEffect(() => {
    if (!activeProjectId && projectsQuery.data?.[0]) setActiveProjectId(projectsQuery.data[0].id);
  }, [activeProjectId, projectsQuery.data]);

  useEffect(() => {
    if (!activeRunId && runsQuery.data?.[0]) setActiveRunId(runsQuery.data[0].id);
  }, [activeRunId, runsQuery.data]);

  useEffect(() => {
    const open = () => setAuthDialogOpen(true);
    window.addEventListener(JARVIS_OPEN_AUTH_EVENT, open);
    return () => window.removeEventListener(JARVIS_OPEN_AUTH_EVENT, open);
  }, []);

  const refreshProject = async () => {
    await Promise.all([
      utils.virgoyt.projects.list.invalidate(),
      utils.virgoyt.runs.list.invalidate(),
      utils.virgoyt.plans.list.invalidate(),
      utils.virgoyt.proposals.list.invalidate(),
      utils.virgoyt.audit.list.invalidate(),
      utils.virgoyt.runners.list.invalidate(),
    ]);
  };

  const handleCreateProject = async () => {
    if (projectName.trim().length < 2) return setNotice("Name the project before creating its private workspace.");
    try {
      const project = await createProject.mutateAsync({ name: projectName.trim(), description: projectDescription.trim() || null, defaultAgent: selectedAgent });
      setActiveProjectId(project.id);
      setActiveRunId(undefined);
      setProjectName("");
      setProjectDescription("");
      setNotice(`Private project “${project.name}” created.`);
      await refreshProject();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "VirgoYT could not create the private project.");
    }
  };

  const handleCreateRun = async () => {
    if (!activeProjectId) return setNotice("Create or select a project before starting an agent run.");
    if (request.trim().length < 4) return setNotice("Describe the outcome you want the agent to plan.");
    try {
      const run = await createRun.mutateAsync({ projectId: activeProjectId, agent: selectedAgent, provider: "openrouter", request: request.trim() });
      setActiveRunId(run.id);
      setRequest("");
      setNotice("Agent run recorded as planning. It cannot touch tools until you review a proposal.");
      await refreshProject();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "VirgoYT could not start the planning run.");
    }
  };

  const handleCreatePlanStep = async () => {
    if (!activeProjectId || !activeRunId) return setNotice("Start or select an agent run before adding a plan step.");
    try {
      const order = (planQuery.data?.length ?? 0) + 1;
      await createPlanStep.mutateAsync({
        projectId: activeProjectId,
        runId: activeRunId,
        stepOrder: order,
        title: `Review ${selectedAgent} plan`,
        description: "Manual plan checkpoint. Any external, terminal, file, Git, or deployment action still needs its own approval proposal.",
        assignedAgent: selectedAgent,
        requiresApproval: true,
      });
      setNotice("Plan checkpoint added. It remains reviewable and has not invoked a tool.");
      await refreshProject();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "VirgoYT could not add the plan step.");
    }
  };

  const handleCreateProposal = async () => {
    if (!activeProjectId) return setNotice("Select a project before preparing a tool proposal.");
    if (proposalTitle.trim().length < 3 || proposalDetails.trim().length < 3) return setNotice("Describe the proposed action and review details before submitting it.");
    const selected = toolKinds.find((item) => item.id === proposalKind) ?? toolKinds[0];
    try {
      await createProposal.mutateAsync({
        projectId: activeProjectId,
        runId: activeRunId ?? null,
        toolKind: proposalKind,
        riskLevel: selected.risk,
        title: proposalTitle.trim(),
        details: proposalDetails.trim(),
      });
      setProposalTitle("");
      setProposalDetails("");
      setNotice("Proposal staged for review. No command, file change, navigation, Git action, or deployment has run.");
      await refreshProject();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "VirgoYT could not stage this proposal.");
    }
  };

  const handleResolveProposal = async (proposalId: number, decision: "approved" | "rejected") => {
    if (!activeProjectId) return;
    try {
      const result = await resolveProposal.mutateAsync({ projectId: activeProjectId, proposalId, decision });
      setNotice(result.message);
      await refreshProject();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "VirgoYT could not resolve this proposal.");
    }
  };

  const handleCreateProvider = async () => {
    if (providerLabel.trim().length < 2) return setNotice("Give this provider profile a label.");
    try {
      await createProvider.mutateAsync({ label: providerLabel.trim(), provider: "compatible", endpoint: providerEndpoint.trim() || null, defaultModel: null });
      setProviderLabel("");
      setProviderEndpoint("");
      setNotice("Provider metadata saved without a credential. Add secrets only through server-side owner configuration.");
      await utils.virgoyt.providers.list.invalidate();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "VirgoYT could not save that provider profile.");
    }
  };

  const handleRegisterRunner = async () => {
    if (!activeProjectId) return setNotice("Select a project before requesting a runner connection.");
    if (runnerName.trim().length < 2) return setNotice("Name the local or isolated runner you want to pair.");
    try {
      const result = await registerRunner.mutateAsync({ projectId: activeProjectId, displayName: runnerName.trim(), runnerType });
      setRunnerName("");
      setNotice(result.message);
      await refreshProject();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "VirgoYT could not request the runner registration.");
    }
  };

  if (loading) return <main className="min-h-screen bg-[#05080f] p-8 text-slate-400">Synchronizing private workspace…</main>;

  if (!user) return <main className="min-h-screen bg-[#05080f] px-5 py-16 text-slate-100 sm:px-8"><div className="mx-auto max-w-2xl rounded-sm border border-cyan-300/20 bg-slate-950/85 p-8 shadow-[0_0_60px_rgba(34,211,238,0.1)]"><p className="hud-label text-cyan-200">VIRGOYT // PRIVATE AGENT CONTROL</p><h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">Sign in before opening your agent workspace.</h1><p className="mt-3 max-w-xl leading-7 text-slate-400">Projects, plans, runner requests, provider metadata, approvals, and audit history are private to the signed-in Jarvis account. VirgoYT never runs tools from this public screen.</p><div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => setAuthDialogOpen(true)} className="bg-cyan-300 text-slate-950 hover:bg-cyan-200"><LockKeyhole className="mr-2 size-4" />Sign in to VirgoYT</Button><Link href="/" className="inline-flex items-center rounded-sm border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white"><ArrowLeft className="mr-2 size-4" />Back to Jarvis</Link></div></div><JarvisAuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} onAuthenticated={() => void utils.auth.me.invalidate()} /></main>;

  return <main className="min-h-screen bg-[#05080f] text-slate-100"><div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(217,70,239,0.13),transparent_30%),radial-gradient(circle_at_12%_18%,rgba(34,211,238,0.1),transparent_27%)]" />
    <header className="relative z-10 border-b border-cyan-300/15 bg-slate-950/80 backdrop-blur"><div className="mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><Link href="/" className="flex size-9 shrink-0 items-center justify-center rounded-sm border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20"><ArrowLeft className="size-4" /></Link><div className="min-w-0"><p className="hud-label truncate text-cyan-100">VIRGOYT // AI AGENT WORKSPACE</p><p className="truncate text-sm text-slate-400">{activeProject?.name ?? "Choose a private project"}</p></div></div><div className="hidden items-center gap-2 text-[10px] font-medium tracking-[0.14em] sm:flex"><Radio className="size-3 text-cyan-200" /><span className="text-cyan-100">SYNC 6S</span><span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-emerald-100">PRIVATE SESSION</span></div></div></header>

    <div className="relative z-10 mx-auto grid max-w-[1700px] gap-4 p-4 lg:grid-cols-[220px_minmax(0,1fr)_340px] lg:p-6">
      <aside className="rounded-sm border border-white/10 bg-slate-950/80 p-2 lg:sticky lg:top-6 lg:h-[calc(100vh-6rem)]"><div className="mb-3 border-b border-white/[0.07] px-3 py-3"><p className="text-xs font-semibold text-white">{user.name || "Private operator"}</p><p className="mt-1 truncate text-[11px] text-slate-500">{user.email || "Authenticated workspace"}</p></div><nav aria-label="VirgoYT workspace areas" className="grid grid-cols-3 gap-1 lg:grid-cols-1">{tabs.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => setTab(item.id)} className={cn("flex min-h-11 items-center justify-center gap-2 rounded-sm px-3 py-2 text-left text-xs transition lg:justify-start", tab === item.id ? "bg-cyan-300/10 text-cyan-100" : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200")}><Icon className="size-4" /><span className="hidden sm:inline">{item.label}</span></button>; })}</nav><div className="mt-4 rounded-sm border border-amber-300/15 bg-amber-300/[0.035] p-3"><ShieldCheck className="size-4 text-amber-200" /><p className="mt-2 text-[11px] font-semibold text-amber-100">Approval-first tools</p><p className="mt-1 text-[10px] leading-4 text-slate-500">No files, commands, navigation, Git, or deployments execute from a plan alone.</p></div></aside>

      <section className="min-w-0 rounded-sm border border-white/10 bg-slate-950/80 p-4 shadow-[0_0_45px_rgba(34,211,238,0.04)] sm:p-6">
        {notice && <div role="status" className="mb-5 flex items-start justify-between gap-3 rounded-sm border border-cyan-300/20 bg-cyan-300/[0.055] p-3 text-xs leading-5 text-cyan-50"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss agent notice"><X className="size-4" /></button></div>}
        {tab === "chat" && <div><div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end"><div><p className="hud-label text-fuchsia-200">AGENT CHAT</p><h1 className="mt-2 text-2xl font-semibold text-white">Plan work before tools touch it.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Jarvis creates a private agent run with a clear request. Use plan checkpoints and explicit proposals for any action beyond reasoning.</p></div><StatusPill value={activeRun?.status ?? "idle"} /></div><div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]"><div className="rounded-sm border border-white/[0.08] bg-black/20 p-4"><label className="text-xs font-medium text-slate-300" htmlFor="virgoyt-request">What should VirgoYT plan?</label><Textarea id="virgoyt-request" value={request} onChange={(event) => setRequest(event.target.value)} placeholder="Example: review the current app, outline the safest deployment path, and list all approval-gated changes." className="mt-2 min-h-36 border-white/10 bg-white/[0.03] text-slate-100 placeholder:text-slate-600" /><div className="mt-3 flex flex-col gap-2 sm:flex-row"><select aria-label="Assigned agent" value={selectedAgent} onChange={(event) => setSelectedAgent(event.target.value as typeof selectedAgent)} className="min-h-11 rounded-sm border border-white/10 bg-slate-900 px-3 text-xs text-slate-200"><option value="coding">Coding agent</option><option value="research">Research agent</option><option value="ui">UI agent</option><option value="security">Security agent</option><option value="devops">DevOps agent</option></select><Button disabled={createRun.isPending} onClick={() => void handleCreateRun()} className="min-h-11 bg-fuchsia-400/90 text-white hover:bg-fuchsia-300"><Play className="mr-2 size-4" />{createRun.isPending ? "Starting…" : "Start planning run"}</Button></div></div><div className="rounded-sm border border-cyan-300/15 bg-cyan-300/[0.025] p-4"><p className="hud-label text-cyan-100">ACTIVE RUN</p>{activeRun ? <><p className="mt-3 text-sm font-medium text-white">{activeRun.agent} · {activeRun.modelId}</p><p className="mt-2 text-xs leading-5 text-slate-500">{activeRun.requestSummary}</p><p className="mt-3 font-mono text-[10px] text-slate-600">Started {formatTime(activeRun.startedAt)}</p></> : <p className="mt-3 text-xs leading-5 text-slate-500">No agent run selected. Create a private project, then write a planning request.</p>}</div></div></div>}

        {tab === "projects" && <div><p className="hud-label text-cyan-100">PRIVATE PROJECTS</p><h1 className="mt-2 text-2xl font-semibold text-white">Each agent action belongs to a project.</h1><div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="grid gap-3">{(projectsQuery.data ?? []).map((project) => <button key={project.id} type="button" onClick={() => { setActiveProjectId(project.id); setActiveRunId(undefined); setTab("chat"); }} className={cn("rounded-sm border p-4 text-left transition", project.id === activeProjectId ? "border-cyan-300/35 bg-cyan-300/[0.06]" : "border-white/[0.08] bg-black/20 hover:border-white/20")}><div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{project.name}</p><StatusPill value={project.status} /></div><p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{project.description || "No description yet."}</p><p className="mt-3 font-mono text-[10px] text-slate-600">{project.slug}</p></button>)}{!projectsQuery.data?.length && <div className="rounded-sm border border-dashed border-white/15 p-6 text-sm text-slate-500">Create your first private project to begin agent planning.</div>}</div><div className="rounded-sm border border-fuchsia-400/20 bg-fuchsia-400/[0.035] p-4"><p className="text-sm font-semibold text-white">New private project</p><Input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Project name" className="mt-3 border-white/10 bg-slate-950/70 text-slate-100" /><Textarea value={projectDescription} onChange={(event) => setProjectDescription(event.target.value)} placeholder="Short privacy-safe brief" className="mt-2 min-h-24 border-white/10 bg-slate-950/70 text-slate-100" /><Button onClick={() => void handleCreateProject()} disabled={createProject.isPending} className="mt-3 min-h-11 w-full bg-fuchsia-400/90 text-white hover:bg-fuchsia-300"><Plus className="mr-2 size-4" />Create project</Button></div></div></div>}

        {tab === "files" && <ToolProposalPanel title="Files are proposed, never silently changed." icon={<FileCode2 className="size-5 text-cyan-100" />} selectedKind={proposalKind} setSelectedKind={setProposalKind} proposalTitle={proposalTitle} setProposalTitle={setProposalTitle} proposalDetails={proposalDetails} setProposalDetails={setProposalDetails} onCreate={handleCreateProposal} isPending={createProposal.isPending} />}
        {tab === "terminal" && <ToolProposalPanel title="Terminal requests stay reviewable and non-executable here." icon={<TerminalSquare className="size-5 text-fuchsia-200" />} selectedKind={proposalKind} setSelectedKind={setProposalKind} proposalTitle={proposalTitle} setProposalTitle={setProposalTitle} proposalDetails={proposalDetails} setProposalDetails={setProposalDetails} onCreate={handleCreateProposal} isPending={createProposal.isPending} forceKind="terminal_command" />}

        {tab === "agents" && <div><div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-end"><div><p className="hud-label text-cyan-100">MULTI-AGENT BOARD</p><h1 className="mt-2 text-2xl font-semibold text-white">Visible roles. Reviewable plan.</h1></div><Button variant="outline" onClick={() => void handleCreatePlanStep()} disabled={!activeRunId || createPlanStep.isPending} className="min-h-11 border-cyan-300/25 text-cyan-100 hover:bg-cyan-300/10"><Plus className="mr-2 size-4" />Add review checkpoint</Button></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(catalogQuery.data?.agents ?? []).map((agent) => <div key={agent.id} className="rounded-sm border border-white/[0.08] bg-black/20 p-4"><Bot className="size-4 text-cyan-100" /><p className="mt-3 font-medium text-white">{agent.name}</p><p className="mt-1 text-xs leading-5 text-slate-500">{agent.description}</p></div>)}</div><div className="mt-6 rounded-sm border border-white/[0.08] bg-black/20 p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white">Plan for {activeRun ? `run #${activeRun.id}` : "selected run"}</p><span className="font-mono text-[10px] text-slate-600">AUTO REFRESH 6S</span></div><div className="mt-4 space-y-2">{(planQuery.data ?? []).map((step) => <div className="flex items-start gap-3 rounded-sm border border-white/[0.07] px-3 py-3" key={step.id}><span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 font-mono text-[10px] text-cyan-100">{step.stepOrder}</span><div className="min-w-0 flex-1"><p className="text-xs font-medium text-slate-200">{step.title}</p><p className="mt-1 text-[11px] leading-5 text-slate-500">{step.description}</p></div><StatusPill value={step.status} /></div>)}{!planQuery.data?.length && <p className="text-xs text-slate-500">No plan checkpoints yet. Start a run, then add a review checkpoint.</p>}</div></div></div>}

        {tab === "settings" && <div><p className="hud-label text-cyan-100">CONNECTION SETTINGS</p><h1 className="mt-2 text-2xl font-semibold text-white">Metadata first. Credentials stay server-side.</h1><div className="mt-6 grid gap-5 xl:grid-cols-2"><div className="rounded-sm border border-white/[0.08] bg-black/20 p-4"><div className="flex items-center gap-2"><Settings2 className="size-4 text-cyan-100" /><p className="text-sm font-semibold text-white">Provider profiles</p></div><p className="mt-2 text-xs leading-5 text-slate-500">Store only a label, provider type, and credential-free endpoint. Secret material is not accepted in the browser.</p><Input value={providerLabel} onChange={(event) => setProviderLabel(event.target.value)} placeholder="Profile label" className="mt-4 border-white/10 bg-slate-950/70 text-slate-100" /><Input value={providerEndpoint} onChange={(event) => setProviderEndpoint(event.target.value)} placeholder="https://provider.example/v1 (optional)" className="mt-2 border-white/10 bg-slate-950/70 text-slate-100" /><Button onClick={() => void handleCreateProvider()} disabled={createProvider.isPending} className="mt-3 min-h-11 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200">Save metadata only</Button><div className="mt-4 space-y-2">{(providersQuery.data ?? []).map((provider) => <div key={provider.id} className="flex items-center justify-between rounded-sm border border-white/[0.07] px-3 py-2"><span className="text-xs text-slate-300">{provider.label} · {provider.provider}</span><StatusPill value={provider.status} /></div>)}</div></div><div className="rounded-sm border border-white/[0.08] bg-black/20 p-4"><div className="flex items-center gap-2"><Laptop className="size-4 text-fuchsia-200" /><p className="text-sm font-semibold text-white">Runner registration</p></div><p className="mt-2 text-xs leading-5 text-slate-500">Request a signed local CLI or isolated remote runner. Registration alone cannot reach a machine, browser, or terminal.</p><Input value={runnerName} onChange={(event) => setRunnerName(event.target.value)} placeholder="Runner display name" className="mt-4 border-white/10 bg-slate-950/70 text-slate-100" /><select aria-label="Runner type" value={runnerType} onChange={(event) => setRunnerType(event.target.value as typeof runnerType)} className="mt-2 min-h-10 w-full rounded-sm border border-white/10 bg-slate-950 px-3 text-xs text-slate-200"><option value="local_cli">Local CLI</option><option value="remote_isolated">Remote isolated workspace</option></select><Button onClick={() => void handleRegisterRunner()} disabled={registerRunner.isPending} className="mt-3 min-h-11 w-full bg-fuchsia-400/90 text-white hover:bg-fuchsia-300">Request runner pairing</Button><div className="mt-4 space-y-2">{(runnersQuery.data ?? []).map((runner) => <div key={runner.id} className="flex items-center justify-between rounded-sm border border-white/[0.07] px-3 py-2"><span className="text-xs text-slate-300">{runner.displayName}</span><StatusPill value={runner.status} /></div>)}</div></div></div></div>}
      </section>

      <aside className="space-y-4"><section className="rounded-sm border border-white/10 bg-slate-950/80 p-4"><div className="flex items-center justify-between"><p className="hud-label text-amber-100">REVIEW QUEUE</p><span className="rounded-full bg-amber-300/15 px-2 py-1 font-mono text-[10px] text-amber-100">{pendingProposalCount}</span></div><p className="mt-3 text-xs leading-5 text-slate-500">Approval records are time-bounded. Approval never invokes a tool in this browser workspace.</p><div className="mt-4 space-y-3">{(proposalsQuery.data ?? []).slice(0, 5).map((proposal) => <div className="rounded-sm border border-white/[0.08] bg-black/20 p-3" key={proposal.id}><div className="flex items-start justify-between gap-2"><p className="text-xs font-medium text-slate-200">{proposal.title}</p><StatusPill value={proposal.status} /></div><p className="mt-2 font-mono text-[10px] text-slate-600">{proposal.toolKind.replaceAll("_", " ")} · {proposal.riskLevel} risk</p>{proposal.status === "pending" && <div className="mt-3 flex gap-2"><button type="button" onClick={() => void handleResolveProposal(proposal.id, "rejected")} className="min-h-9 flex-1 rounded-sm border border-white/10 text-[10px] text-slate-400 hover:text-white">REJECT</button><button type="button" onClick={() => void handleResolveProposal(proposal.id, "approved")} className="min-h-9 flex-1 rounded-sm border border-amber-300/30 bg-amber-300/10 text-[10px] font-semibold text-amber-100 hover:bg-amber-300/20">APPROVE</button></div>}</div>)}{!proposalsQuery.data?.length && <p className="text-xs text-slate-500">No pending proposals. Use Files, Terminal, or a project tool request to stage one.</p>}</div></section><section className="rounded-sm border border-white/10 bg-slate-950/80 p-4"><div className="flex items-center gap-2"><History className="size-4 text-cyan-100" /><p className="hud-label text-cyan-100">AUDIT TRAIL</p></div><div className="mt-3 space-y-3">{(auditQuery.data ?? []).slice(0, 6).map((event) => <div className="border-l border-cyan-300/25 pl-3" key={event.id}><p className="text-[11px] text-slate-300">{event.eventKind}</p><p className="mt-1 font-mono text-[10px] text-slate-600">{formatTime(event.createdAt)}</p></div>)}{!auditQuery.data?.length && <p className="text-xs text-slate-500">Private audit events appear when you create a project, run, plan, proposal, or connection request.</p>}</div></section></aside>
    </div>
    <JarvisAuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} onAuthenticated={() => void utils.auth.me.invalidate()} />
  </main>;
}

function ToolProposalPanel({ title, icon, selectedKind, setSelectedKind, proposalTitle, setProposalTitle, proposalDetails, setProposalDetails, onCreate, isPending, forceKind }: {
  title: string;
  icon: React.ReactNode;
  selectedKind: (typeof toolKinds)[number]["id"];
  setSelectedKind: (value: (typeof toolKinds)[number]["id"]) => void;
  proposalTitle: string;
  setProposalTitle: (value: string) => void;
  proposalDetails: string;
  setProposalDetails: (value: string) => void;
  onCreate: () => void;
  isPending: boolean;
  forceKind?: (typeof toolKinds)[number]["id"];
}) {
  useEffect(() => { if (forceKind) setSelectedKind(forceKind); }, [forceKind, setSelectedKind]);
  const effectiveKind = forceKind ?? selectedKind;
  return <div><div className="flex items-center gap-3 border-b border-white/[0.07] pb-5">{icon}<div><p className="hud-label text-cyan-100">TOOL PROPOSAL</p><h1 className="mt-1 text-2xl font-semibold text-white">{title}</h1></div></div><div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]"><div className="rounded-sm border border-white/[0.08] bg-black/20 p-4"><label className="text-xs font-medium text-slate-300" htmlFor="proposal-title">Proposal title</label><Input id="proposal-title" value={proposalTitle} onChange={(event) => setProposalTitle(event.target.value)} placeholder="Describe the requested action" className="mt-2 border-white/10 bg-slate-950/70 text-slate-100" /><label className="mt-4 block text-xs font-medium text-slate-300" htmlFor="proposal-details">Review details</label><Textarea id="proposal-details" value={proposalDetails} onChange={(event) => setProposalDetails(event.target.value)} placeholder="Paths, purpose, expected outcome, or target destination. Never paste keys, passwords, or tokens." className="mt-2 min-h-36 border-white/10 bg-slate-950/70 text-slate-100" /><Button onClick={() => void onCreate()} disabled={isPending} className="mt-4 min-h-11 bg-cyan-300 text-slate-950 hover:bg-cyan-200"><ShieldCheck className="mr-2 size-4" />{isPending ? "Staging…" : "Stage for approval"}</Button></div><div className="rounded-sm border border-amber-300/15 bg-amber-300/[0.035] p-4"><AlertTriangle className="size-5 text-amber-200" /><p className="mt-3 text-sm font-semibold text-white">What happens next</p><p className="mt-2 text-xs leading-5 text-slate-500">VirgoYT persists a private, redacted proposal with a content digest and short expiry. Approval records intent only; no local or remote tool is invoked.</p>{!forceKind && <select aria-label="Requested tool kind" value={effectiveKind} onChange={(event) => setSelectedKind(event.target.value as typeof effectiveKind)} className="mt-4 min-h-10 w-full rounded-sm border border-white/10 bg-slate-950 px-3 text-xs text-slate-200">{toolKinds.map((tool) => <option key={tool.id} value={tool.id}>{tool.label}</option>)}</select>}<p className="mt-3 font-mono text-[10px] text-amber-100">{effectiveKind.replaceAll("_", " ")} · review required</p></div></div></div>;
}
