import { Activity, AudioLines, Bot, Sparkles } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

export type JarvisCoreState = "idle" | "listening" | "thinking" | "speaking";

const stateCopy: Record<JarvisCoreState, { label: string; detail: string; icon: typeof Bot }> = {
  idle: { label: "STANDING BY", detail: "Jarvis is ready", icon: Bot },
  listening: { label: "LISTENING", detail: "Capturing your command", icon: AudioLines },
  thinking: { label: "REASONING", detail: "Coordinating your agents", icon: Activity },
  speaking: { label: "SPEAKING", detail: "Delivering response", icon: Sparkles },
};

export function JarvisCore({ state = "idle", compact = false }: { state?: JarvisCoreState; compact?: boolean }) {
  const copy = stateCopy[state];
  const Icon = copy.icon;

  return (
    <div className={cn("relative flex flex-col items-center justify-center", compact ? "min-h-44" : "min-h-[360px]") }>
      <div className={cn("jarvis-core", `jarvis-core--${state}`, compact && "jarvis-core--compact")} aria-label={`Jarvis is ${copy.label.toLowerCase()}`}>
        <div className="jarvis-core__halo jarvis-core__halo--outer" />
        <div className="jarvis-core__halo jarvis-core__halo--middle" />
        <div className="jarvis-core__halo jarvis-core__halo--inner" />
        <div className="jarvis-core__arc jarvis-core__arc--one" />
        <div className="jarvis-core__arc jarvis-core__arc--two" />
        <div className="jarvis-core__axis" />
        <div className="jarvis-core__waveform" aria-hidden="true">
          {Array.from({ length: 11 }, (_, index) => <span key={index} className="jarvis-core__wavebar" />)}
        </div>
        <div className="jarvis-core__nucleus"><Icon className="size-7" strokeWidth={1.5} /></div>
      </div>
      <div className="mt-5 text-center">
        <p className="font-mono text-[10px] font-semibold tracking-[0.28em] text-cyan-200">{copy.label}</p>
        <p className="mt-1 text-sm text-slate-400">{copy.detail}</p>
      </div>
    </div>
  );
}
