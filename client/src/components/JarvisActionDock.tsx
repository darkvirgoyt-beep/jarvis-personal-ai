import { MapPin, Navigation, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import React, { useMemo, useState } from "react";
import { JARVIS_EXTERNAL_ACTION_OPTIONS, buildJarvisExternalAction, type JarvisExternalAction, type JarvisExternalActionKind, type JarvisLocationContext } from "../../../shared/jarvisExternalActions";

type ApprovalRecord = { id: number };

export function JarvisActionDock({
  onPropose,
  onResolve,
  onActivity,
  suggestionsEnabled,
  onSuggestionsChange,
}: {
  onPropose: (input: { action: string; riskLevel: "low" | "medium"; details: string }) => Promise<ApprovalRecord>;
  onResolve: (input: { id: number; decision: "approved" | "rejected" }) => Promise<unknown>;
  onActivity: (entry: string) => void;
  suggestionsEnabled: boolean;
  onSuggestionsChange: (enabled: boolean) => Promise<unknown>;
}) {
  const [kind, setKind] = useState<JarvisExternalActionKind>("search");
  const [destination, setDestination] = useState("");
  const [location, setLocation] = useState<JarvisLocationContext>();
  const [locationMessage, setLocationMessage] = useState("Location is off until you request it.");
  const [proposal, setProposal] = useState<{ recordId: number; action: JarvisExternalAction; approved: boolean }>();
  const [error, setError] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const currentOption = useMemo(() => JARVIS_EXTERNAL_ACTION_OPTIONS.find((option) => option.value === kind) ?? JARVIS_EXTERNAL_ACTION_OPTIONS[0], [kind]);

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationMessage("This browser does not support location requests."); return; }
    setIsLoadingLocation(true);
    setLocationMessage("Requesting your browser’s location permission…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy };
        setLocation(next);
        setLocationMessage(`Location is available for this action only (accuracy ±${Math.round(next.accuracy ?? 0)}m).`);
        setIsLoadingLocation(false);
        onActivity("Location permission granted for a prepared action; coordinates were not saved");
      },
      () => { setLocationMessage("Location was not shared. You can still prepare a destination manually."); setIsLoadingLocation(false); },
      { enableHighAccuracy: false, maximumAge: 0, timeout: 12_000 },
    );
  };

  const prepare = async () => {
    try {
      const action = buildJarvisExternalAction(kind, destination, location);
      const record = await onPropose({
        action: action.label,
        riskLevel: action.riskLevel,
        details: `Jarvis will prepare an external ${action.label.toLowerCase()} to ${action.destination}. Review and approve before the browser opens the destination.`,
      });
      setProposal({ recordId: record.id, action, approved: false });
      setError("");
      onActivity(`${action.label} prepared — explicit approval required before opening`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Jarvis could not prepare that action.");
    }
  };

  const resolve = async (decision: "approved" | "rejected") => {
    if (!proposal) return;
    if (decision === "rejected") {
      await onResolve({ id: proposal.recordId, decision });
      onActivity("External handoff rejected — nothing was opened");
      setProposal(undefined);
      return;
    }
    const destinationWindow = window.open("", "_blank", "noopener,noreferrer");
    try {
      await onResolve({ id: proposal.recordId, decision });
      if (destinationWindow) {
        destinationWindow.opener = null;
        destinationWindow.location.href = proposal.action.url;
        onActivity(`${proposal.action.label} opened after explicit approval`);
        setProposal(undefined);
      } else {
        setProposal((current) => current ? { ...current, approved: true } : current);
        onActivity("External handoff approved — your browser blocked the new tab, so use the safe open link");
      }
    } catch (reason) {
      destinationWindow?.close();
      setError(reason instanceof Error ? reason.message : "Jarvis could not record that approval.");
    }
  };

  const suggestions = location
    ? [
      { label: "Find nearby coffee", kind: "maps" as const, destination: "coffee shops near me" },
      { label: "Open nearby directions", kind: "directions" as const, destination: "nearby transit station" },
    ]
    : [
      { label: "Search local weather", kind: "search" as const, destination: "weather near me" },
      { label: "Find a place", kind: "maps" as const, destination: "restaurants near me" },
    ];

  return (
    <section className="hud-panel p-4 sm:p-5" aria-label="Jarvis approved action dock">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="hud-label">JARVIS // APPROVED ACTIONS</p><h2 className="mt-1 text-base font-semibold text-slate-100">Prepare an external handoff</h2><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Jarvis can prepare a search, maps, call, message, or app link. It cannot unlock your device, read another app, or send anything silently.</p></div>
        <span className="flex items-center gap-1.5 rounded-sm border border-amber-300/25 bg-amber-300/[0.06] px-2 py-1 text-[10px] text-amber-100"><ShieldCheck className="size-3" /> CONFIRM FIRST</span>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[0.8fr_1.2fr_auto]">
        <label className="block text-xs text-slate-400">Action<select aria-label="External action type" value={kind} onChange={(event) => { setKind(event.target.value as JarvisExternalActionKind); setError(""); }} className="mt-1.5 w-full rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-300/35">{JARVIS_EXTERNAL_ACTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
        <label className="block text-xs text-slate-400">Destination<input aria-label="External action destination" value={destination} onChange={(event) => setDestination(event.target.value)} placeholder={currentOption.placeholder} className="mt-1.5 w-full rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-cyan-300/35" /></label>
        <button onClick={() => void prepare()} disabled={!destination.trim()} className="self-end rounded-sm border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-2 text-xs font-semibold text-fuchsia-100 transition hover:bg-fuchsia-400/20 disabled:cursor-not-allowed disabled:opacity-40"><Sparkles className="mr-1 inline size-3.5" />PREPARE</button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2"><button onClick={requestLocation} disabled={isLoadingLocation} className="rounded-sm border border-cyan-300/20 bg-cyan-300/[0.04] px-2.5 py-1.5 text-[10px] text-cyan-100 transition hover:bg-cyan-300/10 disabled:opacity-50"><MapPin className="mr-1 inline size-3.5" />{isLoadingLocation ? "REQUESTING LOCATION" : "USE CURRENT LOCATION"}</button><span className="text-[10px] text-slate-600">{locationMessage}</span></div>
      <div className="mt-3 rounded-sm border border-white/[0.07] bg-black/20 px-3 py-2.5"><label className="flex cursor-pointer items-start gap-2.5"><input aria-label="Enable contextual suggestions" type="checkbox" checked={suggestionsEnabled} onChange={(event) => void onSuggestionsChange(event.target.checked)} className="mt-0.5 accent-cyan-300" /><span><span className="text-[11px] text-slate-300">Opt in to contextual suggestions</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-600">Uses only this action dock’s selected action, current destination, and a temporary location if you requested it. Jarvis does not save coordinates.</span></span></label>{suggestionsEnabled && <div className="mt-2 flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion.label} onClick={() => { setKind(suggestion.kind); setDestination(suggestion.destination); onActivity(`Contextual suggestion selected: ${suggestion.label}`); }} className="rounded-sm border border-cyan-300/15 bg-cyan-300/[0.04] px-2 py-1 text-[10px] text-cyan-100 transition hover:bg-cyan-300/10">{suggestion.label}</button>)}</div>}</div>
      {error && <p role="alert" className="mt-3 text-xs text-rose-300">{error}</p>}
      {proposal && <div className="mt-4 rounded-sm border border-amber-300/25 bg-amber-300/[0.04] p-3"><div className="flex gap-2"><Smartphone className="mt-0.5 size-4 shrink-0 text-amber-200" /><div><p className="text-xs font-medium text-amber-100">Review external handoff</p><p className="mt-1 text-xs leading-5 text-slate-400">{proposal.action.label}: <span className="text-slate-200">{proposal.action.destination}</span></p><p className="mt-1 text-[10px] leading-4 text-slate-600">Approval opens the prepared destination in a new tab. Calls and messages then remain subject to your device and destination app.</p></div></div><div className="mt-3 flex flex-wrap gap-2">{!proposal.approved ? <><button onClick={() => void resolve("rejected")} className="rounded-sm border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-400 hover:text-white">REJECT</button><button onClick={() => void resolve("approved")} className="rounded-sm border border-amber-300/35 bg-amber-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-amber-100 hover:bg-amber-300/20">APPROVE &amp; OPEN</button></> : <a href={proposal.action.url} target="_blank" rel="noreferrer" onClick={() => onActivity(`${proposal.action.label} opened after explicit approval`)} className="rounded-sm border border-cyan-300/35 bg-cyan-300/10 px-2.5 py-1.5 text-[10px] font-semibold text-cyan-50 hover:bg-cyan-300/20"><Navigation className="mr-1 inline size-3.5" />OPEN APPROVED DESTINATION</a>}</div></div>}
    </section>
  );
}
