import { Activity, AppWindow, ArrowUpRight, Blocks, ChevronRight, CircleDot, FileStack, Github, Image, LaptopMinimal, LockKeyhole, PackageOpen, Sparkles, TimerReset } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export type JarvisWorkIntent = {
  id: string;
  label: string;
  description: string;
};

export function JarvisMissionControl({
  intents,
  activeIntent,
  activity,
  isWorking,
  pendingApprovals,
  stagedAttachmentCount,
  onIntentChange,
  onOpenBuilder,
  onOpenWorkspace,
  onOpenIntegrations,
}: {
  intents: JarvisWorkIntent[];
  activeIntent: string;
  activity: string[];
  isWorking: boolean;
  pendingApprovals: number;
  stagedAttachmentCount: number;
  onIntentChange: (intent: string) => void;
  onOpenBuilder: () => void;
  onOpenWorkspace: () => void;
  onOpenIntegrations: () => void;
}) {
  const active = intents.find((intent) => intent.id === activeIntent) ?? intents[0];
  const progress = isWorking
    ? ["Request received", `Working in ${active?.label ?? "Assistant"} mode`, "Streaming a reviewed response"]
    : ["Choose a work intent", "Describe the outcome in normal language", "Review artifacts and approve actions when needed"];

  return (
    <section aria-label="Jarvis mission control" className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 shadow-[0_18px_70px_rgba(0,0,0,0.25)] backdrop-blur-xl">
      <div className="border-b border-white/[0.08] px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0"><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md border border-fuchsia-400/25 bg-fuchsia-400/[0.08] text-fuchsia-100"><Sparkles className="size-3.5" /></span><p className="hud-label text-fuchsia-100">JARVIS MISSION CONTROL</p></div><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">Describe the result you want. Jarvis selects a clear working surface; every external, file, deployment, and remote-computer action stays visible and approval-gated.</p></div>
          <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] text-cyan-100"><CircleDot className={cn("size-3", isWorking && "animate-pulse")} />{isWorking ? "WORKING" : "READY"}</span><span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.025] px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] text-slate-400"><LockKeyhole className="size-3" />{pendingApprovals} REVIEW{pendingApprovals === 1 ? "" : "S"}</span></div>
        </div>
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label="Work intent">
          {intents.map((intent) => <button key={intent.id} type="button" role="tab" aria-selected={activeIntent === intent.id} onClick={() => onIntentChange(intent.id)} className={cn("shrink-0 rounded-lg border px-3 py-2 text-left transition", activeIntent === intent.id ? "border-cyan-300/35 bg-cyan-300/[0.08] text-cyan-50" : "border-white/[0.08] bg-white/[0.02] text-slate-500 hover:border-white/20 hover:text-slate-300")}><span className="block text-[11px] font-semibold">{intent.label}</span><span className="mt-0.5 block text-[10px] text-slate-500">{intent.description}</span></button>)}
        </div>
      </div>

      <div className="grid gap-px bg-white/[0.07] lg:grid-cols-[minmax(0,1.15fr)_minmax(250px,0.85fr)_minmax(245px,0.8fr)]">
        <div className="bg-slate-950/80 p-4 sm:p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Activity className="size-4 text-cyan-200" /><p className="hud-label">LIVE WORK SUMMARY</p></div><span className="text-[10px] text-slate-600">VISIBLE, NOT HIDDEN REASONING</span></div><ol className="mt-4 space-y-3">{progress.map((step, index) => <li key={step} className="flex items-start gap-3"><span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[9px] font-mono", isWorking && index === 1 ? "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-100" : "border-cyan-300/20 bg-cyan-300/[0.05] text-cyan-100")} >{isWorking && index === 1 ? <TimerReset className="size-3 animate-spin" /> : index + 1}</span><span className={cn("text-xs leading-5", isWorking && index === 1 ? "text-slate-100" : "text-slate-400")}>{step}</span></li>)}</ol><div className="mt-4 border-t border-white/[0.07] pt-3"><p className="text-[10px] font-semibold tracking-[0.13em] text-slate-600">RECENT ACTIVITY</p><div className="mt-2 space-y-1.5">{activity.slice(0, 2).map((entry) => <p key={entry} className="flex gap-2 text-[11px] leading-5 text-slate-500"><span className="mt-2 size-1 shrink-0 rounded-full bg-cyan-200/70" />{entry}</p>)}</div></div></div>

        <div className="bg-slate-950/80 p-4 sm:p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><FileStack className="size-4 text-fuchsia-200" /><p className="hud-label">ARTIFACT SURFACE</p></div><button type="button" onClick={onOpenWorkspace} className="text-[10px] font-semibold text-cyan-100 hover:text-white">OPEN <ChevronRight className="inline size-3" /></button></div><div className="mt-4 space-y-2"><button type="button" onClick={onOpenWorkspace} className="group flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-left transition hover:border-cyan-300/30"><span><span className="block text-xs text-slate-200">Private workspace</span><span className="mt-0.5 block text-[10px] text-slate-600">Files, code, exports, and write proposals</span></span><PackageOpen className="size-4 text-cyan-200 transition group-hover:translate-x-0.5" /></button><div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-black/15 px-3 py-2.5"><span className="flex items-center gap-2 text-xs text-slate-300"><Image className="size-3.5 text-fuchsia-200" />Staged local context</span><span className="font-mono text-[10px] text-cyan-100">{stagedAttachmentCount}</span></div><p className="text-[10px] leading-4 text-slate-600">Staged filenames remain local until a reviewed upload flow is approved.</p></div></div>

        <div className="bg-slate-950/80 p-4 sm:p-5"><div className="flex items-center gap-2"><LaptopMinimal className="size-4 text-amber-200" /><p className="hud-label">JARVIS COMPUTER</p></div><div className="mt-4 rounded-lg border border-amber-300/15 bg-amber-300/[0.035] p-3"><p className="text-xs font-medium text-amber-100">Proposal-only local runner</p><p className="mt-1 text-[11px] leading-5 text-slate-500">No paired remote computer is connected. Jarvis cannot silently use a browser, terminal, credentials, downloads, or executables.</p></div><div className="mt-3 grid gap-2"><button type="button" onClick={onOpenBuilder} className="rounded-lg border border-fuchsia-400/25 bg-fuchsia-400/[0.07] px-3 py-2.5 text-left text-xs font-semibold text-fuchsia-50 transition hover:bg-fuchsia-400/[0.12]"><AppWindow className="mr-1.5 inline size-3.5" />PLAN AN APP OR WEBSITE</button><button type="button" onClick={onOpenIntegrations} className="rounded-lg border border-white/[0.1] bg-white/[0.02] px-3 py-2.5 text-left text-xs text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100"><Blocks className="mr-1.5 inline size-3.5" />REVIEW INTEGRATIONS</button><a href="/agent" className="rounded-lg border border-white/[0.1] bg-white/[0.02] px-3 py-2.5 text-xs text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100"><Github className="mr-1.5 inline size-3.5" />OPEN VIRGOYT RUNNER <ArrowUpRight className="float-right size-3.5" /></a></div></div>
      </div>
    </section>
  );
}
