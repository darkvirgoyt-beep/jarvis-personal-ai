export type JarvisVoiceProfile = { rate: number; pitch: number };

const warmFeminineName = /\b(aria|ava|emma|jenny|samantha|serena|sonia|susan|zira|hazel|nora|olivia|victoria|female|woman)\b/i;

export function getJarvisVoiceProfile(personality?: "balanced" | "concise" | "strategic" | "creative"): JarvisVoiceProfile {
  if (personality === "concise") return { rate: 1.08, pitch: 0.98 };
  if (personality === "creative") return { rate: 0.96, pitch: 1.12 };
  if (personality === "strategic") return { rate: 0.92, pitch: 0.94 };
  return { rate: 0.96, pitch: 1.08 };
}

export function selectJarvisBrowserVoice(voices: SpeechSynthesisVoice[], selectedVoiceName?: string | null): SpeechSynthesisVoice | undefined {
  const requested = selectedVoiceName?.trim();
  if (requested) {
    const exact = voices.find((voice) => voice.name === requested);
    if (exact) return exact;
  }

  return voices.find((voice) => /^en/i.test(voice.lang) && warmFeminineName.test(voice.name))
    ?? voices.find((voice) => /^en/i.test(voice.lang))
    ?? voices[0];
}
