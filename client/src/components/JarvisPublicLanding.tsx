import { ArrowRight, BrainCircuit, LockKeyhole, Mic, Sparkles, WandSparkles } from "lucide-react";
import React from "react";

export function JarvisPublicLanding({ onStart }: { onStart: () => void }) {
  return (
    <main className="jarvis-grid min-h-screen overflow-hidden px-4 py-5 text-slate-100 sm:px-8 sm:py-8">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl border border-cyan-200/30 bg-cyan-300/10 text-cyan-100"><BrainCircuit className="size-5" /></div><span className="font-mono text-sm font-semibold tracking-[0.22em] text-cyan-50">JARVIS</span></div>
        <button onClick={onStart} className="rounded-lg border border-white/12 bg-white/[0.045] px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/[0.09] active:scale-[0.97]">Sign in</button>
      </header>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <p className="hud-label">PERSONAL AI WORKSPACE</p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">One private place to <span className="text-cyan-200">think</span>, build, and act with care.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">Jarvis brings voice conversations, long-term memory, project planning, guarded app handoffs, and a Builder workspace into a calm, responsive command environment.</p>
          <div className="mt-8 flex flex-wrap gap-3"><button onClick={onStart} className="inline-flex items-center gap-2 rounded-lg bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 active:scale-[0.97]">Create your private workspace <ArrowRight className="size-4" /></button><a href="#workspace-overview" className="rounded-lg border border-white/12 bg-white/[0.025] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07]">Explore the workspace</a></div>
          <p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><LockKeyhole className="size-3.5 text-cyan-200" /> Your chats, memory, projects, and connected actions remain private after sign-in.</p>
        </div>

        <div className="jarvis-public-preview hud-panel p-4 sm:p-5">
          <div className="flex items-center justify-between border-b border-white/8 pb-4"><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-cyan-200 shadow-[0_0_14px_rgba(151,242,255,0.85)]" /><span className="font-mono text-[10px] tracking-[0.2em] text-cyan-100">YOUR WORKSPACE</span></div><span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[10px] font-medium text-cyan-100">PRIVATE BY DEFAULT</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[0.72fr_1.28fr]"><div className="rounded-lg border border-white/8 bg-black/20 p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Spaces</p><div className="mt-3 space-y-1.5 text-xs text-slate-400"><p className="rounded-md bg-cyan-300/10 px-2 py-2 text-cyan-100">Chats</p><p className="px-2 py-1.5">Memory</p><p className="px-2 py-1.5">Projects</p><p className="px-2 py-1.5">Builder</p></div></div><div className="rounded-lg border border-white/8 bg-white/[0.025] p-4"><Sparkles className="size-5 text-fuchsia-200" /><p className="mt-10 text-sm font-medium text-white">What would you like to make?</p><div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-slate-500">Describe an idea, ask a question, or hold to speak…</div><div className="mt-3 flex items-center justify-between"><span className="flex items-center gap-1.5 text-[10px] text-slate-500"><Mic className="size-3" /> Voice ready</span><span className="rounded-md bg-fuchsia-400/15 p-1.5 text-fuchsia-100"><WandSparkles className="size-3.5" /></span></div></div></div>
        </div>
      </section>

      <section id="workspace-overview" className="mx-auto grid w-full max-w-6xl gap-3 pb-10 sm:grid-cols-3">
        {[{ icon: Mic, title: "Talk naturally", text: "Use push-to-talk or type to keep the conversation moving." }, { icon: BrainCircuit, title: "Remember on purpose", text: "Save only the preferences and project facts that help Jarvis assist you." }, { icon: WandSparkles, title: "Build with review", text: "Plan websites and apps, then approve each workspace or external handoff." }].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-xl border border-white/8 bg-slate-950/45 p-5 backdrop-blur-sm"><Icon className="size-5 text-cyan-200" /><h2 className="mt-4 text-sm font-semibold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></article>)}
      </section>
    </main>
  );
}
