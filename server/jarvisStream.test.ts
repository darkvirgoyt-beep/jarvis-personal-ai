import { describe, expect, it, vi } from "vitest";
import type { Express, Request, Response } from "express";

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: vi.fn() } }));
vi.mock("./db", () => ({
  getJarvisConversation: vi.fn(),
  createJarvisConversation: vi.fn(),
  createJarvisMessage: vi.fn(),
  createJarvisTask: vi.fn(),
  createJarvisMemory: vi.fn(),
  createJarvisConfirmation: vi.fn(),
  listJarvisMessages: vi.fn(),
  listJarvisMemories: vi.fn(),
  getJarvisPreferences: vi.fn(),
}));
vi.mock("./_core/llm", () => ({ streamLLM: vi.fn() }));
vi.mock("./storage", () => ({ storagePut: vi.fn(), storageGetSignedUrl: vi.fn() }));
vi.mock("./_core/voiceTranscription", () => ({ transcribeAudio: vi.fn() }));
vi.mock("./nemotron", () => ({ streamNemotronUltra: vi.fn() }));

import * as db from "./db";
import { sdk } from "./_core/sdk";
import { storageGetSignedUrl, storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";
import { streamLLM } from "./_core/llm";
import { streamNemotronUltra } from "./nemotron";
import { registerJarvisStream, registerJarvisVoice } from "./jarvisStream";

function authUser() {
  return { id: 42, openId: "jarvis-user" } as never;
}

function responseRecorder() {
  const writes: string[] = [];
  const result = {
    writes,
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    on: vi.fn(),
    write: vi.fn((value: string) => writes.push(value)),
    end: vi.fn(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
  return result;
}

describe("Jarvis authenticated endpoints", () => {
  it("does not stream messages from another user’s conversation", async () => {
    let handler: ((req: Request, res: Response) => Promise<unknown>) | undefined;
    const app = { post: vi.fn((_path: string, fn: typeof handler) => { handler = fn; }) } as unknown as Express;
    registerJarvisStream(app);
    vi.mocked(sdk.authenticateRequest).mockResolvedValue(authUser());
    vi.mocked(db.getJarvisConversation).mockResolvedValue(undefined);
    const res = responseRecorder();

    await handler!({ body: { content: "Show another user’s conversation", conversationId: 99 } } as Request, res as unknown as Response);

    expect(db.getJarvisConversation).toHaveBeenCalledWith(42, 99);
    expect(res.writes.join("")).toContain("Jarvis conversation not found");
    expect(db.createJarvisMessage).not.toHaveBeenCalled();
  });

  it("stores valid recorded audio beneath the authenticated user scope before transcription", async () => {
    let handler: ((req: Request, res: Response) => Promise<unknown>) | undefined;
    const app = { post: vi.fn((_path: string, ...handlers: Array<typeof handler>) => { handler = handlers.at(-1); }) } as unknown as Express;
    registerJarvisVoice(app);
    vi.mocked(sdk.authenticateRequest).mockResolvedValue(authUser());
    vi.mocked(storagePut).mockResolvedValue({ key: "jarvis/42/voice/command.webm" } as never);
    vi.mocked(storageGetSignedUrl).mockResolvedValue("https://signed.example/audio" as never);
    vi.mocked(transcribeAudio).mockResolvedValue({ text: "Create a task", language: "en" } as never);
    const res = responseRecorder();

    await handler!({ body: Buffer.from("voice-data"), headers: { "content-type": "audio/webm" } } as unknown as Request, res as unknown as Response);

    expect(storagePut).toHaveBeenCalledWith(expect.stringMatching(/^jarvis\/42\/voice\/command-\d+\.webm$/), expect.any(Buffer), "audio/webm");
    expect(transcribeAudio).toHaveBeenCalledWith(expect.objectContaining({ audioUrl: "https://signed.example/audio" }));
    expect(res.json).toHaveBeenCalledWith({ text: "Create a task", language: "en" });
  });

  it("emits incremental deltas through Jarvis and uses a resilient fallback when Nemotron is unavailable", async () => {
    let handler: ((req: Request, res: Response) => Promise<unknown>) | undefined;
    const app = { post: vi.fn((_path: string, fn: typeof handler) => { handler = fn; }) } as unknown as Express;
    registerJarvisStream(app);
    vi.mocked(sdk.authenticateRequest).mockResolvedValue(authUser());
    vi.mocked(db.createJarvisConversation).mockResolvedValue({ id: 12 } as never);
    vi.mocked(db.listJarvisMessages).mockResolvedValue([] as never);
    vi.mocked(db.listJarvisMemories).mockResolvedValue([] as never);
    vi.mocked(db.getJarvisPreferences).mockResolvedValue({ personality: "balanced" } as never);
    vi.mocked(db.createJarvisMessage).mockResolvedValue(undefined);
    vi.mocked(streamNemotronUltra).mockRejectedValue(new Error("provider unavailable"));
    vi.mocked(streamLLM).mockResolvedValue(new Response(
      'data: {"choices":[{"delta":{"content":"Fallback response"}}]}\n\ndata: [DONE]\n\n',
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    ));
    const res = responseRecorder();

    await handler!({ body: { content: "Give me a private status update", agent: "general" } } as Request, res as unknown as Response);

    expect(streamNemotronUltra).toHaveBeenCalled();
    expect(streamLLM).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-5-mini" }));
    expect(res.writes.join("")).toContain('"text":"Fallback response"');
    expect(res.writes.join("")).toContain('"provider":"fallback"');
    expect(db.createJarvisMessage).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, conversationId: 12, content: "Fallback response" }));
  });
});
