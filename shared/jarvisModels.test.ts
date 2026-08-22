import { describe, expect, it } from "vitest";
import { JARVIS_DEFAULT_MODEL, JARVIS_MODEL_OPTIONS, JARVIS_MODEL_VALUES, isAlternateJarvisModel, isJarvisModelPreference } from "./jarvisModels";

describe("Jarvis shared model contract", () => {
  it("defines Nemotron 3 Ultra as the persisted default exposed by both selectors", () => {
    expect(JARVIS_DEFAULT_MODEL).toBe("nemotron-3-ultra");
    expect(JARVIS_MODEL_VALUES).toContain(JARVIS_DEFAULT_MODEL);
    expect(JARVIS_MODEL_OPTIONS[0]).toEqual({ value: "nemotron-3-ultra", label: "Default primary — Nemotron 3 Ultra" });
  });

  it("recognizes only contract values and separates the default from allowed alternates", () => {
    expect(isJarvisModelPreference("gpt-5-mini")).toBe(true);
    expect(isJarvisModelPreference("claude-fable-5")).toBe(true);
    expect(isJarvisModelPreference("unapproved-model")).toBe(false);
    expect(isAlternateJarvisModel("gpt-5-mini")).toBe(true);
    expect(isAlternateJarvisModel("claude-fable-5")).toBe(true);
    expect(isAlternateJarvisModel(JARVIS_DEFAULT_MODEL)).toBe(false);
  });

  it("exposes the verified Anthropic Fable 5 option without changing Nemotron’s default role", () => {
    expect(JARVIS_MODEL_OPTIONS).toContainEqual({ value: "claude-fable-5", label: "Anthropic — Claude Fable 5" });
    expect(JARVIS_DEFAULT_MODEL).toBe("nemotron-3-ultra");
  });
});
