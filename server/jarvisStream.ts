import express, { type Express, type Request, type Response } from "express";
import { z } from "zod";
import * as db from "./db";
import { streamLLM } from "./_core/llm";
import { ANTHROPIC_FABLE_5_MODEL, isNemotronCredentialUnavailable, streamNemotronUltra, streamOpenRouterModel } from "./nemotron";
import { isAlternateJarvisModel } from "../shared/jarvisModels";
import { JARVIS_REAL_RESULT_ONLY_RULE } from "../shared/jarvisAdvancedWorkflow";
import { extractDurableMemoryCandidate, isDuplicateDurableMemory, shouldCaptureDurableMemory } from "../shared/jarvisDurableMemory";
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

function isJarvisBuildRequest(content: string, agent: string) {
  return agent === "coding" || /\b(build|website|web app|application|frontend|backend|api|database|code|compile|deploy|publish|apk|android)\b/i.test(content);
}

const broadBuildDenialPattern = /\b(?:I|Jarvis)\s+(?:can(?:not|['’]t)|cannot)\s+(?:compile|run|sign|publish|deploy)\b[^.!?]{0,360}[.!?]?/gi;
const correctedBuildCapability = "Jarvis can prepare the architecture, reviewed code and artifacts, compile-readiness checks, a paired compile-worker job, GitHub handoff, and an explicit deployment proposal. For supported build recipes, a paired runner executes the approved job and returns a real sanitized result. When no runner is paired, Jarvis stages the reviewed job and clearly reports that connection status instead of claiming the build is complete. Signing, publishing, deployment, and app-store submission still require the relevant connected provider and explicit approval.";

export function normalizeJarvisBuildCapabilityResponse(content: string, isBuildRequest: boolean) {
  if (!isBuildRequest) return content;
  return content.replace(broadBuildDenialPattern, correctedBuildCapability);
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
      const buildRequest = isJarvisBuildRequest(input.content, input.agent);
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
      const automaticMemory = shouldCaptureDurableMemory({ enabled: preferences?.durableMemoryEnabled, privacyMode: preferences?.privacyMode, hasExplicitMemoryCommand: Boolean(pendingMemory) })
        ? extractDurableMemoryCandidate(input.content)
        : undefined;
      const recentHistory = (minimalContext ? [] : history.slice(-18)).map((message) => ({ role: message.role, content: message.content }));
      const memoryContext = minimalContext ? "Minimal privacy mode is active. Do not include stored memory context." : (memories.slice(0, 8).map((memory) => `- [${memory.category}] ${memory.content}`).join("\n") || "No saved memories.");
      const systemPrompt = [
        "You are Jarvis, a private personal AI assistant. Address the user naturally as Jarvis; never call yourself another product or assistant.",
        agentInstructions[input.agent],
        `Personality setting: ${preferences?.personality ?? "balanced"}.`,
        `Privacy mode: ${preferences?.privacyMode ?? "standard"}.`,
        `Runtime time context (UTC, generated at this request): ${new Date().toISOString()}. Treat this as the authoritative current timestamp for this response; explain time-zone conversions instead of guessing local time.`,
        "Capability contract: Jarvis supports app and website work. For build requests, confidently offer to turn requirements into a reviewed Builder brief, architecture, implementation plan, code and artifact proposals, compile-readiness review, cloud-runner requirements, repository handoff, and an explicit deployment proposal. First identify the intended target (web build, Android package, or cloud service) and explain the toolchain, test, artifact, and signing or runtime requirements. Never falsely say that Jarvis cannot build applications, make code, compile a project, or deploy as a broad limitation. Be precise instead: a real external build, repository mutation, deployment, signing, app-store submission, or virtual-computer action occurs only after a connected tool result and any required explicit approval. Do not use an unavailable file system, IDE, CI/CD pipeline, app-store account, or unconnected cloud runner as a reason to deny app-building assistance.",
        "Normal language first: infer the right workflow from the user’s ordinary prompt. For build, code, debugging, research, documents, data, images, or environment requests, lead with a concrete reviewed plan and useful artifacts instead of requiring the user to select a technical mode. For Ubuntu, Kali-compatible security-lab, terminal, browser, sandbox, or virtual-computer requests, prepare requirements and an explicit approval-gated handoff; never claim the environment is connected before an actual tool result exists.",
        `Advanced tool contract: ${JARVIS_REAL_RESULT_ONLY_RULE}`,
        "Safety is mandatory: never claim to have accessed a computer, file system, account, device, email, calendar, smart-home system, terminal, or other external service unless a connected tool result is supplied in the conversation. Never execute, simulate executing, or imply completion of external or destructive actions. Describe proposed actions and require explicit user confirmation for high-impact operations.",
        "The user may request web research. If live source material is not provided, state the limitation and give a concrete research plan rather than fabricating current facts or citations.",
        `Private memory relevant to this conversation:\n${memoryContext}`,
      ].join("\n\n");

      const modelMessages = [{ role: "system" as const, content: systemPrompt }, ...recentHistory];
      let upstream: globalThis.Response | undefined;
      let fullResponse = "";
      let pendingBuildSentence = "";
      const emitModelText = (text: string) => {
        const normalizedText = normalizeJarvisBuildCapabilityResponse(text, buildRequest);
        if (!normalizedText) return;
        fullResponse += normalizedText;
        if (!closed) writeEvent(res, "delta", { text: normalizedText });
      };
      const emitBuildSentences = (force = false) => {
        if (!pendingBuildSentence) return;
        const sentenceEnd = Math.max(pendingBuildSentence.lastIndexOf("."), pendingBuildSentence.lastIndexOf("!"), pendingBuildSentence.lastIndexOf("?"));
        const length = force ? pendingBuildSentence.length : sentenceEnd + 1;
        if (length <= 0) return;
        const text = pendingBuildSentence.slice(0, length);
        pendingBuildSentence = pendingBuildSentence.slice(length);
        emitModelText(text);
      };
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
          if (alternateModel === "claude-fable-5") {
            writeEvent(res, "meta", { provider: "openrouter-selected", model: ANTHROPIC_FABLE_5_MODEL });
            upstream = await streamOpenRouterModel({
              model: ANTHROPIC_FABLE_5_MODEL,
              messages: modelMessages,
              signal: controller.signal,
            });
          } else {
            writeEvent(res, "meta", { provider: "selected", model: alternateModel });
            upstream = await streamLLM({
              model: alternateModel,
              maxTokens: 1100,
              messages: modelMessages,
              signal: controller.signal,
            });
          }
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
        emitModelText(parseDelta(response));
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
                if (buildRequest) {
                  pendingBuildSentence += delta;
                  emitBuildSentences();
                } else {
                  emitModelText(delta);
                }
              }
            } catch {
              // Ignore provider keep-alive and non-content frames.
            }
          }
        }
      }

      if (buildRequest) emitBuildSentences(true);

      if (fullResponse.trim()) {
        await db.createJarvisMessage({ userId: user.id, conversationId, role: "assistant", content: fullResponse, agent: input.agent });
        if (automaticMemory && !isDuplicateDurableMemory(automaticMemory, memories)) {
          await db.createJarvisMemory({ userId: user.id, content: automaticMemory.content, category: automaticMemory.category, source: "conversation" });
        }
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
      if (!closed) writeEvent(res, "done", { taskCreated: Boolean(pendingTask), memorySaved: Boolean(pendingMemory || automaticMemory) });
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
