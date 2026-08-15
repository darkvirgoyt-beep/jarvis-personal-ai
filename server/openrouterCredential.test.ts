import { describe, expect, it } from "vitest";

describe("OpenRouter credential", () => {
  it("authenticates against the model catalog for Jarvis inference", async () => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    expect(apiKey, "OPENROUTER_API_KEY must be available to the server").toBeTruthy();

    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(12_000),
    });

    expect(response.status).toBe(200);
    const body = await response.json() as { data?: Array<{ id?: string }> };
    expect(body.data?.some((model) => model.id === "nvidia/nemotron-3-ultra-550b-a55b" || model.id === "nvidia/nemotron-3-ultra-550b-a55b:free")).toBe(true);
  }, 15_000);

  it("returns server-sent response frames from Nemotron 3 Ultra", async () => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-ultra-550b-a55b",
        messages: [{ role: "user", content: "Reply only with: ready" }],
        stream: true,
        max_tokens: 8,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(25_000),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    const decoder = new TextDecoder();
    let receivedDataFrame = false;
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline && !receivedDataFrame) {
      const frame = await reader!.read();
      if (frame.done) break;
      const frameText = decoder.decode(frame.value, { stream: true });
      receivedDataFrame = frameText.split("\n").some((line) => line.startsWith("data:"));
    }
    await reader?.cancel();
    expect(receivedDataFrame).toBe(true);
  }, 30_000);
});
