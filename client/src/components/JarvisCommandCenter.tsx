import { Activity, Bot, CheckCircle2, Clock3, Code2, LaptopMinimal, ShieldCheck, TerminalSquare } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getJarvisWorkflowTools } from "../../../shared/jarvisAdvancedWorkflow";
import type { JarvisPromptRoute } from "@/lib/jarvisIntentRouter";
import { cn } from "@/lib/utils";

export function JarvisCommandCenter({
  route,
  activity,
  isWorking,
  onRequestRunner,
  onOpenCompileWorkspace,
}: {
  route: JarvisPromptRoute;
  activity: string[];
  isWorking: boolean;
  onRequestRunner: (profile: "ubuntu" | "kali") => void;
  onOpenCompileWorkspace: () => void;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const profile = route.runnerProfile ?? "ubuntu";
  const needsRunner = route.needsRunner;
  const activeToolLabels = getJarvisWorkflowTools(route.intent).map((contract) => contract.label).join(" · ");

  return (
    <section aria-label="Jarvis advanced operations" className="overflow-hidden rounded-xl border border-cyan-300/15 bg-slate-950/65 shadow-[0_16px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 border-b border-white/[0.08] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md border border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100"><TerminalSquare className="size-3.5" /></span><div><p className="hud-label text-cyan-100">JARVIS ADVANCED OPS</p><p className="mt-0.5 text-[11px] text-slate-500">Normal language in. Reviewed workflow out.</p></div></div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-fuchsia-400/25 bg-fuchsia-400/[0.08] px-2.5 py-1 font-mono text-[10px] tracking-[0.11em] text-fuchsia-100"><Bot className="size-3" />AUTO-ROUTED</span>
      </div>

      <div className="grid gap-px bg-white/[0.07] xl:grid-cols-[minmax(0,1.15fr)_minmax(250px,0.85fr)_minmax(260px,0.9fr)]">
        <div className="bg-slate-950/80 p-4">
          <div className="flex items-center justify-between gap-3"><p className="hud-label">COMMAND INTERPRETATION</p><span className={cn("rounded-full border px-2 py-1 font-mono text-[9px] tracking-[0.11em]", isWorking ? "border-cyan-300/30 bg-cyan-300/[0.08] text-cyan-100" : "border-white/10 text-slate-500")}>{isWorking ? "WORKING" : "READY"}</span></div>
          <div className="mt-4 rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/[0.045] p-3"><div className="flex items-center gap-2"><Code2 className="size-3.5 text-fuchsia-200" /><p className="text-xs font-semibold text-fuchsia-50">{route.label}</p></div><p className="mt-2 text-[11px] leading-5 text-slate-400">{route.summary}</p></div>
          <div className="mt-3 rounded-lg border border-white/[0.08] bg-black/25 p-3 font-mono text-[10px] leading-5 text-slate-500"><p><span className="text-cyan-200">›</span> classify.prompt <span className="text-slate-300">{route.intent}</span></p><p><span className="text-cyan-200">›</span> {route.executionLine}</p><p><span className="text-cyan-200">›</span> {activeToolLabels ? `review gate: ${activeToolLabels}` : "no external tool requested"}</p><p><span className="text-cyan-200">›</span> {isWorking ? "streaming reviewed response…" : "awaiting your next normal-language command"}</p></div>
        </div>

        <div className="bg-slate-950/80 p-4"><div className="flex items-center gap-2"><Clock3 className="size-4 text-amber-200" /><p className="hud-label">TIME & CONTEXT</p></div><p className="mt-4 font-mono text-sm text-amber-100">{now.toLocaleString()}</p><p className="mt-1 text-[10px] leading-4 text-slate-600">Local device clock. Jarvis receives a separate server-side UTC timestamp with every new response.</p><div className="mt-4 space-y-2"><div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-black/15 px-3 py-2"><span className="text-[11px] text-slate-400">Artifacts</span><span className="font-mono text-[10px] text-cyan-100">REVIEWED</span></div><div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-black/15 px-3 py-2"><span className="text-[11px] text-slate-400">External actions</span><span className="font-mono text-[10px] text-amber-100">APPROVAL</span></div></div></div>

        <div className="bg-slate-950/80 p-4"><div className="flex items-center gap-2"><LaptopMinimal className="size-4 text-cyan-200" /><p className="hud-label">LIVE ENVIRONMENT</p></div><div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/[0.045] p-3"><p className="text-xs font-semibold text-amber-100">RUNNER UNCONNECTED</p><p className="mt-1 text-[10px] leading-5 text-slate-500">Jarvis can diagnose, plan, generate artifacts, and prepare requirements now. A real terminal, browser, build, or sandbox session needs a visible connected environment and your approval.</p></div>{needsRunner ? <div className="mt-3 space-y-2"><button type="button" onClick={onOpenCompileWorkspace} className="flex w-full items-center justify-between rounded-lg border border-fuchsia-300/30 bg-fuchsia-400/[0.08] px-3 py-2.5 text-left text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-400/[0.14]"><span>OPEN PAIRED COMPILE WORKER</span><TerminalSquare className="size-3.5" /></button><button type="button" onClick={() => onRequestRunner(profile)} className="flex w-full items-center justify-between rounded-lg border border-cyan-300/30 bg-cyan-300/[0.07] px-3 py-2.5 text-left text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.13]"><span>REQUEST {profile.toUpperCase()} RUNNER REVIEW</span><ShieldCheck className="size-3.5" /></button></div> : <div className="mt-3 flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.025] px-3 py-2.5 text-[11px] text-slate-500"><CheckCircle2 className="size-3.5 text-cyan-200" />No runner is required to start this review.</div>}</div>
      </div>

      <div className="border-t border-white/[0.07] bg-black/10 px-4 py-3"><div className="flex items-center gap-2"><Activity className="size-3.5 text-cyan-200" /><p className="text-[10px] font-semibold tracking-[0.13em] text-slate-500">VISIBLE ACTIVITY TELEMETRY</p></div><div className="mt-2 grid gap-1.5 md:grid-cols-3">{activity.slice(0, 3).map((entry) => <p key={entry} className="truncate rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-[10px] text-slate-500"><span className="mr-1.5 text-cyan-200">›</span>{entry}</p>)}</div></div>
    </section>
  );
}
