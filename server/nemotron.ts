export const NEMOTRON_ULTRA_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
export const ANTHROPIC_FABLE_5_MODEL = "anthropic/claude-fable-5";

export function isNemotronCredentialUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /not configured|\b401\b|\b403\b|unauthorized|forbidden|invalid (api )?key|authorization/i.test(message);
}

type JarvisModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type NemotronStreamInput = {
  messages: JarvisModelMessage[];
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
};

type OpenRouterStreamInput = NemotronStreamInput & {
  model: string;
};

export async function streamOpenRouterModel({ model, messages, signal, fetchImpl = fetch }: OpenRouterStreamInput): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Jarvis selected provider is not configured");

  const response = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-OpenRouter-Title": "Jarvis Personal AI",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 1100,
      temperature: 0.35,
    }),
    signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Selected provider request failed (${response.status}): ${body.slice(0, 280)}`);
  }
  if (!response.body) throw new Error("Selected provider returned no response stream");
  return response;
}

/**
 * Opens an OpenRouter-compatible Server-Sent Events response for the fixed
 * Jarvis primary model. The browser never receives the provider credential.
 */
export async function streamNemotronUltra({ messages, signal, fetchImpl = fetch }: NemotronStreamInput): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Jarvis Nemotron provider is not configured");

  const response = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-OpenRouter-Title": "Jarvis Personal AI",
    },
    body: JSON.stringify({
      model: NEMOTRON_ULTRA_MODEL,
      messages,
      stream: true,
      max_tokens: 1100,
      temperature: 0.35,
    }),
    signal,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Nemotron provider request failed (${response.status}): ${body.slice(0, 280)}`);
  }
  if (!response.body) throw new Error("Nemotron provider returned no response stream");
  return response;
}
