import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const jarvisConversations = mysqlTable("jarvisConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 180 }).notNull().default("New Jarvis conversation"),
  activeAgent: mysqlEnum("activeAgent", ["general", "coding", "research", "files", "system", "creative"]).notNull().default("general"),
  starredAt: timestamp("starredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("jarvisConversationUserUpdatedIdx").on(table.userId, table.updatedAt)]);

export const jarvisMessages = mysqlTable("jarvisMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  agent: varchar("agent", { length: 32 }).notNull().default("general"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("jarvisMessageConversationIdx").on(table.conversationId, table.createdAt), index("jarvisMessageUserIdx").on(table.userId)]);

export const jarvisMemories = mysqlTable("jarvisMemories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", ["preference", "project", "personal", "fact", "note"]).notNull().default("note"),
  source: mysqlEnum("source", ["manual", "conversation"]).notNull().default("manual"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("jarvisMemoryUserUpdatedIdx").on(table.userId, table.updatedAt)]);

export const jarvisTasks = mysqlTable("jarvisTasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  notes: text("notes"),
  status: mysqlEnum("status", ["todo", "in_progress", "done"]).notNull().default("todo"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).notNull().default("medium"),
  dueAt: timestamp("dueAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [index("jarvisTaskUserStatusIdx").on(table.userId, table.status, table.updatedAt)]);

export const jarvisResearchRecords = mysqlTable("jarvisResearchRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: int("conversationId").notNull(),
  topic: varchar("topic", { length: 500 }).notNull(),
  sourceLedger: text("sourceLedger").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("jarvisResearchUserCreatedIdx").on(table.userId, table.createdAt)]);

export const jarvisPreferences = mysqlTable("jarvisPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  model: varchar("model", { length: 80 }).notNull().default("nemotron-3-ultra"),
  personality: mysqlEnum("personality", ["balanced", "concise", "strategic", "creative"]).notNull().default("balanced"),
  voiceEnabled: int("voiceEnabled").notNull().default(1),
  voiceName: varchar("voiceName", { length: 240 }),
  continuousMode: int("continuousMode").notNull().default(0),
  contextualSuggestions: int("contextualSuggestions").notNull().default(0),
  speechRate: int("speechRate").notNull().default(100),
  privacyMode: mysqlEnum("privacyMode", ["standard", "minimal"]).notNull().default("standard"),
  visualMode: mysqlEnum("visualMode", ["hud", "reduced_motion"]).notNull().default("hud"),
  pluginSettings: text("pluginSettings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const jarvisConfirmations = mysqlTable("jarvisConfirmations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 180 }).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).notNull().default("high"),
  payload: text("payload").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "executed"]).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, (table) => [index("jarvisConfirmationUserStatusIdx").on(table.userId, table.status, table.createdAt)]);

export const jarvisWorkspaceItems = mysqlTable("jarvisWorkspaceItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  path: varchar("path", { length: 700 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  itemType: mysqlEnum("itemType", ["file", "folder"]).notNull(),
  storageKey: varchar("storageKey", { length: 1024 }),
  contentType: varchar("contentType", { length: 160 }),
  sizeBytes: int("sizeBytes").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("jarvisWorkspaceUserPathUnique").on(table.userId, table.path),
  index("jarvisWorkspaceUserUpdatedIdx").on(table.userId, table.updatedAt),
]);

export const jarvisMobilePairings = mysqlTable("jarvisMobilePairings", {
  id: int("id").autoincrement().primaryKey(),
  codeHash: varchar("codeHash", { length: 128 }).notNull().unique(),
  verifierHash: varchar("verifierHash", { length: 128 }).notNull(),
  userOpenId: varchar("userOpenId", { length: 64 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  exchangedAt: timestamp("exchangedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("jarvisMobilePairingExpiryIdx").on(table.expiresAt),
]);

export type JarvisConversation = typeof jarvisConversations.$inferSelect;
export type JarvisMessage = typeof jarvisMessages.$inferSelect;
export type JarvisMemory = typeof jarvisMemories.$inferSelect;
export type JarvisTask = typeof jarvisTasks.$inferSelect;
export type JarvisResearchRecord = typeof jarvisResearchRecords.$inferSelect;
export type JarvisPreference = typeof jarvisPreferences.$inferSelect;
export type JarvisConfirmation = typeof jarvisConfirmations.$inferSelect;
export type JarvisWorkspaceItem = typeof jarvisWorkspaceItems.$inferSelect;
export type JarvisMobilePairing = typeof jarvisMobilePairings.$inferSelect;
