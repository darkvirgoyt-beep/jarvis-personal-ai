export const JARVIS_MODEL_VALUES = [
  "nemotron-3-ultra",
  "gpt-5-mini",
  "gpt-5",
  "claude-sonnet-4-6",
  "gemini-3-flash-preview",
] as const;

export type JarvisModelPreference = (typeof JARVIS_MODEL_VALUES)[number];

export const JARVIS_DEFAULT_MODEL: JarvisModelPreference = "nemotron-3-ultra";

export const JARVIS_MODEL_OPTIONS: ReadonlyArray<{ value: JarvisModelPreference; label: string }> = [
  { value: "nemotron-3-ultra", label: "Default primary — Nemotron 3 Ultra" },
  { value: "gpt-5-mini", label: "Fast — GPT-5 mini" },
  { value: "gpt-5", label: "Deep reasoning — GPT-5" },
  { value: "claude-sonnet-4-6", label: "Coding & analysis — Claude Sonnet" },
  { value: "gemini-3-flash-preview", label: "Long context — Gemini Flash" },
];

export function isJarvisModelPreference(value: string | null | undefined): value is JarvisModelPreference {
  return typeof value === "string" && (JARVIS_MODEL_VALUES as readonly string[]).includes(value);
}

export function isAlternateJarvisModel(value: string | null | undefined): value is Exclude<JarvisModelPreference, typeof JARVIS_DEFAULT_MODEL> {
  return isJarvisModelPreference(value) && value !== JARVIS_DEFAULT_MODEL;
}
