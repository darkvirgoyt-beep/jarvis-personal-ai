import { BarChart3, BookOpenCheck, Calculator, ExternalLink, Search, ShieldCheck } from "lucide-react";
import React, { useMemo, useState } from "react";
import { HudPanel } from "./HudPanel";

type JarvisResearchDeskProps = {
  mode: "research" | "data";
  onSendBrief: (prompt: string) => void;
};

function parseNumbers(value: string) {
  return (value.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number).filter(Number.isFinite);
}

export function JarvisResearchDesk({ mode, onSendBrief }: JarvisResearchDeskProps) {
  const [topic, setTopic] = useState("");
  const [numbersText, setNumbersText] = useState("");
  const numbers = useMemo(() => parseNumbers(numbersText), [numbersText]);
  const statistics = useMemo(() => {
    if (!numbers.length) return null;
    const sum = numbers.reduce((total, value) => total + value, 0);
    return { count: numbers.length, sum, average: sum / numbers.length, min: Math.min(...numbers), max: Math.max(...numbers) };
  }, [numbers]);

  if (mode === "data") {
    return (
      <HudPanel className="overflow-hidden">
        <div className="border-b border-cyan-300/10 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2"><Calculator className="size-4 text-cyan-100" /><p className="hud-label">LOCAL DATA DESK</p></div>
          <p className="mt-1 text-xs leading-5 text-slate-500">Paste numbers, a simple CSV column, or a calculation list. The summary below is calculated in this browser; nothing is uploaded until you explicitly ask Jarvis to analyze it.</p>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
          <div>
            <label className="hud-label" htmlFor="jarvis-data-input">NUMERIC INPUT</label>
            <textarea id="jarvis-data-input" value={numbersText} onChange={(event) => setNumbersText(event.target.value)} placeholder="Example: 124, 98, 136, 142\nOr paste a CSV column…" className="mt-2 min-h-28 w-full resize-y rounded-lg border border-white/10 bg-black/25 p-3 font-mono text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-300/35" />
            <button type="button" disabled={!numbers.length} onClick={() => onSendBrief(`Analyze this numeric data and explain the key patterns, assumptions, and a clear table of findings. Do not treat this as a deployment or external action.\n\nData:\n${numbersText}`)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-40"><BarChart3 className="size-3.5" /> ANALYZE WITH JARVIS</button>
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-black/15 p-3.5">
            <p className="hud-label">INSTANT SUMMARY</p>
            {statistics ? <dl className="mt-3 space-y-2 text-xs"><div className="flex justify-between"><dt className="text-slate-500">Values</dt><dd className="font-mono text-cyan-100">{statistics.count}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Sum</dt><dd className="font-mono text-slate-200">{statistics.sum.toLocaleString()}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Average</dt><dd className="font-mono text-slate-200">{statistics.average.toFixed(2)}</dd></div><div className="flex justify-between"><dt className="text-slate-500">Range</dt><dd className="font-mono text-slate-200">{statistics.min} — {statistics.max}</dd></div></dl> : <p className="mt-3 text-xs leading-5 text-slate-600">Enter numeric values to calculate a private local summary.</p>}
          </div>
        </div>
      </HudPanel>
    );
  }

  return (
    <HudPanel className="overflow-hidden">
      <div className="border-b border-fuchsia-300/10 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2"><Search className="size-4 text-fuchsia-100" /><p className="hud-label">SOURCE-LINKED RESEARCH</p></div>
        <p className="mt-1 text-xs leading-5 text-slate-500">Create a focused research brief. Jarvis will distinguish findings from assumptions and should only provide links it can identify clearly; opening an external destination still requires your review.</p>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_250px] sm:p-5">
        <div>
          <label className="hud-label" htmlFor="jarvis-research-topic">TOPIC OR QUESTION</label>
          <input id="jarvis-research-topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="For example: BGMI official download options and device requirements" className="mt-2 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-700 focus:border-fuchsia-300/35" />
          <button type="button" disabled={!topic.trim()} onClick={() => onSendBrief(`Research brief: ${topic.trim()}\n\nProvide a concise, source-linked answer. Separate verified facts, assumptions, and unknowns. Use official or primary sources where possible. Do not invent citations, URLs, prices, availability, or access. Suggest external links for review rather than opening any destination.`)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-fuchsia-300/25 bg-fuchsia-300/10 px-3 py-2 text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-300/15 disabled:cursor-not-allowed disabled:opacity-40"><BookOpenCheck className="size-3.5" /> PREPARE RESEARCH BRIEF</button>
        </div>
        <aside className="rounded-lg border border-white/[0.08] bg-black/15 p-3.5">
          <p className="hud-label">RESEARCH CONTRACT</p>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-slate-500"><li className="flex gap-2"><ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-cyan-100" />Never represent unverified claims as facts.</li><li className="flex gap-2"><ExternalLink className="mt-0.5 size-3.5 shrink-0 text-fuchsia-100" />Links are proposed for review, not opened automatically.</li></ul>
        </aside>
      </div>
    </HudPanel>
  );
}
