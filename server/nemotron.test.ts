import { afterEach, describe, expect, it, vi } from "vitest";
import { NEMOTRON_ULTRA_MODEL, isNemotronCredentialUnavailable, streamNemotronUltra } from "./nemotron";

const savedApiKey = process.env.OPENROUTER_API_KEY;

afterEach(() => {
  process.env.OPENROUTER_API_KEY = savedApiKey;
});

describe("Nemotron 3 Ultra provider", () => {
  it("recognizes missing and unauthorized provider credentials without treating transient failures as auth errors", () => {
    expect(isNemotronCredentialUnavailable(new Error("Jarvis Nemotron provider is not configured"))).toBe(true);
    expect(isNemotronCredentialUnavailable(new Error("Nemotron provider request failed (403): forbidden"))).toBe(true);
    expect(isNemotronCredentialUnavailable(new Error("upstream timed out"))).toBe(false);
  });

  it("opens an OpenRouter SSE request with the fixed Jarvis primary model", async () => {
    process.env.OPENROUTER_API_KEY = "test-provider-key";
    const fetchImpl = vi.fn().mockResolvedValue(new Response("data: [DONE]\n\n", {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    }));

    await streamNemotronUltra({
      messages: [{ role: "user", content: "Jarvis status" }],
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-provider-key" }),
      }),
    );
    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit;
    expect(JSON.parse(String(init.body))).toMatchObject({
      model: NEMOTRON_ULTRA_MODEL,
      stream: true,
      max_tokens: 1100,
      messages: [{ role: "user", content: "Jarvis status" }],
    });
  });

  it("rejects missing provider credentials before a network request", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const fetchImpl = vi.fn();

    await expect(streamNemotronUltra({ messages: [{ role: "user", content: "Hello" }], fetchImpl })).rejects.toThrow("not configured");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
