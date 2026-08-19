import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Laptop, Settings2, ShieldCheck } from "lucide-react";
import React from "react";

type Profile = { id: number; label: string; provider: string; status: string };
type Runner = { id: number; displayName: string; status: string };

export function VirgoYTSettingsPanel({
  providerLabel,
  providerEndpoint,
  providerApiKey,
  vaultConfigured,
  providerProfiles,
  runnerName,
  runnerType,
  runners,
  createPending,
  runnerPending,
  onProviderLabelChange,
  onProviderEndpointChange,
  onProviderApiKeyChange,
  onCreateProvider,
  onRunnerNameChange,
  onRunnerTypeChange,
  onRegisterRunner,
}: {
  providerLabel: string;
  providerEndpoint: string;
  providerApiKey: string;
  vaultConfigured: boolean;
  providerProfiles: Profile[];
  runnerName: string;
  runnerType: "local_cli" | "remote_isolated";
  runners: Runner[];
  createPending: boolean;
  runnerPending: boolean;
  onProviderLabelChange: (value: string) => void;
  onProviderEndpointChange: (value: string) => void;
  onProviderApiKeyChange: (value: string) => void;
  onCreateProvider: () => void;
  onRunnerNameChange: (value: string) => void;
  onRunnerTypeChange: (value: "local_cli" | "remote_isolated") => void;
  onRegisterRunner: () => void;
}) {
  return <div>
    <p className="hud-label text-cyan-100">CONNECTION SETTINGS</p>
    <h1 className="mt-2 text-2xl font-semibold text-white">Metadata first. Credentials stay server-side.</h1>
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <section className="rounded-sm border border-white/[0.08] bg-black/20 p-4">
        <div className="flex items-center gap-2"><Settings2 className="size-4 text-cyan-100" /><p className="text-sm font-semibold text-white">Provider profile</p></div>
        <p className="mt-2 text-xs leading-5 text-slate-500">A key is sent only to the signed-in Jarvis server, encrypted with AES-256-GCM, cleared from this field after saving, and never returned to the browser.</p>
        <Input aria-label="Provider profile label" value={providerLabel} onChange={(event) => onProviderLabelChange(event.target.value)} placeholder="Profile label" className="mt-4 border-white/10 bg-slate-950/70 text-slate-100" />
        <Input aria-label="Provider endpoint" value={providerEndpoint} onChange={(event) => onProviderEndpointChange(event.target.value)} placeholder="https://provider.example/v1 (optional)" className="mt-2 border-white/10 bg-slate-950/70 text-slate-100" />
        <Input aria-label="Provider API key" type="password" autoComplete="off" value={providerApiKey} onChange={(event) => onProviderApiKeyChange(event.target.value)} placeholder="Optional provider API key" className="mt-2 border-white/10 bg-slate-950/70 text-slate-100" />
        <div className="mt-3 flex items-start gap-2 rounded-sm border border-cyan-300/15 bg-cyan-300/[0.035] p-3"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-cyan-100" /><p className="text-[11px] leading-5 text-slate-400">{vaultConfigured ? "Credential vault ready. Leave the key blank to save metadata only." : "Credential vault is unavailable on this deployment. Metadata-only profiles are still safe to save."}</p></div>
        <Button onClick={onCreateProvider} disabled={createPending || Boolean(providerApiKey.trim()) && !vaultConfigured} className="mt-3 min-h-11 w-full bg-cyan-300 text-slate-950 hover:bg-cyan-200">{providerApiKey.trim() ? "Save encrypted profile" : "Save metadata only"}</Button>
        <div className="mt-4 space-y-2">{providerProfiles.map((provider) => <div key={provider.id} className="flex items-center justify-between rounded-sm border border-white/[0.07] px-3 py-2"><span className="text-xs text-slate-300">{provider.label} · {provider.provider}</span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-cyan-100">{provider.status}</span></div>)}</div>
      </section>
      <section className="rounded-sm border border-white/[0.08] bg-black/20 p-4">
        <div className="flex items-center gap-2"><Laptop className="size-4 text-fuchsia-200" /><p className="text-sm font-semibold text-white">Runner registration</p></div>
        <p className="mt-2 text-xs leading-5 text-slate-500">Request a signed local CLI or isolated remote runner. Registration alone cannot reach a machine, browser, or terminal.</p>
        <Input aria-label="Runner display name" value={runnerName} onChange={(event) => onRunnerNameChange(event.target.value)} placeholder="Runner display name" className="mt-4 border-white/10 bg-slate-950/70 text-slate-100" />
        <select aria-label="Runner type" value={runnerType} onChange={(event) => onRunnerTypeChange(event.target.value as "local_cli" | "remote_isolated")} className="mt-2 min-h-10 w-full rounded-sm border border-white/10 bg-slate-950 px-3 text-xs text-slate-200"><option value="local_cli">Local CLI</option><option value="remote_isolated">Remote isolated workspace</option></select>
        <Button onClick={onRegisterRunner} disabled={runnerPending} className="mt-3 min-h-11 w-full bg-fuchsia-400/90 text-white hover:bg-fuchsia-300">Request runner pairing</Button>
        <div className="mt-4 space-y-2">{runners.map((runner) => <div key={runner.id} className="flex items-center justify-between rounded-sm border border-white/[0.07] px-3 py-2"><span className="text-xs text-slate-300">{runner.displayName}</span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fuchsia-100">{runner.status}</span></div>)}</div>
      </section>
    </div>
  </div>;
}
