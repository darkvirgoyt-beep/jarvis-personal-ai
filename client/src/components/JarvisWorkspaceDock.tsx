import { Code2, FilePlus2, FolderPlus, HardDrive, LockKeyhole, Play, ShieldCheck } from "lucide-react";
import React, { useState } from "react";
import { buildJarvisWorkspaceProposal, type JarvisWorkspaceOperation } from "../../../shared/jarvisWorkspace";

type WorkspaceItem = {
  id: number;
  path: string;
  itemType: "file" | "folder";
  storageUrl: string | null;
  sizeBytes: number;
};

export function JarvisWorkspaceDock({
  items,
  onPropose,
  onExecute,
  onReject,
  onActivity,
}: {
  items: WorkspaceItem[];
  onPropose: (input: { operation: JarvisWorkspaceOperation; path: string; content?: string }) => Promise<{ id: number }>;
  onExecute: (input: { confirmationId: number }) => Promise<unknown>;
  onReject: (input: { id: number; decision: "rejected" }) => Promise<unknown>;
  onActivity: (entry: string) => void;
}) {
  const [operation, setOperation] = useState<JarvisWorkspaceOperation>("code");
  const [path, setPath] = useState("src/jarvis.ts");
  const [content, setContent] = useState("export const jarvisStatus = 'online';\n");
  const [proposal, setProposal] = useState<{ id: number; operation: JarvisWorkspaceOperation; path: string }>();
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const prepare = async () => {
    try {
      const normalized = buildJarvisWorkspaceProposal(operation, path, content);
      setIsWorking(true);
      const record = await onPropose({ operation: normalized.operation, path: normalized.path, content: normalized.content });
      setProposal({ id: record.id, operation: normalized.operation, path: normalized.path });
      setError("");
      onActivity(`Workspace ${normalized.operation} prepared — explicit approval required`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Jarvis could not prepare that workspace action.");
    } finally {
      setIsWorking(false);
    }
  };

  const execute = async () => {
    if (!proposal) return;
    try {
      setIsWorking(true);
      await onExecute({ confirmationId: proposal.id });
      onActivity(`Private workspace ${proposal.operation} created: ${proposal.path}`);
      setProposal(undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Jarvis could not complete that workspace action.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <section className="hud-panel p-4 sm:p-5" aria-label="Jarvis virtual workspace">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="hud-label">JARVIS // VIRTUAL WORKSPACE</p><h2 className="mt-1 text-base font-semibold text-slate-100">Private files, folders, and code</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">This is an isolated Jarvis workspace, not your phone or computer. File writes are stored privately only after explicit approval. No deletes or device access are enabled here.</p></div>
        <span className="flex items-center gap-1.5 rounded-sm border border-cyan-300/25 bg-cyan-300/[0.06] px-2 py-1 text-[10px] text-cyan-100"><HardDrive className="size-3" /> ISOLATED</span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[0.75fr_1.25fr_auto]">
        <label className="block text-xs text-slate-400">Operation<select aria-label="Workspace operation" value={operation} onChange={(event) => { const nextOperation = event.target.value as JarvisWorkspaceOperation; setOperation(nextOperation); if (nextOperation === "folder") setContent(""); }} className="mt-1.5 w-full rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-300/35"><option value="folder">Create folder</option><option value="file">Create text file</option><option value="code">Write code file</option></select></label>
        <label className="block text-xs text-slate-400">Workspace path<input aria-label="Workspace path" value={path} onChange={(event) => setPath(event.target.value)} placeholder="projects/jarvis/README.md" className="mt-1.5 w-full rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/35" /></label>
        <button onClick={() => void prepare()} disabled={!path.trim() || isWorking} className="self-end rounded-sm border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-2 text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-40"><FilePlus2 className="mr-1 inline size-3.5" />PREPARE WRITE</button>
      </div>
      {operation !== "folder" && <label className="mt-3 block text-xs text-slate-400">File content<textarea aria-label="Workspace file content" value={content} onChange={(event) => setContent(event.target.value)} className="mt-1.5 min-h-24 w-full resize-y rounded-sm border border-white/10 bg-black/35 p-2.5 font-mono text-xs leading-5 text-slate-200 outline-none focus:border-cyan-300/35" /></label>}
      {error && <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}
      {proposal && <div className="mt-4 rounded-sm border border-amber-300/25 bg-amber-300/[0.04] p-3"><div className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-amber-200" /><div><p className="text-xs font-medium text-amber-100">Review workspace write</p><p className="mt-1 text-xs leading-5 text-slate-400">Jarvis will create a private {proposal.operation} at <span className="font-mono text-slate-200">{proposal.path}</span>. It cannot overwrite or delete an existing workspace item.</p></div></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => { void onReject({ id: proposal.id, decision: "rejected" }); setProposal(undefined); onActivity("Workspace write rejected — nothing changed"); }} disabled={isWorking} className="rounded-sm border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white">REJECT</button><button onClick={() => void execute()} disabled={isWorking} className="rounded-sm border border-amber-300/35 bg-amber-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-amber-100 hover:bg-amber-300/20"><Play className="mr-1 inline size-3.5" />APPROVE &amp; CREATE</button></div></div>}
      <div className="mt-4 rounded-sm border border-white/[0.07] bg-black/20 p-3"><div className="flex items-center gap-2"><LockKeyhole className="size-3.5 text-cyan-200" /><p className="hud-label">PRIVATE WORKSPACE ITEMS</p></div><div className="mt-2 space-y-1.5">{items.slice(0, 5).map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-sm bg-white/[0.025] px-2.5 py-2"><span className="min-w-0 truncate font-mono text-[11px] text-slate-300">{item.itemType === "folder" ? <FolderPlus className="mr-1 inline size-3 text-fuchsia-200" /> : <Code2 className="mr-1 inline size-3 text-cyan-200" />}{item.path}</span>{item.storageUrl && <a href={item.storageUrl} target="_blank" rel="noreferrer" className="shrink-0 text-[10px] text-cyan-100 hover:text-white">OPEN</a>}</div>)}{!items.length && <p className="py-2 text-xs text-slate-600">No private workspace items yet.</p>}</div></div>
    </section>
  );
}
