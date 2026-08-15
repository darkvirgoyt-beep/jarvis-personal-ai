import { JARVIS_DEFAULT_MODEL, JARVIS_MODEL_OPTIONS, type JarvisModelPreference } from "../../../shared/jarvisModels";
import React from "react";

type JarvisModelSelectorProps = {
  model?: string | null;
  onChange: (model: JarvisModelPreference) => void;
  label?: string;
  className?: string;
};

export function JarvisModelSelector({ model, onChange, label = "Response model", className }: JarvisModelSelectorProps) {
  return (
    <label className={className}>
      {label}
      <select aria-label={label} value={model ?? JARVIS_DEFAULT_MODEL} onChange={(event) => onChange(event.target.value as JarvisModelPreference)} className="mt-1.5 w-full rounded-sm border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-300/35">
        {JARVIS_MODEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
