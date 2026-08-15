import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getJarvisConversation: vi.fn(),
  listJarvisConversations: vi.fn(),
  createJarvisConversation: vi.fn(),
  listJarvisMessages: vi.fn(),
  listJarvisMemories: vi.fn(),
  createJarvisMemory: vi.fn(),
  updateJarvisMemory: vi.fn(),
  deleteJarvisMemory: vi.fn(),
  listJarvisTasks: vi.fn(),
  createJarvisTask: vi.fn(),
  updateJarvisTask: vi.fn(),
  getJarvisPreferences: vi.fn(),
  updateJarvisPreferences: vi.fn(),
  listJarvisConfirmations: vi.fn(),
  createJarvisConfirmation: vi.fn(),
  resolveJarvisConfirmation: vi.fn(),
}));

import * as db from "./db";
import { appRouter } from "./routers";

function privateContext(userId = 42): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `jarvis-user-${userId}`,
      name: "Jarvis User",
      email: "jarvis@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  } as TrpcContext;
}

afterEach(() => vi.clearAllMocks());

describe("Jarvis private router", () => {
  it("denies access when the requested conversation does not belong to the signed-in user", async () => {
    vi.mocked(db.getJarvisConversation).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(privateContext(42));

    await expect(caller.jarvis.conversations.messages({ conversationId: 99 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.getJarvisConversation).toHaveBeenCalledWith(42, 99);
  });

  it("writes memories and confirmation decisions with the authenticated user id", async () => {
    vi.mocked(db.resolveJarvisConfirmation).mockResolvedValue(1);
    vi.mocked(db.createJarvisMemory).mockResolvedValue(undefined as never);
    const caller = appRouter.createCaller(privateContext(42));

    await caller.jarvis.memory.create({ content: "Use concise project updates", category: "preference" });
    await caller.jarvis.confirmations.resolve({ id: 7, decision: "rejected" });

    expect(db.createJarvisMemory).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, content: "Use concise project updates" }));
    expect(db.resolveJarvisConfirmation).toHaveBeenCalledWith(42, 7, "rejected");
  });

  it("scopes conversation, memory, task, preference, and confirmation procedures to the signed-in user", async () => {
    const empty = [] as never[];
    vi.mocked(db.listJarvisConversations).mockResolvedValue(empty as never);
    vi.mocked(db.createJarvisConversation).mockResolvedValue({ id: 11 } as never);
    vi.mocked(db.getJarvisConversation).mockResolvedValue({ id: 11, userId: 42 } as never);
    vi.mocked(db.listJarvisMessages).mockResolvedValue(empty as never);
    vi.mocked(db.listJarvisMemories).mockResolvedValue(empty as never);
    vi.mocked(db.updateJarvisMemory).mockResolvedValue(1);
    vi.mocked(db.deleteJarvisMemory).mockResolvedValue(1);
    vi.mocked(db.listJarvisTasks).mockResolvedValue(empty as never);
    vi.mocked(db.createJarvisTask).mockResolvedValue(undefined);
    vi.mocked(db.updateJarvisTask).mockResolvedValue(1);
    vi.mocked(db.getJarvisPreferences).mockResolvedValue({ userId: 42 } as never);
    vi.mocked(db.updateJarvisPreferences).mockResolvedValue({ userId: 42 } as never);
    vi.mocked(db.listJarvisConfirmations).mockResolvedValue(empty as never);
    vi.mocked(db.createJarvisConfirmation).mockResolvedValue({ id: 5 } as never);
    const caller = appRouter.createCaller(privateContext(42));

    await caller.jarvis.conversations.list();
    await caller.jarvis.conversations.create({ title: "Private plan", activeAgent: "coding" });
    await caller.jarvis.conversations.messages({ conversationId: 11 });
    await caller.jarvis.memory.list();
    await caller.jarvis.memory.update({ id: 3, content: "Private note", category: "note" });
    await caller.jarvis.memory.delete({ id: 3 });
    await caller.jarvis.tasks.list();
    const dueAt = new Date("2026-08-20T10:00:00.000Z");
    await caller.jarvis.tasks.create({ title: "Private task", priority: "high", dueAt });
    await caller.jarvis.tasks.update({ id: 2, status: "done" });
    await caller.jarvis.preferences.get();
    await caller.jarvis.preferences.update({
      continuousMode: true,
      privacyMode: "minimal",
      voiceName: "Jarvis Browser Voice",
      visualMode: "reduced_motion",
      pluginSettings: "{\"research\":true}",
    });
    await caller.jarvis.confirmations.list();
    await caller.jarvis.confirmations.propose({ action: "Review private action", details: "No execution" });

    expect(db.listJarvisConversations).toHaveBeenCalledWith(42);
    expect(db.createJarvisConversation).toHaveBeenCalledWith(42, "Private plan", "coding");
    expect(db.listJarvisMessages).toHaveBeenCalledWith(42, 11);
    expect(db.listJarvisMemories).toHaveBeenCalledWith(42);
    expect(db.updateJarvisMemory).toHaveBeenCalledWith(42, 3, "Private note", "note");
    expect(db.deleteJarvisMemory).toHaveBeenCalledWith(42, 3);
    expect(db.listJarvisTasks).toHaveBeenCalledWith(42);
    expect(db.createJarvisTask).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, title: "Private task", priority: "high", dueAt }));
    expect(db.updateJarvisTask).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, id: 2, status: "done" }));
    expect(db.getJarvisPreferences).toHaveBeenCalledWith(42);
    expect(db.updateJarvisPreferences).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      continuousMode: 1,
      privacyMode: "minimal",
      voiceName: "Jarvis Browser Voice",
      visualMode: "reduced_motion",
      pluginSettings: "{\"research\":true}",
    }));
    expect(db.listJarvisConfirmations).toHaveBeenCalledWith(42);
    expect(db.createJarvisConfirmation).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, action: "Review private action" }));
  });

  it("never substitutes another user id for private mutations", async () => {
    vi.mocked(db.updateJarvisMemory).mockResolvedValue(1);
    vi.mocked(db.deleteJarvisMemory).mockResolvedValue(1);
    vi.mocked(db.updateJarvisTask).mockResolvedValue(1);
    vi.mocked(db.updateJarvisPreferences).mockResolvedValue({ userId: 7 } as never);
    vi.mocked(db.resolveJarvisConfirmation).mockResolvedValue(1);
    const caller = appRouter.createCaller(privateContext(7));

    await caller.jarvis.memory.update({ id: 3, content: "User seven note", category: "note" });
    await caller.jarvis.memory.delete({ id: 3 });
    await caller.jarvis.tasks.update({ id: 2, priority: "low", dueAt: new Date("2026-08-17T00:00:00.000Z") });
    await caller.jarvis.preferences.update({ speechRate: 110 });
    await caller.jarvis.confirmations.resolve({ id: 9, decision: "approved" });

    expect(db.updateJarvisMemory).toHaveBeenCalledWith(7, 3, "User seven note", "note");
    expect(db.deleteJarvisMemory).toHaveBeenCalledWith(7, 3);
    expect(db.updateJarvisTask).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, id: 2, priority: "low" }));
    expect(db.updateJarvisPreferences).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, speechRate: 110 }));
    expect(db.resolveJarvisConfirmation).toHaveBeenCalledWith(7, 9, "approved");
  });

  it("ignores a forged preference owner id and always reads or writes only the authenticated user profile", async () => {
    vi.mocked(db.getJarvisPreferences).mockResolvedValue({ userId: 7, model: "nemotron-3-ultra" } as never);
    vi.mocked(db.updateJarvisPreferences).mockResolvedValue({ userId: 7, model: "nemotron-3-ultra" } as never);
    const caller = appRouter.createCaller(privateContext(7));

    await caller.jarvis.preferences.get();
    await caller.jarvis.preferences.update({ model: "nemotron-3-ultra", userId: 42 } as never);

    expect(db.getJarvisPreferences).toHaveBeenCalledWith(7);
    expect(db.updateJarvisPreferences).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, model: "nemotron-3-ultra" }));
    expect(db.updateJarvisPreferences).not.toHaveBeenCalledWith(expect.objectContaining({ userId: 42 }));
  });

  it("persists the privacy-memory model only on the authenticated profile while memory mutations retain the same scope", async () => {
    vi.mocked(db.getJarvisPreferences).mockResolvedValue({ userId: 7, privacyMode: "standard", continuousMode: 0 } as never);
    vi.mocked(db.updateJarvisPreferences).mockResolvedValue({ userId: 7, privacyMode: "minimal", continuousMode: 1 } as never);
    vi.mocked(db.createJarvisMemory).mockResolvedValue(undefined as never);
    vi.mocked(db.updateJarvisMemory).mockResolvedValue(1);
    vi.mocked(db.deleteJarvisMemory).mockResolvedValue(1);
    const caller = appRouter.createCaller(privateContext(7));

    await caller.jarvis.preferences.get();
    await caller.jarvis.preferences.update({ privacyMode: "minimal", continuousMode: true, userId: 42 } as never);
    await caller.jarvis.memory.create({ content: "Keep project notes private", category: "project" });
    await caller.jarvis.memory.update({ id: 31, content: "Keep project notes private and concise", category: "project" });
    await caller.jarvis.memory.delete({ id: 31 });

    expect(db.getJarvisPreferences).toHaveBeenCalledWith(7);
    expect(db.updateJarvisPreferences).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, privacyMode: "minimal", continuousMode: 1 }));
    expect(db.updateJarvisPreferences).not.toHaveBeenCalledWith(expect.objectContaining({ userId: 42 }));
    expect(db.createJarvisMemory).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, content: "Keep project notes private" }));
    expect(db.updateJarvisMemory).toHaveBeenCalledWith(7, 31, "Keep project notes private and concise", "project");
    expect(db.deleteJarvisMemory).toHaveBeenCalledWith(7, 31);
  });

  it("denies cross-user memory, task, and confirmation mutations when no user-scoped record is changed", async () => {
    vi.mocked(db.updateJarvisMemory).mockResolvedValue(0);
    vi.mocked(db.deleteJarvisMemory).mockResolvedValue(0);
    vi.mocked(db.updateJarvisTask).mockResolvedValue(0);
    vi.mocked(db.resolveJarvisConfirmation).mockResolvedValue(0);
    const caller = appRouter.createCaller(privateContext(7));

    await expect(caller.jarvis.memory.update({ id: 99, content: "Other user note", category: "note" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.jarvis.memory.delete({ id: 99 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.jarvis.tasks.update({ id: 99, status: "done" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.jarvis.confirmations.resolve({ id: 99, decision: "approved" })).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(db.updateJarvisMemory).toHaveBeenCalledWith(7, 99, "Other user note", "note");
    expect(db.deleteJarvisMemory).toHaveBeenCalledWith(7, 99);
    expect(db.updateJarvisTask).toHaveBeenCalledWith(expect.objectContaining({ userId: 7, id: 99 }));
    expect(db.resolveJarvisConfirmation).toHaveBeenCalledWith(7, 99, "approved");
  });
});
