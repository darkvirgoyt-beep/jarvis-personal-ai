import { describe, expect, it } from "vitest";
import { getJarvisVoiceProfile, selectJarvisBrowserVoice } from "./jarvisVoice";

const voice = (name: string, lang = "en-US") => ({ name, lang } as SpeechSynthesisVoice);

describe("Jarvis warm voice selection", () => {
  it("prefers an explicitly selected installed voice before its warm feminine default", () => {
    const voices = [voice("Microsoft Zira"), voice("Google US English")];
    expect(selectJarvisBrowserVoice(voices, "Google US English")?.name).toBe("Google US English");
    expect(selectJarvisBrowserVoice(voices)?.name).toBe("Microsoft Zira");
  });

  it("uses a safe English fallback and a warm balanced profile when no matching voice exists", () => {
    expect(selectJarvisBrowserVoice([voice("Google US English")])?.name).toBe("Google US English");
    expect(getJarvisVoiceProfile("balanced")).toEqual({ rate: 0.96, pitch: 1.08 });
  });
});
