import express, { type Express, type Request, type Response } from "express";
import { z } from "zod";
import * as db from "./db";
import { streamLLM } from "./_core/llm";
import { isNemotronCredentialUnavailable, streamNemotronUltra } from "./nemotron";
import { isAlternateJarvisModel } from "../shared/jarvisModels";
import { authenticateJarvisRequest, type AuthenticatedUser } from "./_core/authentication";
import { OpenAITranscriptionError, transcribeJarvisVoice } from "./openaiTranscription";
import { agentInstructions, extractMemoryCommand, extractTaskCommand, requiresExplicitConfirmation } from "./jarvisPolicies";
import { buildJarvisBasicFallback } from "./jarvisBasicFallback";

const streamInputSchema = z.object({
  content: z.string().trim().min(1).max(12000),
  agent: z.enum(["general", "coding", "research", "files", "system", "creative"]).default("general"),
  conversationId: z.number().int().positive().optional(),
});

function conversationTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  return normalized.length > 70 ? `${normalized.slice(0, 67)}…` : normalized;
}

function writeEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function parseDelta(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const choice = (data as { choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }> }).choices?.[0];
  return choice?.delta?.content ?? choice?.message?.content ?? "";
}

function extractHttpsSources(content: string) {
  return Array.from(new Set((content.match(/https:\/\/[^\s,)>]+/g) ?? []).filter((url) => {
    try {
      return new URL(url).protocol === "https:";
    } catch {
      return false;
    }
  })));
}

async function sendStaticCompletion(res: Response, content: string, state: { closed: boolean }) {
  if (!state.closed) writeEvent(res, "delta", { text: content });
  if (!state.closed) writeEvent(res, "done", {});
}

export function registerJarvisStream(app: Express) {
  app.post("/api/jarvis/stream", async (req: Request, res: Response) => {
    let user: AuthenticatedUser;
    try {
      user = await authenticateJarvisRequest(req);
    } catch {
      return res.status(401).json({ error: "Please sign in to use Jarvis." });
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    let closed = false;
    let finished = false;
    const controller = new AbortController();
    res.on("close", () => {
      closed = true;
      if (!finished) controller.abort();
    });

    try {
      const input = streamInputSchema.parse(req.body);
      let conversationId = input.conversationId;
      if (conversationId) {
        const conversation = await db.getJarvisConversation(user.id, conversationId);
        if (!conversation) {
          writeEvent(res, "error", { message: "Jarvis conversation not found." });
          finished = true;
          return res.end();
        }
      } else {
        const conversation = await db.createJarvisConversation(user.id, conversationTitle(input.content), input.agent);
        conversationId = conversation?.id;
      }

      if (!conversationId) throw new Error("Jarvis could not initialize a conversation");
      await db.createJarvisMessage({ userId: user.id, conversationId, role: "user", content: input.content, agent: input.agent });
      writeEvent(res, "meta", { conversationId, agent: input.agent });

      const pendingTask = extractTaskCommand(input.content);
      if (pendingTask) {
        await db.createJarvisTask({ userId: user.id, title: pendingTask, priority: "medium" });
      }
      const pendingMemory = extractMemoryCommand(input.content);
      if (pendingMemory) {
        await db.createJarvisMemory({ userId: user.id, content: pendingMemory, category: "note", source: "conversation" });
      }

      if (requiresExplicitConfirmation(input.content)) {
        const confirmation = await db.createJarvisConfirmation({
          userId: user.id,
          action: "Review requested high-impact operation",
          riskLevel: "high",
          payload: JSON.stringify({ requestedCommand: input.content, agent: input.agent }),
        });
        const response = "I created a review gate for that operation. Jarvis will not perform destructive or external actions without your explicit approval, and no external tool is connected or executed at this stage.";
        await sendStaticCompletion(res, response, { closed });
        await db.createJarvisMessage({ userId: user.id, conversationId, role: "assistant", content: response, agent: input.agent });
        writeEvent(res, "confirmation", { id: confirmation?.id, status: "pending" });
        finished = true;
        return res.end();
      }

      const [history, memories, preferences] = await Promise.all([
        db.listJarvisMessages(user.id, conversationId),
        db.listJarvisMemories(user.id),
        db.getJarvisPreferences(user.id),
      ]);
      const minimalContext = preferences?.privacyMode === "minimal";
      const recentHistory = (minimalContext ? [] : history.slice(-18)).map((message) => ({ role: message.role, content: message.content }));
      const memoryContext = minimalContext ? "Minimal privacy mode is active. Do not include stored memory context." : (memories.slice(0, 8).map((memory) => `- [${memory.category}] ${memory.content}`).join("\n") || "No saved memories.");
      const systemPrompt = [
        "You are Jarvis, a private personal AI assistant. Address the user naturally as Jarvis; never call yourself another product or assistant.",
        agentInstructions[input.agent],
        `Personality setting: ${preferences?.personality ?? "balanced"}.`,
        `Privacy mode: ${preferences?.privacyMode ?? "standard"}.`,
        "Safety is mandatory: never claim to have accessed a computer, file system, account, device, email, calendar, smart-home system, terminal, or other external service unless a connected tool result is supplied in the conversation. Never execute, simulate executing, or imply completion of external or destructive actions. Describe proposed actions and require explicit user confirmation for high-impact operations.",
        "The user may request web research. If live source material is not provided, state the limitation and give a concrete research plan rather than fabricating current facts or citations.",
        `Private memory relevant to this conversation:\n${memoryContext}`,
      ].join("\n\n");

      const modelMessages = [{ role: "system" as const, content: systemPrompt }, ...recentHistory];
      let upstream: globalThis.Response | undefined;
      let fullResponse = "";
      const emitBasicFallback = (reason: "provider-auth" | "providers-unavailable") => {
        fullResponse = buildJarvisBasicFallback(input.content, input.agent);
        writeEvent(res, "meta", { provider: "basic-local", reason });
        if (!closed) writeEvent(res, "delta", { text: fullResponse });
      };
      const useManagedFallback = async () => {
        writeEvent(res, "meta", { provider: "managed-fallback", model: "gpt-5-mini" });
        try {
          upstream = await streamLLM({
            model: "gpt-5-mini",
            maxTokens: 1100,
            messages: modelMessages,
            signal: controller.signal,
          });
        } catch (fallbackError) {
          if (controller.signal.aborted) throw fallbackError;
          console.warn("[Jarvis] Managed fallback unavailable; returning the local basic response mode.");
          emitBasicFallback("providers-unavailable");
        }
      };
      const alternateModel = isAlternateJarvisModel(preferences?.model) ? preferences.model : undefined;
      if (alternateModel) {
        try {
          writeEvent(res, "meta", { provider: "selected", model: alternateModel });
          upstream = await streamLLM({
            model: alternateModel,
            maxTokens: 1100,
            messages: modelMessages,
            signal: controller.signal,
          });
        } catch (providerError) {
          if (controller.signal.aborted) throw providerError;
          console.warn(`[Jarvis] Selected model ${alternateModel} unavailable; returning to Nemotron 3 Ultra.`);
          writeEvent(res, "meta", { provider: "nemotron-fallback" });
          try {
            upstream = await streamNemotronUltra({ messages: modelMessages, signal: controller.signal });
          } catch (nemotronError) {
            if (controller.signal.aborted) throw nemotronError;
            if (isNemotronCredentialUnavailable(nemotronError)) {
              console.warn("[Jarvis] Nemotron credentials are unavailable; returning the local basic response mode.");
              emitBasicFallback("provider-auth");
            } else {
              await useManagedFallback();
            }
          }
        }
      } else {
        try {
          upstream = await streamNemotronUltra({ messages: modelMessages, signal: controller.signal });
        } catch (providerError) {
          if (controller.signal.aborted) throw providerError;
          if (isNemotronCredentialUnavailable(providerError)) {
            console.warn("[Jarvis] Nemotron credentials are unavailable; returning the local basic response mode.");
            emitBasicFallback("provider-auth");
          } else {
            console.warn("[Jarvis] Nemotron 3 Ultra unavailable; using the configured resilient fallback.");
            await useManagedFallback();
          }
        }
      }
      if (upstream?.headers.get("content-type")?.includes("application/json")) {
        const response = await upstream.json();
        fullResponse = parseDelta(response);
        if (fullResponse && !closed) writeEvent(res, "delta", { text: fullResponse });
      } else if (upstream) {
        if (!upstream.body) throw new Error("Jarvis response stream was unavailable");
        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let streamComplete = false;

        while (!streamComplete && !closed) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") {
              streamComplete = true;
              break;
            }
            try {
              const delta = parseDelta(JSON.parse(data));
              if (delta) {
                fullResponse += delta;
                if (!closed) writeEvent(res, "delta", { text: delta });
              }
            } catch {
              // Ignore provider keep-alive and non-content frames.
            }
          }
        }
      }

      if (fullResponse.trim()) {
        await db.createJarvisMessage({ userId: user.id, conversationId, role: "assistant", content: fullResponse, agent: input.agent });
        if (input.agent === "research") {
          await db.createJarvisResearchRecord({
            userId: user.id,
            conversationId,
            topic: input.content.slice(0, 500),
            sourceLedger: JSON.stringify(extractHttpsSources(input.content)),
            summary: fullResponse,
          });
        }
      }
      if (!closed) writeEvent(res, "done", { taskCreated: Boolean(pendingTask), memorySaved: Boolean(pendingMemory) });
    } catch (error) {
      if (!closed) {
        const message = error instanceof z.ZodError
          ? "Jarvis needs a shorter valid command before continuing."
          : "Jarvis could not complete that response. Please try again.";
        writeEvent(res, "error", { message });
      }
    } finally {
      finished = true;
      if (!closed) res.end();
    }
  });
}

export function registerJarvisVoice(app: Express) {
  app.post("/api/jarvis/transcribe", async (req: Request, res: Response) => {
    let user: AuthenticatedUser;
    try {
      user = await authenticateJarvisRequest(req);
    } catch {
      return res.status(401).json({ error: "Please sign in to use Jarvis voice." });
    }
    try {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: "Jarvis received no audio data." });
      }
      if (req.body.length > 16 * 1024 * 1024) {
        return res.status(413).json({ error: "Voice commands must be smaller than 16 MB." });
      }
      const mimeType = req.headers["content-type"]?.split(";")[0] || "audio/webm";
      const result = await transcribeJarvisVoice(req.body, mimeType);
      return res.json({ text: result.text.trim(), language: result.language ?? null });
    } catch (error) {
      console.error("[Jarvis voice] Transcription failed", error);
      const status = error instanceof OpenAITranscriptionError ? error.status : 500;
      return res.status(status).json({ error: "Jarvis could not transcribe that voice command." });
    }
  });
}
