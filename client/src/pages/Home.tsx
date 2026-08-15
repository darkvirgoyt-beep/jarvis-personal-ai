import { useAuth } from "@/_core/hooks/useAuth";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { JarvisActionDock } from "@/components/JarvisActionDock";
import { JarvisBuilderDock } from "@/components/JarvisBuilderDock";
import { JarvisWorkspaceDock } from "@/components/JarvisWorkspaceDock";
import { HudPanel } from "@/components/HudPanel";
import { JarvisCore, type JarvisCoreState } from "@/components/JarvisCore";
import { JarvisExtensions } from "@/components/JarvisExtensions";
import { JarvisModelSelector } from "@/components/JarvisModelSelector";
import { JarvisModeNav, type JarvisWorkspaceMode } from "@/components/JarvisModeNav";
import { WakeWordListener } from "@/components/WakeWordListener";
import { startLogin } from "@/const";
import { streamJarvisResponse, transcribeJarvisAudio } from "@/lib/jarvisApi";
import { initialJarvisInteractionState, transitionJarvisInteraction, type JarvisInteractionEvent } from "@/lib/jarvisInteractionState";
import { buildJarvisMarkdownExport, getLatestJarvisAssistantOutput } from "@/lib/jarvisOutput";
import { getJarvisVoiceProfile, selectJarvisBrowserVoice } from "@/lib/jarvisVoice";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, BellRing, BrainCircuit, Check, ChevronRight, CircleDot, Code2, Command, Cpu, Database, FileText, Layers3, LockKeyhole, Mic, Orbit, Plus, Search, Settings2, ShieldCheck, Sparkles, TerminalSquare, Volume2, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

type Agent = "General" | "Coding" | "Research" | "Files" | "System" | "Creative";

const agentOptions: { name: Agent; icon: typeof Sparkles; description: string }[] = [
  { name: "General", icon: Sparkles, description: "Conversational intelligence" },
  { name: "Coding", icon: Code2, description: "Plan, write, and explain code" },
  { name: "Research", icon: Search, description: "Investigate with sources" },
  { name: "Files", icon: FileText, description: "Prepare safe file actions" },
  { name: "System", icon: TerminalSquare, description: "Coordinate trusted tools" },
  { name: "Creative", icon: BrainCircuit, description: "Develop original ideas" },
];

const quickCommands = [
  "/task Outline a priority plan for tomorrow",
  "/remember I prefer concise strategic updates",
  "Research a topic with sources",
];

const statusCopy: Record<JarvisCoreState, string> = {
  idle: "All systems calibrated",
  listening: "Voice link open",
  thinking: "Reasoning across agents",
  speaking: "Voice response in progress",
};

function StatusDot({ state }: { state: JarvisCoreState }) {
  return <span className={cn("status-dot", `status-dot--${state}`)} aria-hidden="true" />;
}

function formatActionPlan(payload: string) {
  try {
    const parsed = JSON.parse(payload) as { details?: unknown };
    return typeof parsed.details === "string" ? parsed.details : "Jarvis prepared this action for your review.";
  } catch {
    return "Jarvis prepared this action for your review.";
  }
}

export default function Home() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [agent, setAgent] = useState<Agent>("General");
  const [interaction, setInteraction] = useState(initialJarvisInteractionState);
  const { coreState, voiceState, isSending } = interaction;
  const [activeMode, setActiveMode] = useState<JarvisWorkspaceMode>("command");
  const [responseMode, setResponseMode] = useState<"primary" | "managed" | "basic" | "provider-auth">("primary");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [contextualSuggestions, setContextualSuggestions] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [memoryDraft, setMemoryDraft] = useState("");
  const [taskDraft, setTaskDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activity, setActivity] = useState<string[]>(["Jarvis core initialized", "Privacy shield active", "Awaiting command"]);
  const [activeConversationId, setActiveConversationId] = useState<number>();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const tasksQuery = trpc.jarvis.tasks.list.useQuery(undefined, { enabled: Boolean(user) });
  const memoriesQuery = trpc.jarvis.memory.list.useQuery(undefined, { enabled: Boolean(user) });
  const confirmationsQuery = trpc.jarvis.confirmations.list.useQuery(undefined, { enabled: Boolean(user) });
  const preferencesQuery = trpc.jarvis.preferences.get.useQuery(undefined, { enabled: Boolean(user) });
  const updatePreferences = trpc.jarvis.preferences.update.useMutation();
  const createMemory = trpc.jarvis.memory.create.useMutation();
  const deleteMemory = trpc.jarvis.memory.delete.useMutation();
  const createTask = trpc.jarvis.tasks.create.useMutation();
  const updateTask = trpc.jarvis.tasks.update.useMutation();
  const resolveConfirmation = trpc.jarvis.confirmations.resolve.useMutation();
  const proposeConfirmation = trpc.jarvis.confirmations.propose.useMutation();
  const workspaceItemsQuery = trpc.jarvis.workspace.list.useQuery(undefined, { enabled: Boolean(user) });
  const proposeWorkspace = trpc.jarvis.workspace.propose.useMutation();
  const executeWorkspace = trpc.jarvis.workspace.execute.useMutation();
  const conversationsQuery = trpc.jarvis.conversations.list.useQuery(undefined, { enabled: Boolean(user) });
  const historyQuery = trpc.jarvis.conversations.messages.useQuery(
    { conversationId: activeConversationId ?? 0 },
    { enabled: Boolean(user && activeConversationId) },
  );

  const selectedAgent = useMemo(() => agentOptions.find((item) => item.name === agent) ?? agentOptions[0], [agent]);
  const agentId = agent.toLowerCase() as "general" | "coding" | "research" | "files" | "system" | "creative";
  const openTasks = (tasksQuery.data ?? []).filter((task) => task.status !== "done");
  const pendingConfirmations = (confirmationsQuery.data ?? []).filter((item) => item.status === "pending");

  useEffect(() => {
    if (!activeConversationId && conversationsQuery.data?.[0]) {
      setActiveConversationId(conversationsQuery.data[0].id);
    }
  }, [activeConversationId, conversationsQuery.data]);

  useEffect(() => {
    if (historyQuery.data && !isSending) {
      setMessages(historyQuery.data.map((message) => ({ role: message.role, content: message.content })));
    }
  }, [historyQuery.data, isSending]);

  useEffect(() => {
    if (!preferencesQuery.data) return;
    setVoiceEnabled(Boolean(preferencesQuery.data.voiceEnabled));
    setContinuousMode(Boolean(preferencesQuery.data.continuousMode));
    setContextualSuggestions(Boolean(preferencesQuery.data.contextualSuggestions));
  }, [preferencesQuery.data]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.code === "Space") {
        event.preventDefault();
        if (!isSending && voiceState === "idle") handleVoiceStart();
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.code === "Space" && voiceState === "recording") {
        event.preventDefault();
        handleVoiceStop();
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSending, voiceState]);

  useEffect(() => {
    const handleModeShortcut = (event: KeyboardEvent) => {
      const target = event.target;
      if (!event.altKey || !(target instanceof HTMLElement) || target.closest("input, textarea, select, button")) return;
      const nextMode: Record<string, JarvisWorkspaceMode> = { "1": "command", "2": "conversations", "3": "builder", "4": "workspace", "5": "settings" };
      const mode = nextMode[event.key];
      if (!mode) return;
      event.preventDefault();
      setActiveMode(mode);
    };
    window.addEventListener("keydown", handleModeShortcut);
    return () => window.removeEventListener("keydown", handleModeShortcut);
  }, []);

  const addActivity = (entry: string) => setActivity((current) => [entry, ...current].slice(0, 5));
  const transitionInteraction = (event: JarvisInteractionEvent) => {
    setInteraction((current) => transitionJarvisInteraction(current, event));
  };

  const saveMemory = async () => {
    const content = memoryDraft.trim();
    if (!content) return;
    await createMemory.mutateAsync({ content, category: "note" });
    setMemoryDraft("");
    addActivity("Jarvis saved a private memory");
    await utils.jarvis.memory.list.invalidate();
  };

  const saveTask = async () => {
    const title = taskDraft.trim();
    if (!title) return;
    await createTask.mutateAsync({ title, priority: "medium" });
    setTaskDraft("");
    addActivity("Jarvis added a private task");
    await utils.jarvis.tasks.list.invalidate();
  };

  const setTaskStatus = async (id: number, status: "todo" | "done") => {
    await updateTask.mutateAsync({ id, status });
    addActivity(status === "done" ? "Task marked complete" : "Task reopened");
    await utils.jarvis.tasks.list.invalidate();
  };

  const resolveAction = async (id: number, decision: "approved" | "rejected") => {
    const result = await resolveConfirmation.mutateAsync({ id, decision });
    addActivity(result.message);
    await utils.jarvis.confirmations.list.invalidate();
  };

  const speakResponse = (content: string) => {
    if (!voiceEnabled || !("speechSynthesis" in window)) {
      transitionInteraction({ type: "speech_finished" });
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(content);
    const personality = preferencesQuery.data?.personality ?? "balanced";
    const voiceProfile = getJarvisVoiceProfile(personality);
    utterance.rate = Math.min(1.5, Math.max(0.6, ((preferencesQuery.data?.speechRate ?? 100) / 100) * voiceProfile.rate));
    utterance.pitch = voiceProfile.pitch;
    const selectedVoiceName = localStorage.getItem(`jarvisVoice:${user?.id ?? "anonymous"}`) ?? preferencesQuery.data?.voiceName;
    const preferredVoice = selectJarvisBrowserVoice(window.speechSynthesis.getVoices(), selectedVoiceName);
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onstart = () => {
      transitionInteraction({ type: "speech_started" });
      addActivity("Jarvis voice response active");
    };
    utterance.onend = () => {
      transitionInteraction({ type: "speech_finished" });
      if (continuousMode) addActivity("Continuous mode is ready for your next command");
    };
    utterance.onerror = () => transitionInteraction({ type: "speech_finished" });
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceStart = async () => {
    if (voiceState === "recording" || voiceState === "transcribing") return;
    if (!navigator.mediaDevices?.getUserMedia) {
      transitionInteraction({ type: "microphone_unavailable" });
      addActivity("Microphone access is not available in this browser");
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(mediaStream, preferredType ? { mimeType: preferredType } : undefined);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        mediaStream.getTracks().forEach((track) => track.stop());
        const recording = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (!recording.size) {
          transitionInteraction({ type: "recording_stopped" });
          addActivity("No audio command was captured");
          return;
        }
        transitionInteraction({ type: "transcription_started" });
        addActivity("Transcribing your voice command");
        try {
          const transcript = await transcribeJarvisAudio(recording);
          transitionInteraction({ type: "transcription_completed" });
          addActivity("Voice command transcribed");
          handleSendMessage(transcript);
        } catch (error) {
          transitionInteraction({ type: "interaction_failed" });
          addActivity(error instanceof Error ? error.message : "Voice transcription could not be completed");
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      transitionInteraction({ type: "recording_started" });
      addActivity("Listening for a Jarvis command");
    } catch {
      transitionInteraction({ type: "microphone_unavailable" });
      addActivity("Microphone permission was not granted");
    }
  };

  const handleVoiceStop = () => {
    if (voiceState !== "recording") return;
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  useEffect(() => {
    const isTypingControl = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, button"));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isTypingControl(event.target)) return;
      if (event.altKey && event.key.toLowerCase() === "j") {
        event.preventDefault();
        void handleVoiceStart();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "j") handleVoiceStop();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [voiceState]);

  const handleSendMessage = async (content: string, overrideAgent?: Agent) => {
    const command = content.trim();
    if (!command || isSending) return;
    const activeAgent = overrideAgent ?? agent;
    const activeAgentId = activeAgent.toLowerCase() as "general" | "coding" | "research" | "files" | "system" | "creative";
    window.speechSynthesis?.cancel();
    setResponseMode("primary");
    setMessages((current) => [...current, { role: "user", content: command }, { role: "assistant", content: "" }]);
    transitionInteraction({ type: "typed_submitted" });
    addActivity(`${activeAgent} agent received a command`);
    let responseText = "";
    try {
      await streamJarvisResponse({
        content: command,
        agent: activeAgentId,
        conversationId: activeConversationId,
        onEvent: (event, data) => {
          if (event === "meta" && typeof data.conversationId === "number") {
            setActiveConversationId(data.conversationId);
          }
          if (event === "meta" && data.provider === "managed-fallback") {
            setResponseMode("managed");
            addActivity("Jarvis switched to the managed response fallback");
          }
          if (event === "meta" && data.provider === "basic-local") {
            const isProviderAuth = data.reason === "provider-auth";
            setResponseMode(isProviderAuth ? "provider-auth" : "basic");
            addActivity(isProviderAuth ? "Jarvis provider key is unavailable; basic response mode is active" : "Jarvis basic response mode is active");
          }
          if (event === "delta" && typeof data.text === "string") {
            responseText += data.text;
            transitionInteraction({ type: "stream_delta" });
            setMessages((current) => {
              const index = current.length - 1;
              const last = current[index];
              if (!last || last.role !== "assistant") return [...current, { role: "assistant", content: data.text as string }];
              return current.map((message, itemIndex) => itemIndex === index ? { ...message, content: `${message.content}${data.text}` } : message);
            });
          }
          if (event === "confirmation") {
            addActivity("A high-impact action is waiting for your approval");
            void utils.jarvis.confirmations.list.invalidate();
          }
          if (event === "error") {
            const errorMessage = typeof data.message === "string" ? data.message : "Jarvis could not complete that response.";
            responseText = errorMessage;
            setMessages((current) => current.map((message, index) => index === current.length - 1 && message.role === "assistant" ? { ...message, content: errorMessage } : message));
            addActivity(errorMessage);
          }
        },
      });
      if (responseText) {
        addActivity("Jarvis response complete");
        speakResponse(responseText);
      } else {
        transitionInteraction({ type: "speech_finished" });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Jarvis could not start the response stream.";
      setMessages((current) => current.map((message, index) => index === current.length - 1 && message.role === "assistant" ? { ...message, content: errorMessage } : message));
      transitionInteraction({ type: "interaction_failed" });
      addActivity(errorMessage);
    } finally {
      transitionInteraction({ type: "stream_finished" });
      void Promise.all([
        utils.jarvis.conversations.list.invalidate(),
        activeConversationId ? utils.jarvis.conversations.messages.invalidate({ conversationId: activeConversationId }) : Promise.resolve(),
        utils.jarvis.tasks.list.invalidate(),
        utils.jarvis.memory.list.invalidate(),
        utils.jarvis.confirmations.list.invalidate(),
      ]);
    }
  };

  if (!user) {
    return (
      <main className="jarvis-grid flex min-h-screen items-center justify-center p-6">
        <HudPanel className="w-full max-w-md p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-cyan-300/35 bg-cyan-300/10 text-cyan-100"><Orbit className="size-7" /></div>
          <p className="mt-6 font-mono text-xs tracking-[0.3em] text-cyan-200">JARVIS // PRIVATE CORE</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Initialize your assistant</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Sign in to protect your conversations, tasks, memories, and Jarvis settings inside your private workspace.</p>
          <button onClick={() => startLogin()} className="mt-7 w-full rounded-sm border border-cyan-300/40 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-50 transition-all hover:bg-cyan-300/20 active:scale-[0.98]">Secure sign in</button>
        </HudPanel>
      </main>
    );
  }

  return (
    <main className="jarvis-grid min-h-screen overflow-x-hidden px-3 py-3 text-slate-100 sm:px-5 sm:py-5">
      <div className="mx-auto mb-3 flex w-full max-w-[1540px] flex-col gap-3 rounded-sm border border-cyan-300/15 bg-slate-950/45 px-3 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex items-center gap-3"><div className="flex size-8 items-center justify-center rounded-sm border border-cyan-300/30 bg-cyan-300/10 text-cyan-100"><Layers3 className="size-4" /></div><div><p className="hud-label">JARVIS WORKSPACE</p><p className="mt-1 text-xs text-slate-500">Command, conversations, builder, private workspace, and settings</p></div></div>
        <JarvisModeNav activeMode={activeMode} onModeChange={setActiveMode} pendingApprovals={pendingConfirmations.length} />
      </div>

      <div aria-label="Command Center" className={cn("mx-auto grid w-full max-w-[1540px] grid-cols-1 gap-3 xl:grid-cols-[245px_minmax(0,1fr)_285px]", activeMode !== "command" && "hidden")}>
        <aside className="hidden xl:flex xl:flex-col xl:gap-3">
          <HudPanel className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-full border border-cyan-300/35 bg-cyan-300/10 text-cyan-100"><Orbit className="size-5" /><span className="absolute inset-1 rounded-full border border-fuchsia-400/25" /></div>
              <div><p className="font-mono text-sm font-bold tracking-[0.25em] text-cyan-100">JARVIS</p><p className="text-[10px] tracking-[0.2em] text-slate-500">PERSONAL AI CORE</p></div>
            </div>
          </HudPanel>

          <HudPanel className="flex-1 p-3">
            <p className="hud-label px-2">SPECIALIST AGENTS</p>
            <div className="mt-3 space-y-1">
              {agentOptions.map((item) => {
                const Icon = item.icon;
                const active = item.name === agent;
                return <button key={item.name} onClick={() => { setAgent(item.name); addActivity(`${item.name} agent selected`); }} className={cn("group flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left transition-all duration-150", active ? "bg-cyan-300/10 text-cyan-50" : "text-slate-400 hover:bg-white/[0.035] hover:text-slate-200")}><span className={cn("flex size-7 items-center justify-center rounded-sm border", active ? "border-cyan-300/35 bg-cyan-300/10" : "border-white/10 bg-white/[0.025]")}><Icon className="size-3.5" /></span><span className="min-w-0"><span className="block text-xs font-medium">{item.name}</span><span className="block truncate text-[10px] text-slate-600">{item.description}</span></span></button>;
              })}
            </div>
          </HudPanel>

          <HudPanel className="p-4">
            <p className="hud-label">SECURITY PROTOCOL</p>
            <div className="mt-3 flex gap-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-cyan-200" /><p className="text-xs leading-5 text-slate-400">High-impact actions always pause for your explicit approval.</p></div>
          </HudPanel>
        </aside>

        <section className="flex min-w-0 flex-col gap-3">
          <HudPanel className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3"><div className="xl:hidden"><Orbit className="size-5 text-cyan-200" /></div><div><p className="hud-label">JARVIS COMMAND CENTER</p><p className="mt-1 text-sm text-slate-200">{selectedAgent.name} Agent <span className="text-slate-600">/</span> {selectedAgent.description}</p></div></div>
            <div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-sm border border-white/10 bg-black/20 px-3 py-2 sm:flex"><StatusDot state={coreState} /><span className="text-[11px] text-slate-400">{statusCopy[coreState]}</span></div><button aria-label="Open private workspace" onClick={() => setWorkspaceOpen(true)} className="flex size-9 items-center justify-center rounded-sm border border-fuchsia-400/20 bg-fuchsia-400/5 text-fuchsia-100 transition-all hover:border-fuchsia-400/45 hover:bg-fuchsia-400/10 active:scale-[0.97]"><Database className="size-4" /></button><button aria-label="Open Jarvis settings" onClick={() => setSettingsOpen(true)} className="flex size-9 items-center justify-center rounded-sm border border-cyan-300/20 bg-cyan-300/5 text-cyan-100 transition-all hover:border-cyan-300/45 hover:bg-cyan-300/10 active:scale-[0.97]"><Settings2 className="size-4" /></button></div>
          </HudPanel>

          <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(300px,0.85fr)_minmax(360px,1.15fr)]">
            <HudPanel className="relative overflow-hidden px-4 py-5 sm:px-7">
              <div className="absolute left-5 top-4 flex items-center gap-2"><span className="hud-label">NEURAL PRESENCE</span></div>
              <JarvisCore state={coreState} />
              <div className="grid grid-cols-3 gap-2 border-t border-cyan-300/10 pt-3">
                {[{ label: "VOICE", value: voiceState === "recording" ? "OPEN" : voiceState === "transcribing" ? "SYNC" : "READY" }, { label: "MEMORY", value: "PRIVATE" }, { label: "TOOLS", value: "GUARDED" }].map((item) => <div key={item.label} className="rounded-sm bg-white/[0.025] px-2 py-2 text-center"><p className="text-[9px] tracking-[0.16em] text-slate-600">{item.label}</p><p className="mt-1 font-mono text-[10px] text-cyan-100">{item.value}</p></div>)}
              </div>
            </HudPanel>

            <HudPanel className="flex min-h-[490px] flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-cyan-300/15 px-5 py-3"><div className="flex items-center gap-2"><Command className="size-4 text-fuchsia-200" /><p className="hud-label">CONVERSATION FEED</p></div><span className={cn("rounded-full border px-2 py-1 font-mono text-[9px] tracking-[0.15em]", responseMode === "provider-auth" || responseMode === "basic" ? "border-amber-300/30 bg-amber-300/10 text-amber-100" : responseMode === "managed" ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100" : "border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-100")}>{responseMode === "provider-auth" ? "KEY UNAVAILABLE" : responseMode === "basic" ? "BASIC MODE" : responseMode === "managed" ? "MANAGED FALLBACK" : agent.toUpperCase()}</span></div>
              <AIChatBox messages={messages} onSendMessage={handleSendMessage} isLoading={isSending} voiceState={voiceState} onVoiceStart={handleVoiceStart} onVoiceStop={handleVoiceStop} placeholder="Ask Jarvis anything, or hold the mic to speak…" emptyStateMessage="Jarvis is synchronized. Give a voice or text command to begin." suggestedPrompts={quickCommands} height="100%" className="flex-1 border-0 shadow-none" />
              <div className="flex items-center justify-between border-t border-cyan-300/10 px-4 py-2 text-[10px] text-slate-600"><span>Hold mic or <kbd className="rounded border border-white/10 px-1.5 py-0.5 text-slate-400">Ctrl/⌘ Space</kbd></span><span>Private by design</span></div>
            </HudPanel>
          </div>
        </section>

        <aside className="flex flex-col gap-3">
          <HudPanel className="p-4">
            <div className="flex items-center justify-between"><p className="hud-label">SYSTEM STATUS</p><span className="flex items-center gap-1.5 text-[10px] text-cyan-100"><StatusDot state={coreState} />ONLINE</span></div>
            <div className="mt-4 space-y-3">
              {[{ icon: Cpu, label: "Brain", value: "Nemotron Ultra" }, { icon: Database, label: "Memory", value: "Private" }, { icon: LockKeyhole, label: "Actions", value: "Confirm" }].map((item) => { const Icon = item.icon; return <div className="flex items-center justify-between" key={item.label}><div className="flex items-center gap-2 text-xs text-slate-400"><Icon className="size-3.5 text-cyan-200" />{item.label}</div><span className="font-mono text-[10px] text-slate-300">{item.value}</span></div>; })}
            </div>
          </HudPanel>
          <HudPanel className="p-4">
            <div className="flex items-center justify-between"><p className="hud-label">ACTIVITY LOG</p><Activity className="size-3.5 text-cyan-200" /></div>
            <AnimatePresence initial={false}><div className="mt-4 space-y-3">{activity.map((entry, index) => <motion.div key={`${entry}-${index}`} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }} className="flex gap-2"><span className="mt-1.5 size-1 shrink-0 rounded-full bg-cyan-200/80" /><p className="text-xs leading-5 text-slate-500">{entry}</p></motion.div>)}</div></AnimatePresence>
          </HudPanel>
          <HudPanel className="p-4">
            <div className="flex items-center justify-between"><p className="hud-label">PRIVATE WORKSPACE</p><button onClick={() => setWorkspaceOpen(true)} className="text-[10px] text-cyan-100 hover:text-white">OPEN</button></div>
            <div className="mt-4 space-y-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Saved memories</span><span className="font-mono text-cyan-100">{memoriesQuery.data?.length ?? "—"}</span></div><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Open tasks</span><span className="font-mono text-cyan-100">{openTasks.length}</span></div><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Approval gates</span><span className={cn("font-mono", pendingConfirmations.length ? "text-fuchsia-100" : "text-cyan-100")}>{pendingConfirmations.length}</span></div></div>
          </HudPanel>
          <HudPanel className="p-4">
            <div className="flex items-center justify-between"><p className="hud-label">NEXT ACTIONS</p><ChevronRight className="size-3.5 text-fuchsia-200" /></div>
            <div className="mt-3 space-y-2">{["Create a task", "Save a memory", "Start research"].map((item) => <button key={item} onClick={() => handleSendMessage(item)} className="flex w-full items-center justify-between rounded-sm border border-white/[0.07] bg-white/[0.02] px-3 py-2 text-left text-xs text-slate-400 transition-all hover:border-cyan-300/25 hover:text-cyan-50"><span>{item}</span><Plus className="size-3" /></button>)}</div>
          </HudPanel>
        </aside>
      </div>

      <AnimatePresence mode="wait">
        {activeMode === "conversations" && <motion.section aria-label="Conversations" key="conversations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="hud-panel mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-[1540px] flex-col overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-300/15 px-5 py-4"><div><p className="hud-label">CONVERSATIONS</p><h1 className="mt-1 text-lg font-semibold text-white">Conversations with {selectedAgent.name}</h1></div><span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.06] px-2.5 py-1 font-mono text-[10px] text-cyan-100">{messages.length} MESSAGES</span></div><AIChatBox messages={messages} onSendMessage={handleSendMessage} isLoading={isSending} voiceState={voiceState} onVoiceStart={handleVoiceStart} onVoiceStop={handleVoiceStop} placeholder="Ask Jarvis anything, or hold the mic to speak…" emptyStateMessage="This private conversation is ready for your next command." suggestedPrompts={quickCommands} height="100%" className="flex-1 border-0 shadow-none" /></motion.section>}
        {activeMode === "builder" && <motion.div key="builder" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}><JarvisBuilderDock onGenerate={(prompt) => { setAgent("Coding"); setActiveMode("conversations"); void handleSendMessage(prompt, "Coding"); }} onPropose={(input) => proposeWorkspace.mutateAsync(input)} onOpenWorkspace={() => setActiveMode("workspace")} onActivity={addActivity} /></motion.div>}
        {activeMode === "workspace" && <motion.section aria-label="Private Workspace" key="workspace" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="mx-auto grid w-full max-w-[1540px] gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]"><JarvisWorkspaceDock items={workspaceItemsQuery.data ?? []} onPropose={(input) => proposeWorkspace.mutateAsync(input)} onExecute={async (input) => { const item = await executeWorkspace.mutateAsync(input); await Promise.all([utils.jarvis.workspace.list.invalidate(), utils.jarvis.confirmations.list.invalidate()]); return item; }} onReject={(input) => resolveConfirmation.mutateAsync(input).then(() => utils.jarvis.confirmations.list.invalidate())} onActivity={addActivity} /><JarvisActionDock onPropose={(input) => proposeConfirmation.mutateAsync(input)} onResolve={(input) => resolveConfirmation.mutateAsync(input).then(() => utils.jarvis.confirmations.list.invalidate())} onActivity={addActivity} suggestionsEnabled={contextualSuggestions} onSuggestionsChange={async (enabled) => { await updatePreferences.mutateAsync({ contextualSuggestions: enabled }); setContextualSuggestions(enabled); await utils.jarvis.preferences.get.invalidate(); addActivity(`Contextual suggestions ${enabled ? "enabled" : "disabled"} for this private workspace`); }} /></motion.section>}
        {activeMode === "settings" && <motion.section aria-label="Settings" key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="mx-auto w-full max-w-[1540px]"><JarvisExtensions voiceStorageKey={`jarvisVoice:${user?.id ?? "anonymous"}`} onRun={(command, commandAgent) => { setAgent(commandAgent); setActiveMode("conversations"); void handleSendMessage(command, commandAgent); }} onCopyLatest={() => { const latest = getLatestJarvisAssistantOutput(messages); if (!latest) { addActivity("No Jarvis response is available to copy yet"); return; } void navigator.clipboard.writeText(latest).then(() => addActivity("Latest Jarvis response copied to clipboard")).catch(() => addActivity("Clipboard access was not available in this browser")); }} onExportLatest={() => { const latest = getLatestJarvisAssistantOutput(messages); if (!latest) { addActivity("No Jarvis response is available to export yet"); return; } const exportData = buildJarvisMarkdownExport(latest); const file = new Blob([exportData.text], { type: exportData.mimeType }); const url = URL.createObjectURL(file); const link = document.createElement("a"); link.href = url; link.download = exportData.filename; link.click(); URL.revokeObjectURL(url); addActivity("Latest Jarvis response downloaded as Markdown"); }} /></motion.section>}
      </AnimatePresence>
      <WakeWordListener enabled={continuousMode && voiceEnabled && voiceState === "idle" && !isSending} onWakeWord={() => { addActivity("Wake word detected — opening voice link"); void handleVoiceStart(); }} onUnsupported={() => addActivity("Wake word needs Chrome or another supported browser")} />

      <AnimatePresence>
        {workspaceOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.2 }} className="hud-panel mx-auto my-6 w-full max-w-4xl p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="hud-label">JARVIS // PRIVATE WORKSPACE</p><h2 className="mt-2 text-xl font-semibold text-white">Your memories, tasks, and approvals</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Everything shown here is scoped to your signed-in Jarvis workspace. Approving an action only records consent; Jarvis will not execute an external action unless a connected capability is later presented for review.</p></div><button aria-label="Close private workspace" onClick={() => setWorkspaceOpen(false)} className="flex size-8 shrink-0 items-center justify-center text-slate-400 transition hover:text-white"><X className="size-4" /></button></div><div className="mt-6 grid gap-4 lg:grid-cols-2"><section className="rounded-sm border border-cyan-300/15 bg-cyan-300/[0.025] p-4"><div className="flex items-center gap-2"><BrainCircuit className="size-4 text-cyan-200" /><p className="hud-label">LONG-TERM MEMORY</p></div><textarea value={memoryDraft} onChange={(event) => setMemoryDraft(event.target.value)} placeholder="Save a preference, fact, or project note…" className="mt-4 min-h-24 w-full resize-none rounded-sm border border-white/10 bg-black/35 p-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/35" /><button disabled={!memoryDraft.trim() || createMemory.isPending} onClick={() => void saveMemory()} className="mt-2 w-full rounded-sm border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-50 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-40">SAVE MEMORY</button><div className="mt-4 space-y-2">{(memoriesQuery.data ?? []).slice(0, 5).map((memory) => <div key={memory.id} className="flex items-start gap-2 rounded-sm border border-white/[0.07] bg-black/20 p-2.5"><p className="min-w-0 flex-1 text-xs leading-5 text-slate-400">{memory.content}</p><button aria-label="Delete memory" disabled={deleteMemory.isPending} onClick={() => { void deleteMemory.mutateAsync({ id: memory.id }).then(() => utils.jarvis.memory.list.invalidate()); }} className="text-slate-600 transition hover:text-fuchsia-200"><X className="size-3.5" /></button></div>)}{!memoriesQuery.data?.length && <p className="py-4 text-center text-xs text-slate-600">No saved memories yet.</p>}</div></section><section className="rounded-sm border border-fuchsia-400/15 bg-fuchsia-400/[0.02] p-4"><div className="flex items-center gap-2"><Check className="size-4 text-fuchsia-200" /><p className="hud-label">PRIVATE TASKS</p></div><input value={taskDraft} onChange={(event) => setTaskDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void saveTask(); }} placeholder="Add a task for Jarvis to track…" className="mt-4 w-full rounded-sm border border-white/10 bg-black/35 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-fuchsia-400/35" /><button disabled={!taskDraft.trim() || createTask.isPending} onClick={() => void saveTask()} className="mt-2 w-full rounded-sm border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-2 text-xs font-semibold text-fuchsia-50 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-40">ADD TASK</button><div className="mt-4 space-y-2">{(tasksQuery.data ?? []).slice(0, 5).map((task) => <button key={task.id} onClick={() => void setTaskStatus(task.id, task.status === "done" ? "todo" : "done")} className="flex w-full items-start gap-2 rounded-sm border border-white/[0.07] bg-black/20 p-2.5 text-left transition hover:border-fuchsia-400/20"><span className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border", task.status === "done" ? "border-cyan-300/45 bg-cyan-300/15 text-cyan-100" : "border-slate-600 text-transparent")}><Check className="size-2.5" /></span><span className={cn("text-xs leading-5", task.status === "done" ? "text-slate-600 line-through" : "text-slate-300")}>{task.title}</span></button>)}{!tasksQuery.data?.length && <p className="py-4 text-center text-xs text-slate-600">No tasks yet.</p>}</div></section></div><section className="mt-4 rounded-sm border border-amber-300/15 bg-amber-300/[0.025] p-4"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-amber-200" /><p className="hud-label">ACTION APPROVAL GATES</p></div><div className="mt-3 space-y-2">{pendingConfirmations.map((item) => <div key={item.id} className="flex flex-col gap-3 rounded-sm border border-white/[0.07] bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm text-slate-200">{item.action}</p><p className="mt-1 text-xs text-slate-600">Risk level: {item.riskLevel}. Jarvis has not executed this action.</p></div><div className="flex gap-2"><button disabled={resolveConfirmation.isPending} onClick={() => void resolveAction(item.id, "rejected")} className="rounded-sm border border-white/10 px-3 py-2 text-[10px] font-semibold text-slate-400 transition hover:text-white">REJECT</button><button disabled={resolveConfirmation.isPending} onClick={() => void resolveAction(item.id, "approved")} className="rounded-sm border border-amber-300/35 bg-amber-300/10 px-3 py-2 text-[10px] font-semibold text-amber-100 transition hover:bg-amber-300/20">APPROVE</button></div></div>)}{!pendingConfirmations.length && <p className="py-3 text-center text-xs text-slate-600">No action approvals are waiting.</p>}</div></section></motion.div></motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {settingsOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.2 }} className="hud-panel w-full max-w-lg p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="hud-label">JARVIS SETTINGS</p><h2 className="mt-2 text-xl font-semibold text-white">Personal control panel</h2></div><button onClick={() => setSettingsOpen(false)} className="flex size-8 items-center justify-center text-slate-400 transition hover:text-white"><X className="size-4" /></button></div><div className="mt-6 space-y-3"><div className="rounded-sm border border-white/10 bg-white/[0.02] p-3"><span className="flex gap-3"><Cpu className="mt-0.5 size-4 text-fuchsia-200" /><span><span className="block text-sm text-slate-200">Jarvis brain</span><span className="mt-1 block text-xs text-slate-500">Select the model used for new responses.</span></span></span><JarvisModelSelector label="Response model" className="mt-3 block text-xs text-slate-400" model={preferencesQuery.data?.model} onChange={(model) => { void updatePreferences.mutateAsync({ model }).then(() => utils.jarvis.preferences.get.invalidate()); }} /></div><div className="flex items-center justify-between rounded-sm border border-white/10 bg-white/[0.02] p-3"><div className="flex gap-3"><Volume2 className="mt-0.5 size-4 text-cyan-200" /><div><p className="text-sm text-slate-200">Spoken responses</p><p className="mt-1 text-xs text-slate-500">Jarvis reads eligible answers aloud.</p></div></div><button onClick={() => { const next = !voiceEnabled; setVoiceEnabled(next); void updatePreferences.mutateAsync({ voiceEnabled: next }); }} className={cn("rounded-full px-3 py-1 text-[10px] font-semibold tracking-wider", voiceEnabled ? "bg-cyan-300/15 text-cyan-100" : "bg-white/5 text-slate-500")}>{voiceEnabled ? "ON" : "OFF"}</button></div><div className="flex items-center justify-between rounded-sm border border-white/10 bg-white/[0.02] p-3"><div className="flex gap-3"><BellRing className="mt-0.5 size-4 text-fuchsia-200" /><div><p className="text-sm text-slate-200">Continuous conversation</p><p className="mt-1 text-xs text-slate-500">Keeps Jarvis ready between replies while this tab is open.</p></div></div><button onClick={() => { const next = !continuousMode; setContinuousMode(next); void updatePreferences.mutateAsync({ continuousMode: next }); }} className={cn("rounded-full px-3 py-1 text-[10px] font-semibold tracking-wider", continuousMode ? "bg-fuchsia-400/15 text-fuchsia-100" : "bg-white/5 text-slate-500")}>{continuousMode ? "ON" : "OFF"}</button></div><div className="rounded-sm border border-cyan-300/15 bg-cyan-300/[0.035] p-3 text-xs leading-5 text-slate-400"><Check className="mr-2 inline size-3.5 text-cyan-200" />Microphone access always requires your browser permission. External tools remain disabled until you connect and approve them.</div></div></motion.div></motion.div>}
      </AnimatePresence>
    </main>
  );
}
