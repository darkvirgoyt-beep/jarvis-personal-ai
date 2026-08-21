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
  createJarvisResearchRecord: vi.fn(),
  listJarvisMessages: vi.fn(),
  listJarvisMemories: vi.fn(),
  getJarvisPreferences: vi.fn(),
}));
vi.mock("./_core/llm", () => ({ streamLLM: vi.fn() }));
vi.mock("./openaiTranscription", () => ({
  transcribeJarvisVoice: vi.fn(),
  OpenAITranscriptionError: class OpenAITranscriptionError extends Error {
    constructor(message: string, readonly status: number) { super(message); }
  },
}));
vi.mock("./nemotron", () => ({
  streamNemotronUltra: vi.fn(),
  isNemotronCredentialUnavailable: (error: unknown) => /not configured|\b401\b|\b403\b|unauthorized|forbidden|invalid (api )?key|authorization/i.test(error instanceof Error ? error.message : String(error)),
}));

import * as db from "./db";
import { sdk } from "./_core/sdk";
import { transcribeJarvisVoice } from "./openaiTranscription";
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
  it("returns 401 instead of an SSE stream when the stream request is unauthenticated", async () => {
    let handler: ((req: Request, res: Response) => Promise<unknown>) | undefined;
    const app = { post: vi.fn((_path: string, fn: typeof handler) => { handler = fn; }) } as unknown as Express;
    registerJarvisStream(app);
    vi.mocked(sdk.authenticateRequest).mockRejectedValue(new Error("Invalid session cookie"));
    const res = responseRecorder();

    await handler!({ body: { content: "Private command" } } as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Please sign in to use Jarvis." });
    expect(res.write).not.toHaveBeenCalled();
  });

  it("returns 401 instead of transcribing when the voice request is unauthenticated", async () => {
    let handler: ((req: Request, res: Response) => Promise<unknown>) | undefined;
    const app = { post: vi.fn((_path: string, ...handlers: Array<typeof handler>) => { handler = handlers.at(-1); }) } as unknown as Express;
    registerJarvisVoice(app);
    vi.mocked(sdk.authenticateRequest).mockRejectedValue(new Error("Invalid session cookie"));
    const res = responseRecorder();

    await handler!({ body: Buffer.from("voice-data") } as unknown as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Please sign in to use Jarvis voice." });
    expect(transcribeJarvisVoice).not.toHaveBeenCalled();
  });

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

  it("sends valid recorded audio directly to the server-only transcription provider without persisting it", async () => {
    let handler: ((req: Request, res: Response) => Promise<unknown>) | undefined;
    const app = { post: vi.fn((_path: string, ...handlers: Array<typeof handler>) => { handler = handlers.at(-1); }) } as unknown as Express;
    registerJarvisVoice(app);
    vi.mocked(sdk.authenticateRequest).mockResolvedValue(authUser());
    vi.mocked(transcribeJarvisVoice).mockResolvedValue({ text: "Create a task", language: "en" } as never);
    const res = responseRecorder();

    await handler!({ body: Buffer.from("voice-data"), headers: { "content-type": "audio/webm" } } as unknown as Request, res as unknown as Response);

    expect(transcribeJarvisVoice).toHaveBeenCalledWith(expect.any(Buffer), "audio/webm");
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
    expect(res.writes.join("")).toContain('"provider":"managed-fallback"');
    expect(db.createJarvisMessage).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, conversationId: 12, content: "Fallback response" }));
  });

  it("tells live-model fallbacks to support reviewed app building and deployment proposals without falsely denying those capabilities", async () => {
    let handler: ((req: Request, res: Response) => Promise<unknown>) | undefined;
    const app = { post: vi.fn((_path: string, fn: typeof handler) => { handler = fn; }) } as unknown as Express;
    registerJarvisStream(app);
    vi.mocked(sdk.authenticateRequest).mockResolvedValue(authUser());
    vi.mocked(db.createJarvisConversation).mockResolvedValue({ id: 13 } as never);
    vi.mocked(db.listJarvisMessages).mockResolvedValue([] as never);
    vi.mocked(db.listJarvisMemories).mockResolvedValue([] as never);
    vi.mocked(db.getJarvisPreferences).mockResolvedValue({ personality: "balanced" } as never);
    vi.mocked(db.createJarvisMessage).mockResolvedValue(undefined);
    vi.mocked(streamNemotronUltra).mockRejectedValue(new Error("provider unavailable"));
    vi.mocked(streamLLM).mockResolvedValue(new Response(
      'data: {"choices":[{"delta":{"content":"I can prepare a reviewed build proposal."}}]}\n\ndata: [DONE]\n\n',
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    ));
    const res = responseRecorder();

    await handler!({ body: { content: "Can you make and deploy an app?", agent: "coding" } } as Request, res as unknown as Response);

    expect(streamLLM).toHaveBeenCalledWith(expect.objectContaining({
      messages: expect.arrayContaining([
        expect.objectContaining({
          role: "system",
          content: expect.stringContaining("Jarvis supports app and website work"),
        }),
        expect.objectContaining({
          role: "system",
          content: expect.stringContaining("Never falsely say that Jarvis cannot build applications"),
        }),
        expect.objectContaining({
          role: "system",
          content: expect.stringContaining("Runtime time context (UTC, generated at this request)"),
        }),
        expect.objectContaining({
          role: "system",
          content: expect.stringContaining("Normal language first: infer the right workflow"),
        }),
      ]),
    }));
    expect(res.writes.join("")).toContain("reviewed build proposal");
  });

  it("replaces a broad model denial with accurate approval-gated build guidance before streaming or persistence", async () => {
    let handler: ((req: Request, res: Response) => Promise<unknown>) | undefined;
    const app = { post: vi.fn((_path: string, fn: typeof handler) => { handler = fn; }) } as unknown as Express;
    registerJarvisStream(app);
    vi.mocked(sdk.authenticateRequest).mockResolvedValue(authUser());
    vi.mocked(db.createJarvisConversation).mockResolvedValue({ id: 16 } as never);
    vi.mocked(db.listJarvisMessages).mockResolvedValue([] as never);
    vi.mocked(db.listJarvisMemories).mockResolvedValue([] as never);
    vi.mocked(db.getJarvisPreferences).mockResolvedValue({ personality: "balanced" } as never);
    vi.mocked(db.createJarvisMessage).mockResolvedValue(undefined);
    vi.mocked(streamNemotronUltra).mockResolvedValue(new Response(
      'data: {"choices":[{"delta":{"content":"I can’t compile, run, sign, or publish it for you; you’ll copy the files into your own repo."}}]}\n\ndata: [DONE]\n\n',
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    ));
    const res = responseRecorder();

    await handler!({ body: { content: "Build and deploy a mobile app", agent: "coding" } } as Request, res as unknown as Response);

    const emitted = res.writes.join("");
    expect(emitted).not.toContain("I can’t compile, run, sign, or publish it for you");
    expect(emitted).toContain("Jarvis can prepare the architecture");
    expect(emitted).toContain("requires a connected runner or provider result");
    expect(db.createJarvisMessage).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining("Jarvis can prepare the architecture") }));
  });

  it("honors a validated persisted model preference while retaining Nemotron as the default path", async () => {
    let handler: ((req: Request, res: Response) => Promise<unknown>) | undefined;
    const app = { post: vi.fn((_path: string, fn: typeof handler) => { handler = fn; }) } as unknown as Express;
    registerJarvisStream(app);
    vi.mocked(streamNemotronUltra).mockReset();
    vi.mocked(sdk.authenticateRequest).mockResolvedValue(authUser());
    vi.mocked(db.createJarvisConversation).mockResolvedValue({ id: 14 } as never);
    vi.mocked(db.listJarvisMessages).mockResolvedValue([] as never);
    vi.mocked(db.listJarvisMemories).mockResolvedValue([] as never);
    vi.mocked(db.getJarvisPreferences).mockResolvedValue({ personality: "balanced", model: "gpt-5" } as never);
    vi.mocked(db.createJarvisMessage).mockResolvedValue(undefined);
    vi.mocked(streamLLM).mockResolvedValue(new Response(
      'data: {"choices":[{"delta":{"content":"Selected model response"}}]}\n\ndata: [DONE]\n\n',
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    ));
    const res = responseRecorder();

    await handler!({ body: { content: "Use my selected response model", agent: "general" } } as Request, res as unknown as Response);

    expect(streamLLM).toHaveBeenCalledWith(expect.objectContaining({ model: "gpt-5" }));
    expect(streamNemotronUltra).not.toHaveBeenCalled();
    expect(res.writes.join("")).toContain('"model":"gpt-5"');
  });

  it("uses the labelled local basic mode directly when the primary provider key is unauthorized", async () => {
    let handler: ((req: Request, res: Response) => Promise<unknown>) | undefined;
    const app = { post: vi.fn((_path: string, fn: typeof handler) => { handler = fn; }) } as unknown as Express;
    registerJarvisStream(app);
    vi.mocked(sdk.authenticateRequest).mockResolvedValue(authUser());
    vi.mocked(db.createJarvisConversation).mockResolvedValue({ id: 15 } as never);
    vi.mocked(db.listJarvisMessages).mockResolvedValue([] as never);
    vi.mocked(db.listJarvisMemories).mockResolvedValue([] as never);
    vi.mocked(db.getJarvisPreferences).mockResolvedValue({ personality: "balanced" } as never);
    vi.mocked(db.createJarvisMessage).mockResolvedValue(undefined);
    vi.mocked(streamNemotronUltra).mockRejectedValue(new Error("Nemotron provider request failed (403): forbidden"));
    vi.mocked(streamLLM).mockReset();
    const res = responseRecorder();

    await handler!({ body: { content: "Build a private website for my studio", agent: "coding" } } as Request, res as unknown as Response);

    expect(streamLLM).not.toHaveBeenCalled();
    expect(res.writes.join("")).toContain('"provider":"basic-local","reason":"provider-auth"');
    expect(res.writes.join("")).toContain("Jarvis app workspace mode is active");
    expect(res.writes.join("")).toContain("implementation and publish proposal for your approval");
  });

  it("persists a research summary and only valid unique HTTPS sources for the signed-in user", async () => {
    let handler: ((req: Request, res: Response) => Promise<unknown>) | undefined;
    const app = { post: vi.fn((_path: string, fn: typeof handler) => { handler = fn; }) } as unknown as Express;
    registerJarvisStream(app);
    vi.mocked(sdk.authenticateRequest).mockResolvedValue(authUser());
    vi.mocked(db.createJarvisConversation).mockResolvedValue({ id: 18 } as never);
    vi.mocked(db.listJarvisMessages).mockResolvedValue([] as never);
    vi.mocked(db.listJarvisMemories).mockResolvedValue([] as never);
    vi.mocked(db.getJarvisPreferences).mockResolvedValue({ personality: "balanced" } as never);
    vi.mocked(db.createJarvisMessage).mockResolvedValue(undefined);
    vi.mocked(db.createJarvisResearchRecord).mockResolvedValue(undefined);
    vi.mocked(streamNemotronUltra).mockResolvedValue(new Response(
      'data: {"choices":[{"delta":{"content":"Research summary"}}]}\n\ndata: [DONE]\n\n',
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    ));
    const res = responseRecorder();

    await handler!({ body: { content: "Research secure sources https://example.com/a https://example.com/a http://unsafe.example", agent: "research" } } as Request, res as unknown as Response);

    expect(db.createJarvisResearchRecord).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      conversationId: 18,
      summary: "Research summary",
      sourceLedger: JSON.stringify(["https://example.com/a"]),
    }));
  });
});
