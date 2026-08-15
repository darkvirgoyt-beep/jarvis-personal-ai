import { COOKIE_NAME } from "@shared/const";

function authHeaders() {
  const headers = new Headers();
  try {
    const raw = sessionStorage.getItem("manus-cookie");
    const prefix = `${COOKIE_NAME}=`;
    const pair = raw?.split(";").find((item) => item.trim().startsWith(prefix));
    const token = pair?.trim().slice(prefix.length);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } catch {
    // sessionStorage may be unavailable; browser cookies remain usable.
  }
  return headers;
}

export async function streamJarvisResponse(input: {
  content: string;
  agent: "general" | "coding" | "research" | "files" | "system" | "creative";
  conversationId?: number;
  onEvent: (event: string, data: Record<string, unknown>) => void;
}) {
  const headers = authHeaders();
  headers.set("Content-Type", "application/json");
  const response = await fetch("/api/jarvis/stream", {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ content: input.content, agent: input.agent, conversationId: input.conversationId }),
  });
  if (!response.ok || !response.body) throw new Error("Jarvis stream could not be started.");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const rawEvent of events) {
      const event = rawEvent.match(/^event:\s*(.+)$/m)?.[1]?.trim() ?? "message";
      const dataLine = rawEvent.match(/^data:\s*(.+)$/m)?.[1];
      if (!dataLine) continue;
      try {
        input.onEvent(event, JSON.parse(dataLine) as Record<string, unknown>);
      } catch {
        // Ignore malformed keep-alive frames.
      }
    }
  }
}

export async function transcribeJarvisAudio(audio: Blob) {
  const headers = authHeaders();
  headers.set("Content-Type", audio.type.split(";")[0] || "audio/webm");
  const response = await fetch("/api/jarvis/transcribe", {
    method: "POST",
    credentials: "include",
    headers,
    body: audio,
  });
  const payload = await response.json() as { text?: string; error?: string };
  if (!response.ok || !payload.text) throw new Error(payload.error ?? "Jarvis could not transcribe that recording.");
  return payload.text;
}
