import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  jarvisConfirmations,
  jarvisConversations,
  jarvisMemories,
  jarvisMessages,
  jarvisMobilePairings,
  jarvisPreferences,
  jarvisResearchRecords,
  jarvisTasks,
  jarvisWorkspaceItems,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import * as supabaseJarvisDb from "./supabaseJarvisDb";
import { usesSupabasePrivateRuntime } from "./supabaseRuntime";

let _db: ReturnType<typeof drizzle> | null = null;

/** Test-only injection point for verifying user-scoped query contracts without a live database. */
export function setJarvisDbForTests(db: ReturnType<typeof drizzle> | null) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Jarvis database test injection is unavailable outside tests");
  }
  _db = db;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (usesSupabasePrivateRuntime()) return null;
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.upsertUser(user);
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.getUserByOpenId(openId);
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createJarvisMobilePairing(input: {
  codeHash: string;
  verifierHash: string;
  userOpenId: string;
  expiresAt: Date;
}) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.createJarvisMobilePairing(input);
  const db = await requireDb();
  await db.insert(jarvisMobilePairings).values(input);
}

/** Returns the linked user only when a pairing can be consumed exactly once. */
export async function consumeJarvisMobilePairing(input: {
  codeHash: string;
  verifierHash: string;
}) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.consumeJarvisMobilePairing(input);
  const db = await requireDb();
  const now = new Date();
  const rows = await db.select().from(jarvisMobilePairings)
    .where(and(
      eq(jarvisMobilePairings.codeHash, input.codeHash),
      eq(jarvisMobilePairings.verifierHash, input.verifierHash),
      isNull(jarvisMobilePairings.exchangedAt),
      gt(jarvisMobilePairings.expiresAt, now),
    )).limit(1);
  const pairing = rows[0];
  if (!pairing) return undefined;

  const result = await db.update(jarvisMobilePairings).set({ exchangedAt: now })
    .where(and(eq(jarvisMobilePairings.id, pairing.id), isNull(jarvisMobilePairings.exchangedAt)));
  if (Number(result[0].affectedRows ?? 0) !== 1) return undefined;
  return pairing.userOpenId;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Jarvis data storage is unavailable");
  return db;
}

export async function listJarvisConversations(userId: number) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.listJarvisConversations(userId);
  const db = await requireDb();
  return db.select().from(jarvisConversations)
    .where(eq(jarvisConversations.userId, userId))
    .orderBy(desc(jarvisConversations.updatedAt));
}

export async function createJarvisConversation(userId: number, title: string, activeAgent: "general" | "coding" | "research" | "files" | "system" | "creative") {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.createJarvisConversation(userId, title, activeAgent);
  const db = await requireDb();
  const result = await db.insert(jarvisConversations).values({ userId, title, activeAgent });
  const conversationId = Number(result[0].insertId);
  const records = await db.select().from(jarvisConversations)
    .where(and(eq(jarvisConversations.id, conversationId), eq(jarvisConversations.userId, userId))).limit(1);
  return records[0];
}

export async function getJarvisConversation(userId: number, conversationId: number) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.getJarvisConversation(userId, conversationId);
  const db = await requireDb();
  const records = await db.select().from(jarvisConversations)
    .where(and(eq(jarvisConversations.id, conversationId), eq(jarvisConversations.userId, userId))).limit(1);
  return records[0];
}

/** Persist a conversation star only after checking the conversation belongs to the signed-in user. */
export async function setJarvisConversationStar(userId: number, conversationId: number, starred: boolean) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.setJarvisConversationStar(userId, conversationId, starred);
  const db = await requireDb();
  const result = await db.update(jarvisConversations)
    .set({ starredAt: starred ? new Date() : null })
    .where(and(eq(jarvisConversations.id, conversationId), eq(jarvisConversations.userId, userId)));
  return Number(result[0].affectedRows ?? 0) > 0;
}

export async function listJarvisMessages(userId: number, conversationId: number) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.listJarvisMessages(userId, conversationId);
  const db = await requireDb();
  return db.select().from(jarvisMessages)
    .where(and(eq(jarvisMessages.userId, userId), eq(jarvisMessages.conversationId, conversationId)))
    .orderBy(jarvisMessages.createdAt);
}

export async function createJarvisMessage(input: {
  userId: number;
  conversationId: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent: string;
}) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.createJarvisMessage(input);
  const db = await requireDb();
  await db.insert(jarvisMessages).values(input);
  await db.update(jarvisConversations).set({ updatedAt: new Date() })
    .where(and(eq(jarvisConversations.id, input.conversationId), eq(jarvisConversations.userId, input.userId)));
}

export async function listJarvisMemories(userId: number) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.listJarvisMemories(userId);
  const db = await requireDb();
  return db.select().from(jarvisMemories)
    .where(eq(jarvisMemories.userId, userId))
    .orderBy(desc(jarvisMemories.updatedAt));
}

export async function createJarvisMemory(input: {
  userId: number;
  content: string;
  category: "preference" | "project" | "personal" | "fact" | "note";
  source?: "manual" | "conversation";
}) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.createJarvisMemory(input);
  const db = await requireDb();
  await db.insert(jarvisMemories).values({ ...input, source: input.source ?? "manual" });
}

export async function updateJarvisMemory(userId: number, id: number, content: string, category: "preference" | "project" | "personal" | "fact" | "note") {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.updateJarvisMemory(userId, id, content, category);
  const db = await requireDb();
  const result = await db.update(jarvisMemories).set({ content, category, updatedAt: new Date() })
    .where(and(eq(jarvisMemories.id, id), eq(jarvisMemories.userId, userId)));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function deleteJarvisMemory(userId: number, id: number) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.deleteJarvisMemory(userId, id);
  const db = await requireDb();
  const result = await db.delete(jarvisMemories).where(and(eq(jarvisMemories.id, id), eq(jarvisMemories.userId, userId)));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function listJarvisTasks(userId: number) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.listJarvisTasks(userId);
  const db = await requireDb();
  return db.select().from(jarvisTasks)
    .where(eq(jarvisTasks.userId, userId))
    .orderBy(desc(jarvisTasks.updatedAt));
}

export async function createJarvisTask(input: {
  userId: number;
  title: string;
  notes?: string | null;
  priority: "low" | "medium" | "high";
  dueAt?: Date | null;
}) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.createJarvisTask(input);
  const db = await requireDb();
  await db.insert(jarvisTasks).values({ ...input, notes: input.notes ?? null, dueAt: input.dueAt ?? null });
}

export async function updateJarvisTask(input: {
  userId: number;
  id: number;
  title?: string;
  notes?: string | null;
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  dueAt?: Date | null;
}) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.updateJarvisTask(input);
  const db = await requireDb();
  const { userId, id, ...values } = input;
  const result = await db.update(jarvisTasks).set({ ...values, updatedAt: new Date() })
    .where(and(eq(jarvisTasks.id, id), eq(jarvisTasks.userId, userId)));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function listJarvisResearchRecords(userId: number) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.listJarvisResearchRecords(userId);
  const db = await requireDb();
  return db.select().from(jarvisResearchRecords)
    .where(eq(jarvisResearchRecords.userId, userId))
    .orderBy(desc(jarvisResearchRecords.createdAt));
}

export async function createJarvisResearchRecord(input: {
  userId: number;
  conversationId: number;
  topic: string;
  sourceLedger: string;
  summary: string;
}) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.createJarvisResearchRecord(input);
  const db = await requireDb();
  await db.insert(jarvisResearchRecords).values(input);
}

export async function getJarvisPreferences(userId: number) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.getJarvisPreferences(userId);
  const db = await requireDb();
  const existing = await db.select().from(jarvisPreferences).where(eq(jarvisPreferences.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(jarvisPreferences).values({ userId });
  const created = await db.select().from(jarvisPreferences).where(eq(jarvisPreferences.userId, userId)).limit(1);
  return created[0];
}

export async function updateJarvisPreferences(input: {
  userId: number;
  model?: string;
  personality?: "balanced" | "concise" | "strategic" | "creative";
  voiceEnabled?: number;
  voiceName?: string | null;
  continuousMode?: number;
  contextualSuggestions?: number;
  speechRate?: number;
  privacyMode?: "standard" | "minimal";
  visualMode?: "hud" | "reduced_motion";
  pluginSettings?: string | null;
}) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.updateJarvisPreferences(input);
  const db = await requireDb();
  const { userId, ...values } = input;
  await db.insert(jarvisPreferences).values({ userId, ...values }).onDuplicateKeyUpdate({
    set: { ...values, updatedAt: new Date() },
  });
  return getJarvisPreferences(userId);
}

export async function listJarvisConfirmations(userId: number) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.listJarvisConfirmations(userId);
  const db = await requireDb();
  return db.select().from(jarvisConfirmations)
    .where(eq(jarvisConfirmations.userId, userId))
    .orderBy(desc(jarvisConfirmations.createdAt));
}

export async function createJarvisConfirmation(input: {
  userId: number;
  action: string;
  riskLevel: "low" | "medium" | "high";
  payload: string;
}) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.createJarvisConfirmation(input);
  const db = await requireDb();
  const result = await db.insert(jarvisConfirmations).values(input);
  const id = Number(result[0].insertId);
  const records = await db.select().from(jarvisConfirmations)
    .where(and(eq(jarvisConfirmations.id, id), eq(jarvisConfirmations.userId, input.userId))).limit(1);
  return records[0];
}

export async function resolveJarvisConfirmation(userId: number, id: number, status: "approved" | "rejected") {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.resolveJarvisConfirmation(userId, id, status);
  const db = await requireDb();
  const result = await db.update(jarvisConfirmations).set({ status, resolvedAt: new Date() })
    .where(and(eq(jarvisConfirmations.id, id), eq(jarvisConfirmations.userId, userId), eq(jarvisConfirmations.status, "pending")));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function getJarvisConfirmation(userId: number, id: number) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.getJarvisConfirmation(userId, id);
  const db = await requireDb();
  const records = await db.select().from(jarvisConfirmations)
    .where(and(eq(jarvisConfirmations.id, id), eq(jarvisConfirmations.userId, userId))).limit(1);
  return records[0];
}

export async function markJarvisConfirmationExecuted(userId: number, id: number) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.markJarvisConfirmationExecuted(userId, id);
  const db = await requireDb();
  const result = await db.update(jarvisConfirmations).set({ status: "executed", resolvedAt: new Date() })
    .where(and(eq(jarvisConfirmations.id, id), eq(jarvisConfirmations.userId, userId), eq(jarvisConfirmations.status, "approved")));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function listJarvisWorkspaceItems(userId: number) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.listJarvisWorkspaceItems(userId);
  const db = await requireDb();
  return db.select().from(jarvisWorkspaceItems)
    .where(eq(jarvisWorkspaceItems.userId, userId))
    .orderBy(desc(jarvisWorkspaceItems.updatedAt));
}

export async function createJarvisWorkspaceItem(input: {
  userId: number;
  path: string;
  name: string;
  itemType: "file" | "folder";
  storageKey?: string | null;
  contentType?: string | null;
  sizeBytes?: number;
}) {
  if (usesSupabasePrivateRuntime()) return supabaseJarvisDb.createJarvisWorkspaceItem(input);
  const db = await requireDb();
  const result = await db.insert(jarvisWorkspaceItems).values({
    ...input,
    storageKey: input.storageKey ?? null,
    contentType: input.contentType ?? null,
    sizeBytes: input.sizeBytes ?? 0,
  });
  const id = Number(result[0].insertId);
  const records = await db.select().from(jarvisWorkspaceItems)
    .where(and(eq(jarvisWorkspaceItems.id, id), eq(jarvisWorkspaceItems.userId, input.userId))).limit(1);
  return records[0];
}
