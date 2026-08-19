import { ENV } from "./_core/env";

export type OpenAITranscriptionResult = {
  text: string;
  language?: string;
};

export class OpenAITranscriptionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "OpenAITranscriptionError";
  }
}

function filenameForMimeType(mimeType: string) {
  if (mimeType.includes("ogg")) return "command.ogg";
  if (mimeType.includes("mp4") || mimeType.includes("m4a")) return "command.m4a";
  if (mimeType.includes("wav")) return "command.wav";
  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) return "command.mp3";
  return "command.webm";
}

/**
 * Sends a recorded command directly to OpenAI while it remains in request memory.
 * No audio file is written to the managed storage service or persisted by Jarvis.
 */
export async function transcribeJarvisVoice(
  audio: Buffer,
  mimeType: string,
): Promise<OpenAITranscriptionResult> {
  if (!ENV.openaiApiKey) {
    throw new OpenAITranscriptionError("Jarvis voice transcription is not configured.", 503);
  }

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), filenameForMimeType(mimeType));
  form.append("model", "whisper-1");
  form.append("response_format", "verbose_json");
  form.append("prompt", "Transcribe the user's spoken Jarvis command accurately. Preserve names, commands, and technical terms where possible.");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${ENV.openaiApiKey}` },
    body: form,
  });
  if (!response.ok) {
    throw new OpenAITranscriptionError("Jarvis could not transcribe that voice command.", response.status);
  }

  const payload = await response.json() as { text?: unknown; language?: unknown };
  if (typeof payload.text !== "string" || !payload.text.trim()) {
    throw new OpenAITranscriptionError("Jarvis received an invalid transcription response.", 502);
  }
  return {
    text: payload.text.trim(),
    language: typeof payload.language === "string" ? payload.language : undefined,
  };
}
