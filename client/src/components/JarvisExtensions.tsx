import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { JarvisModelSelector } from "@/components/JarvisModelSelector";
import { selectJarvisBrowserVoice } from "@/lib/jarvisVoice";
import { buildJarvisCodingPrompt } from "../../../shared/jarvisCoding";
import { parseJarvisSourceLedger } from "../../../shared/jarvisResearch";
import { BookOpen, Bot, Code2, Copy, Database, PlugZap, Save, Search, Sparkles } from "lucide-react";
import React from "react";
import { useEffect, useState } from "react";

type Agent = "Coding" | "Research" | "General";

export function JarvisExtensions({ onRun, onCopyLatest, onExportLatest, voiceStorageKey }: { onRun: (prompt: string, agent: Agent) => void; onCopyLatest: () => void; onExportLatest: () => void; voiceStorageKey: string }) {
  const utils = trpc.useUtils();
  const preferences = trpc.jarvis.preferences.get.useQuery();
  const updatePreferences = trpc.jarvis.preferences.update.useMutation();
  const memories = trpc.jarvis.memory.list.useQuery();
  const updateMemory = trpc.jarvis.memory.update.useMutation();
  const tasks = trpc.jarvis.tasks.list.useQuery();
  const createTask = trpc.jarvis.tasks.create.useMutation();
  const confirmations = trpc.jarvis.confirmations.list.useQuery();
  const researchRecords = trpc.jarvis.research.list.useQuery();
  const [memoryEdit, setMemoryEdit] = useState<{ id: number; content: string; category: "preference" | "project" | "personal" | "fact" | "note" }>();
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [dueDate, setDueDate] = useState("");
  const [researchTopic, setResearchTopic] = useState("");
  const [researchSources, setResearchSources] = useState("");
  const [codingBrief, setCodingBrief] = useState("");
  const [codingLanguage, setCodingLanguage] = useState("TypeScript");
  const [customCommand, setCustomCommand] = useState("");
  const [plugins, setPlugins] = useState({ research: false, coding: false, automation: false });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const refreshVoices = () => {
      const available = window.speechSynthesis.getVoices();
      setVoices(available);
      const savedVoice = localStorage.getItem(voiceStorageKey) ?? preferences.data?.voiceName;
      setSelectedVoice(savedVoice ?? selectJarvisBrowserVoice(available)?.name ?? "");
    };
    refreshVoices();
    window.speechSynthesis.addEventListener("voiceschanged", refreshVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", refreshVoices);
  }, [preferences.data?.voiceName, voiceStorageKey]);

  useEffect(() => {
    try {
      const saved = preferences.data?.pluginSettings ? JSON.parse(preferences.data.pluginSettings) : null;
      if (saved && typeof saved === "object") setPlugins((current) => ({ ...current, ...saved }));
    } catch {
      setPlugins({ research: false, coding: false, automation: false });
    }
    document.documentElement.dataset.jarvisVisual = preferences.data?.visualMode ?? "hud";
  }, [preferences.data?.pluginSettings, preferences.data?.visualMode]);

  const togglePlugin = (id: keyof typeof plugins) => {
    setPlugins((current) => {
      const next = { ...current, [id]: !current[id] };
      void updatePreferences.mutateAsync({ pluginSettings: JSON.stringify(next) }).then(() => utils.jarvis.preferences.get.invalidate());
      return next;
    });
  };

  const saveTask = async () => {
    const title = taskTitle.trim();
    if (!title) return;
    await createTask.mutateAsync({
      title,
      priority: taskPriority,
      dueAt: dueDate ? new Date(`${dueDate}T12:00:00`) : null,
    });
    setTaskTitle("");
    setDueDate("");
    await utils.jarvis.tasks.list.invalidate();
  };

  const saveMemory = async () => {
    if (!memoryEdit?.content.trim()) return;
    await updateMemory.mutateAsync(memoryEdit);
    setMemoryEdit(undefined);
    await utils.jarvis.memory.list.invalidate();
  };

  const pendingPlans = (confirmations.data ?? []).filter((item) => item.status === "pending");
  const describePlan = (payload: string) => {
    try {
      const parsed = JSON.parse(payload) as { details?: unknown };
      return typeof parsed.details === "string" ? parsed.details : "Jarvis prepared this action for review.";
    } catch {
      return "Jarvis prepared this action for review.";
    }
  };
  const sourceUrls = researchSources.split(/\s*,\s*|\n/).map((value) => value.trim()).filter((value) => { try { return new URL(value).protocol === "https:"; } catch { return false; } });

  return (
    <section className="hud-panel mt-3 overflow-hidden p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="hud-label">JARVIS // CONTROL DECK</p>
          <h2 className="mt-1 text-base font-semibold text-slate-100">Personal settings and specialist workspaces</h2>
        </div>
        <span className="rounded-sm border border-cyan-300/20 bg-cyan-300/5 px-2 py-1 font-mono text-[10px] text-cyan-100">PRIVATE & USER-CONTROLLED</span>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <section className="rounded-sm border border-cyan-300/15 bg-cyan-300/[0.025] p-3">
          <div className="flex items-center gap-2"><Bot className="size-4 text-cyan-200" /><p className="hud-label">VOICE PERSONALITY</p></div>
          <div className="mt-3 rounded-sm border border-cyan-300/15 bg-black/20 px-2.5 py-2" aria-label="Jarvis inference engine">
            <p className="text-[9px] tracking-[0.16em] text-slate-500">INFERENCE ENGINE</p>
            <p className="mt-1 text-xs font-medium text-cyan-100">Nemotron 3 Ultra</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-600">Default primary server-side engine with a resilient fallback when unavailable.</p>
          </div>
          <JarvisModelSelector className="mt-3 block text-xs text-slate-400" model={preferences.data?.model} onChange={(model) => void updatePreferences.mutateAsync({ model }).then(() => utils.jarvis.preferences.get.invalidate())} />
          <label className="mt-3 block text-xs text-slate-400">Response style
            <select value={preferences.data?.personality ?? "balanced"} onChange={(event) => void updatePreferences.mutateAsync({ personality: event.target.value as "balanced" | "concise" | "strategic" | "creative" }).then(() => utils.jarvis.preferences.get.invalidate())} className="mt-1.5 w-full rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-300/35">
              <option value="balanced">Balanced</option><option value="concise">Concise</option><option value="strategic">Strategic</option><option value="creative">Creative</option>
            </select>
          </label>
          <label className="mt-3 block text-xs text-slate-400">Speech rate: {preferences.data?.speechRate ?? 100}%
            <input type="range" min="70" max="140" step="5" value={preferences.data?.speechRate ?? 100} onChange={(event) => void updatePreferences.mutateAsync({ speechRate: Number(event.target.value) }).then(() => utils.jarvis.preferences.get.invalidate())} className="mt-2 w-full accent-cyan-300" />
          </label>
          <label className="mt-3 block text-xs text-slate-400">Browser voice
            <select value={selectedVoice} onChange={(event) => { const next = event.target.value; setSelectedVoice(next); localStorage.setItem(voiceStorageKey, next); void updatePreferences.mutateAsync({ voiceName: next || null }).then(() => utils.jarvis.preferences.get.invalidate()); }} className="mt-1.5 w-full rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-300/35">
              <option value="">Jarvis default — warm feminine when available</option>{voices.filter((voice) => /^en/i.test(voice.lang)).map((voice) => <option key={`${voice.name}-${voice.lang}`} value={voice.name}>{voice.name}</option>)}
            </select>
          </label>
          <p className="mt-2 text-[10px] leading-4 text-slate-600">Jarvis prefers a warm feminine installed English voice by default, then a local English fallback. Voice selections use browser-local speech voices; no audio is sent to a third-party text-to-speech service.</p>
        </section>

        <section className="rounded-sm border border-fuchsia-400/15 bg-fuchsia-400/[0.025] p-3">
          <div className="flex items-center gap-2"><Database className="size-4 text-fuchsia-200" /><p className="hud-label">TASK PLANNER</p></div>
          <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" className="mt-3 w-full rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-fuchsia-400/35" />
          <div className="mt-2 grid grid-cols-2 gap-2"><select value={taskPriority} onChange={(event) => setTaskPriority(event.target.value as typeof taskPriority)} className="rounded-sm border border-white/10 bg-black/35 px-2 py-2 text-xs text-slate-300"><option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option></select><input value={dueDate} onChange={(event) => setDueDate(event.target.value)} type="date" className="rounded-sm border border-white/10 bg-black/35 px-2 py-2 text-xs text-slate-300" /></div>
          <button disabled={!taskTitle.trim() || createTask.isPending} onClick={() => void saveTask()} className="mt-2 w-full rounded-sm border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-2 text-[10px] font-semibold text-fuchsia-100 transition hover:bg-fuchsia-400/20 disabled:opacity-40">ADD PRIVATE TASK</button>
          <p className="mt-2 text-[10px] text-slate-600">{tasks.data?.filter((task) => task.status !== "done").length ?? 0} active tasks in your workspace.</p>
        </section>

        <section className="rounded-sm border border-amber-300/15 bg-amber-300/[0.025] p-3">
          <div className="flex items-center gap-2"><PlugZap className="size-4 text-amber-200" /><p className="hud-label">PLUGIN FOUNDATION</p></div>
          <p className="mt-2 text-[11px] leading-5 text-slate-500">Plugins are disabled by default and do not receive data or execute actions in this release.</p>
          <div className="mt-3 space-y-2">{([ ["research", "Research sources"], ["coding", "Code workspace"], ["automation", "Automations"] ] as const).map(([id, label]) => <button key={id} onClick={() => togglePlugin(id)} className={cn("flex w-full items-center justify-between rounded-sm border px-2.5 py-2 text-left text-xs transition", plugins[id] ? "border-amber-300/35 bg-amber-300/10 text-amber-100" : "border-white/[0.08] bg-black/20 text-slate-500")}><span>{label}</span><span className="font-mono text-[9px]">{plugins[id] ? "ENABLED" : "OFF"}</span></button>)}</div>
          <input value={customCommand} onChange={(event) => setCustomCommand(event.target.value)} placeholder="Custom command" className="mt-3 w-full rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-amber-300/35" />
          <button disabled={!customCommand.trim()} onClick={() => { onRun(`Follow this user-defined Jarvis command safely: ${customCommand.trim()}`, "General"); setCustomCommand(""); }} className="mt-2 w-full rounded-sm border border-amber-300/25 bg-amber-300/[0.06] px-2.5 py-2 text-[10px] font-semibold text-amber-100 disabled:opacity-40">RUN CUSTOM COMMAND</button>
          <label className="mt-3 flex items-center justify-between gap-3 text-[10px] text-slate-500">Continuous conversation
            <input aria-label="Continuous conversation" type="checkbox" checked={Boolean(preferences.data?.continuousMode)} onChange={(event) => void updatePreferences.mutateAsync({ continuousMode: event.target.checked }).then(() => utils.jarvis.preferences.get.invalidate())} className="size-4 accent-fuchsia-400" />
          </label>
          <label className="mt-3 block text-[10px] text-slate-500">Privacy mode<select value={preferences.data?.privacyMode ?? "standard"} onChange={(event) => void updatePreferences.mutateAsync({ privacyMode: event.target.value as "standard" | "minimal" }).then(() => utils.jarvis.preferences.get.invalidate())} className="mt-1 w-full rounded-sm border border-white/10 bg-black/35 px-2 py-1.5 text-xs text-slate-300"><option value="standard">Standard private history</option><option value="minimal">Minimal local context</option></select></label>
          <label className="mt-2 block text-[10px] text-slate-500">Visual motion<select value={preferences.data?.visualMode ?? "hud"} onChange={(event) => void updatePreferences.mutateAsync({ visualMode: event.target.value as "hud" | "reduced_motion" }).then(() => utils.jarvis.preferences.get.invalidate())} className="mt-1 w-full rounded-sm border border-white/10 bg-black/35 px-2 py-1.5 text-xs text-slate-300"><option value="hud">HUD motion</option><option value="reduced_motion">Reduced motion</option></select></label>
        </section>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_1fr_1.1fr]">
        <section className="rounded-sm border border-white/[0.08] bg-black/20 p-3">
          <div className="flex items-center gap-2"><Search className="size-4 text-cyan-200" /><p className="hud-label">RESEARCH AGENT</p></div>
          <input value={researchTopic} onChange={(event) => setResearchTopic(event.target.value)} placeholder="Topic to investigate" className="mt-3 w-full rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/35" />
          <textarea value={researchSources} onChange={(event) => setResearchSources(event.target.value)} placeholder="Optional HTTPS source URLs, comma-separated" className="mt-2 min-h-16 w-full resize-none rounded-sm border border-white/10 bg-black/35 p-2.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/35" />
          <button disabled={!researchTopic.trim()} onClick={() => { onRun(`Research ${researchTopic.trim()}. Use only this user-supplied source ledger when assessing cited material: ${sourceUrls.length ? sourceUrls.join(", ") : "No source URLs supplied"}. Clearly distinguish verified source claims, uncertainty, and next steps.`, "Research"); setResearchTopic(""); }} className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm border border-cyan-300/30 bg-cyan-300/10 px-2.5 py-2 text-[10px] font-semibold text-cyan-50 transition hover:bg-cyan-300/20 disabled:opacity-40"><BookOpen className="size-3.5" />START RESEARCH</button>
          {sourceUrls.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{sourceUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="max-w-full truncate rounded-sm border border-cyan-300/15 px-1.5 py-1 text-[9px] text-cyan-100 hover:bg-cyan-300/10">{new URL(url).hostname}</a>)}</div>}
          <p className="mt-2 text-[10px] text-slate-600">Research source ledgers and summaries are saved privately. Jarvis labels missing source evidence rather than fabricating citations.</p>
          {(researchRecords.data ?? []).slice(0, 2).map((record) => <article key={record.id} className="mt-2 rounded-sm border border-cyan-300/10 bg-black/20 p-2"><p className="truncate text-[10px] font-medium text-cyan-100">{record.topic}</p><p className="mt-1 line-clamp-2 text-[10px] text-slate-500">{record.summary}</p><p className="mt-1 text-[9px] text-slate-600">{(() => { try { return `${(JSON.parse(record.sourceLedger) as string[]).length} saved HTTPS source(s)`; } catch { return "No saved source URLs"; } })()}</p></article>)}
          {(researchRecords.data ?? []).slice(0, 2).map((record) => {
            const ledger = parseJarvisSourceLedger(record.sourceLedger);
            return ledger.length > 0 ? <div key={`sources-${record.id}`} className="mt-1 flex flex-wrap gap-1" aria-label={`Saved sources for ${record.topic}`}>{ledger.map((source) => <a key={source} href={source} target="_blank" rel="noreferrer" className="max-w-full truncate rounded-sm border border-cyan-300/15 px-1.5 py-1 text-[9px] text-cyan-100 hover:bg-cyan-300/10">{new URL(source).hostname}</a>)}</div> : null;
          })}
        </section>

        <section className="rounded-sm border border-white/[0.08] bg-black/20 p-3">
          <div className="flex items-center gap-2"><Code2 className="size-4 text-fuchsia-200" /><p className="hud-label">CODING AGENT</p></div>
          <input value={codingBrief} onChange={(event) => setCodingBrief(event.target.value)} placeholder="Describe the code task" className="mt-3 w-full rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-fuchsia-400/35" />
          <select value={codingLanguage} onChange={(event) => setCodingLanguage(event.target.value)} className="mt-2 w-full rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-300"><option>TypeScript</option><option>Python</option><option>JavaScript</option><option>React</option><option>SQL</option><option>Other</option></select>
          <button disabled={!codingBrief.trim()} onClick={() => { onRun(buildJarvisCodingPrompt(codingLanguage, codingBrief), "Coding"); setCodingBrief(""); }} className="mt-2 flex w-full items-center justify-center gap-2 rounded-sm border border-fuchsia-400/30 bg-fuchsia-400/10 px-2.5 py-2 text-[10px] font-semibold text-fuchsia-50 transition hover:bg-fuchsia-400/20 disabled:opacity-40"><Copy className="size-3.5" />PREPARE CODE PLAN</button>
          <button onClick={onCopyLatest} className="mt-2 w-full rounded-sm border border-white/10 bg-black/20 px-2.5 py-2 text-[10px] font-semibold text-slate-400 transition hover:border-fuchsia-400/30 hover:text-fuchsia-100">COPY LATEST RESPONSE</button>
          <button onClick={onExportLatest} className="mt-2 w-full rounded-sm border border-white/10 bg-black/20 px-2.5 py-2 text-[10px] font-semibold text-slate-400 transition hover:border-fuchsia-400/30 hover:text-fuchsia-100">DOWNLOAD LATEST PLAN</button>
          <p className="mt-2 text-[10px] text-slate-600">Code output is reviewable and copied manually; Jarvis cannot modify your files.</p>
        </section>

        <section className="rounded-sm border border-white/[0.08] bg-black/20 p-3">
          <div className="flex items-center gap-2"><Save className="size-4 text-cyan-200" /><p className="hud-label">EDIT MEMORY</p></div>
          {memoryEdit ? <><textarea value={memoryEdit.content} onChange={(event) => setMemoryEdit({ ...memoryEdit, content: event.target.value })} className="mt-3 min-h-20 w-full resize-none rounded-sm border border-white/10 bg-black/35 p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-300/35" /><div className="mt-2 flex gap-2"><select value={memoryEdit.category} onChange={(event) => setMemoryEdit({ ...memoryEdit, category: event.target.value as typeof memoryEdit.category })} className="min-w-0 flex-1 rounded-sm border border-white/10 bg-black/35 px-2 text-xs text-slate-300"><option value="note">Note</option><option value="preference">Preference</option><option value="project">Project</option><option value="personal">Personal</option><option value="fact">Fact</option></select><button onClick={() => void saveMemory()} className="rounded-sm border border-cyan-300/30 bg-cyan-300/10 px-3 text-[10px] font-semibold text-cyan-100">SAVE</button></div></> : <div className="mt-3 space-y-2">{(memories.data ?? []).slice(0, 3).map((memory) => <button key={memory.id} onClick={() => setMemoryEdit({ id: memory.id, content: memory.content, category: memory.category as typeof memoryEdit extends undefined ? never : "note" })} className="block w-full truncate rounded-sm border border-white/[0.07] bg-black/20 px-2.5 py-2 text-left text-xs text-slate-500 transition hover:border-cyan-300/25 hover:text-slate-200">{memory.content}</button>)}{!memories.data?.length && <p className="py-5 text-center text-xs text-slate-600">Save a memory from the private workspace to edit it here.</p>}</div>}
        </section>
      </div>

      {pendingPlans.length > 0 && <section className="mt-3 rounded-sm border border-amber-300/20 bg-amber-300/[0.035] p-3">
        <div className="flex items-center gap-2"><Sparkles className="size-4 text-amber-200" /><p className="hud-label">REVIEWABLE ACTION PLANS</p></div>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">Jarvis cannot execute these proposed actions. Review the details, then decide in the Private Workspace approval gate.</p>
        <div className="mt-3 space-y-2">{pendingPlans.map((plan) => <details key={plan.id} className="rounded-sm border border-amber-300/15 bg-black/20 px-3 py-2 text-xs text-slate-400"><summary className="cursor-pointer font-medium text-amber-100">{plan.action} <span className="ml-2 font-mono text-[9px] text-slate-600">{plan.riskLevel} RISK</span></summary><p className="mt-2 whitespace-pre-wrap leading-5 text-slate-500">{describePlan(plan.payload)}</p></details>)}</div>
      </section>}
    </section>
  );
}
