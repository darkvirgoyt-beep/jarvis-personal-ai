import { describe, expect, it } from "vitest";

describe("OPENAI_API_KEY", () => {
  it("authenticates a lightweight server-side OpenAI models request", async () => {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    expect(apiKey, "OPENAI_API_KEY must be configured for Jarvis transcription").toBeTruthy();

    const response = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    expect(response.ok, "The configured OPENAI_API_KEY was not accepted by OpenAI").toBe(true);
  }, 30_000);
});
