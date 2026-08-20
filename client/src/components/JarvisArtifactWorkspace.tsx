import { ArrowUpRight, BarChart3, Code2, Download, Eye, FileOutput, FileText, Image as ImageIcon, Send, ShieldCheck, TableProperties } from "lucide-react";
import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ArtifactKind = "document" | "spreadsheet" | "data" | "code" | "visual";

const artifactKinds: { id: ArtifactKind; label: string; description: string; icon: typeof FileText; color: string }[] = [
  { id: "document", label: "Document", description: "Briefs, plans, reports, PDF-ready copy", icon: FileText, color: "text-cyan-100" },
  { id: "spreadsheet", label: "Spreadsheet", description: "Structured tables and calculation plans", icon: TableProperties, color: "text-emerald-100" },
  { id: "data", label: "Data review", description: "Analysis questions, charts, and findings", icon: BarChart3, color: "text-violet-100" },
  { id: "code", label: "Code change", description: "Architecture, files, and reviewed diffs", icon: Code2, color: "text-fuchsia-100" },
  { id: "visual", label: "Visual brief", description: "Image direction and reviewed generation prompts", icon: ImageIcon, color: "text-amber-100" },
];

export function JarvisArtifactWorkspace({
  stagedAttachments,
  onDraft,
  onOpenBuilder,
}: {
  stagedAttachments: { name: string; size: number }[];
  onDraft: (prompt: string) => void;
  onOpenBuilder: () => void;
}) {
  const [kind, setKind] = useState<ArtifactKind>("document");
  const [brief, setBrief] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const selected = artifactKinds.find((item) => item.id === kind) ?? artifactKinds[0];
  const Icon = selected.icon;
  const normalizedBrief = brief.trim();
  const preview = useMemo(() => {
    const title = normalizedBrief || `New ${selected.label.toLowerCase()} request`;
    return `# ${selected.label} proposal\n\n## Requested outcome\n${title}\n\n## Review boundary\nJarvis will draft this artifact for review. It will not upload a file, alter a repository, generate a paid asset, or publish anything without an explicit approval step.`;
  }, [normalizedBrief, selected.label]);

  const submitDraft = () => {
    const subject = normalizedBrief || `Help me create a ${selected.label.toLowerCase()}. Ask the smallest useful clarifying questions first.`;
    onDraft(`Artifact request (${selected.label}): ${subject}\n\nReturn a reviewed outline, assumptions, and the first draft. Keep external uploads, file writes, paid generation, repository changes, and publishing as explicit proposals only.`);
  };

  const downloadProposal = () => {
    const url = URL.createObjectURL(new Blob([preview], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `jarvis-${kind}-proposal.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-label="Jarvis Artifact Studio" className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/60 shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 border-b border-white/[0.08] px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-md border border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100"><FileOutput className="size-3.5" /></span><p className="hud-label text-cyan-100">ARTIFACT STUDIO</p></div><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">Turn normal-language outcomes into reviewed deliverables. Context stays in this browser until you choose a separate approved upload or workspace action.</p></div>
        <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-[10px] font-semibold tracking-[0.1em] text-slate-400"><ShieldCheck className="size-3 text-cyan-200" />REVIEW FIRST</span><span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/15 px-2.5 py-1 font-mono text-[10px] text-slate-400">{stagedAttachments.length} LOCAL CONTEXT</span></div>
      </div>

      <div className="grid gap-px bg-white/[0.07] lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.78fr)]">
        <div className="bg-slate-950/80 p-4 sm:p-5">
          <p className="hud-label">DELIVERABLE TYPE</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {artifactKinds.map((item) => { const ItemIcon = item.icon; const isActive = item.id === kind; return <button key={item.id} type="button" onClick={() => setKind(item.id)} className={cn("rounded-lg border p-3 text-left transition active:scale-[0.98]", isActive ? "border-cyan-300/35 bg-cyan-300/[0.075]" : "border-white/[0.08] bg-black/15 hover:border-white/20 hover:bg-white/[0.035]")}><ItemIcon className={cn("size-4", isActive ? "text-cyan-100" : item.color)} /><span className="mt-2 block text-xs font-semibold text-slate-200">{item.label}</span><span className="mt-1 block text-[10px] leading-4 text-slate-600">{item.description}</span></button>; })}
          </div>
          <label className="mt-4 block"><span className="hud-label">WHAT SHOULD JARVIS DELIVER?</span><textarea value={brief} onChange={(event) => setBrief(event.target.value)} placeholder={`Example: Create a polished ${selected.label.toLowerCase()} for…`} className="mt-2 min-h-28 w-full resize-y rounded-lg border border-white/10 bg-black/25 p-3 text-sm leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/35" /></label>
          <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={submitDraft} className="inline-flex items-center gap-2 rounded-lg bg-cyan-200 px-3 py-2.5 text-xs font-semibold text-slate-950 transition hover:bg-cyan-100 active:scale-[0.97]"><Send className="size-3.5" />DRAFT WITH JARVIS</button><button type="button" onClick={() => setPreviewOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100"><Eye className="size-3.5" />{previewOpen ? "HIDE" : "PREVIEW"}</button><button type="button" onClick={downloadProposal} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.025] px-3 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100"><Download className="size-3.5" />DOWNLOAD BRIEF</button></div>
          {previewOpen && <pre data-testid="artifact-preview" className="mt-4 overflow-x-auto rounded-lg border border-cyan-300/15 bg-black/30 p-3 font-mono text-[11px] leading-5 text-slate-400 whitespace-pre-wrap">{preview}</pre>}
        </div>

        <aside className="bg-slate-950/80 p-4 sm:p-5"><div className="flex items-center gap-2"><Icon className={cn("size-4", selected.color)} /><p className="hud-label">REVIEW QUEUE</p></div><div className="mt-4 rounded-lg border border-white/[0.08] bg-black/15 p-3"><p className="text-xs font-medium text-slate-200">{selected.label} is staged as a proposal</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Jarvis can draft content and describe next steps. File writes, repository changes, image generation, app deployments, and external sharing require their own visible confirmation.</p></div><div className="mt-3 rounded-lg border border-fuchsia-400/15 bg-fuchsia-400/[0.035] p-3"><p className="text-[10px] font-semibold tracking-[0.12em] text-fuchsia-100">APP OR WEBSITE?</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Move to Builder for requirements, architecture, preview readiness, and a reviewable GitHub or deployment proposal.</p><button type="button" onClick={onOpenBuilder} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-100 hover:text-white">OPEN BUILDER <ArrowUpRight className="size-3.5" /></button></div><div className="mt-3"><p className="text-[10px] font-semibold tracking-[0.12em] text-slate-600">LOCAL CONTEXT</p>{stagedAttachments.length ? <ul className="mt-2 space-y-1.5">{stagedAttachments.map((file) => <li key={file.name} className="flex items-center justify-between gap-3 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 text-[11px] text-slate-400"><span className="truncate">{file.name}</span><span className="shrink-0 font-mono text-[10px] text-slate-600">{Math.max(1, Math.round(file.size / 1024))} KB</span></li>)}</ul> : <p className="mt-2 text-[11px] leading-5 text-slate-600">Attach files in chat to stage filenames locally for review.</p>}</div></aside>
      </div>
    </section>
  );
}
