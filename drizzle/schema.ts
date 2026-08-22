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
  durableMemoryEnabled: int("durableMemoryEnabled").notNull().default(0),
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

/**
 * VirgoYT control-plane tables intentionally contain plans, approvals, metadata,
 * and audit records—not arbitrary runner secrets or unbounded command output.
 * A future execution adapter must remain a separately isolated component.
 */
export const virgoytAgentProjects = mysqlTable("virgoytAgentProjects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "archived"]).notNull().default("active"),
  defaultAgent: mysqlEnum("defaultAgent", ["coding", "research", "ui", "security", "devops"]).notNull().default("coding"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("virgoytProjectUserSlugUnique").on(table.userId, table.slug),
  index("virgoytProjectUserUpdatedIdx").on(table.userId, table.updatedAt),
]);

export const virgoytAgentRuns = mysqlTable("virgoytAgentRuns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  conversationId: int("conversationId"),
  agent: mysqlEnum("agent", ["coding", "research", "ui", "security", "devops"]).notNull(),
  provider: mysqlEnum("provider", ["openrouter", "compatible", "nvidia_nim", "local_bridge"]).notNull().default("openrouter"),
  modelId: varchar("modelId", { length: 160 }).notNull().default("nvidia/nemotron-3-ultra-550b-a55b"),
  status: mysqlEnum("status", ["queued", "planning", "waiting_approval", "running", "succeeded", "failed", "cancelled", "blocked"]).notNull().default("queued"),
  requestSummary: text("requestSummary").notNull(),
  outputSummary: text("outputSummary"),
  failureReason: varchar("failureReason", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("virgoytRunUserCreatedIdx").on(table.userId, table.createdAt),
  index("virgoytRunProjectStatusIdx").on(table.projectId, table.status, table.updatedAt),
]);

export const virgoytAgentPlanSteps = mysqlTable("virgoytAgentPlanSteps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  runId: int("runId").notNull(),
  stepOrder: int("stepOrder").notNull(),
  title: varchar("title", { length: 240 }).notNull(),
  description: text("description"),
  assignedAgent: mysqlEnum("assignedAgent", ["coding", "research", "ui", "security", "devops"]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "blocked", "complete", "skipped"]).notNull().default("pending"),
  requiresApproval: int("requiresApproval").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("virgoytPlanStepOrderUnique").on(table.runId, table.stepOrder),
  index("virgoytPlanStepProjectStatusIdx").on(table.projectId, table.status, table.stepOrder),
]);

export const virgoytToolProposals = mysqlTable("virgoytToolProposals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId").notNull(),
  runId: int("runId"),
  toolKind: mysqlEnum("toolKind", ["file_write", "file_delete", "terminal_command", "browser_navigate", "git_operation", "deployment", "runner_connect"]).notNull(),
  riskLevel: mysqlEnum("riskLevel", ["low", "medium", "high"]).notNull().default("medium"),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "claimed", "executed", "failed", "expired", "blocked"]).notNull().default("pending"),
  title: varchar("title", { length: 240 }).notNull(),
  payloadDigest: varchar("payloadDigest", { length: 128 }).notNull(),
  payloadJson: text("payloadJson").notNull(),
  expiresAt: timestamp("expiresAt"),
  resolvedAt: timestamp("resolvedAt"),
  executedAt: timestamp("executedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("virgoytProposalUserStatusIdx").on(table.userId, table.status, table.createdAt),
  index("virgoytProposalProjectStatusIdx").on(table.projectId, table.status, table.updatedAt),
]);

export const virgoytToolApprovals = mysqlTable("virgoytToolApprovals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  proposalId: int("proposalId").notNull(),
  decision: mysqlEnum("decision", ["approved", "rejected"]).notNull(),
  approvalNonce: varchar("approvalNonce", { length: 96 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  consumedAt: timestamp("consumedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("virgoytApprovalProposalUnique").on(table.proposalId),
  index("virgoytApprovalUserExpiryIdx").on(table.userId, table.expiresAt),
]);

export const virgoytAgentAuditEvents = mysqlTable("virgoytAgentAuditEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  runId: int("runId"),
  proposalId: int("proposalId"),
  eventKind: varchar("eventKind", { length: 96 }).notNull(),
  detailsJson: text("detailsJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  index("virgoytAuditUserCreatedIdx").on(table.userId, table.createdAt),
  index("virgoytAuditProjectCreatedIdx").on(table.projectId, table.createdAt),
]);

export const virgoytProviderProfiles = mysqlTable("virgoytProviderProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  provider: mysqlEnum("provider", ["openrouter", "compatible", "nvidia_nim", "local_bridge"]).notNull(),
  endpoint: varchar("endpoint", { length: 500 }),
  defaultModel: varchar("defaultModel", { length: 160 }),
  credentialRef: varchar("credentialRef", { length: 160 }),
  credentialCiphertext: text("credentialCiphertext"),
  status: mysqlEnum("status", ["unconfigured", "ready", "disabled", "error"]).notNull().default("unconfigured"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("virgoytProviderUserLabelUnique").on(table.userId, table.label),
  index("virgoytProviderUserStatusIdx").on(table.userId, table.status),
]);

export const virgoytRunnerConnections = mysqlTable("virgoytRunnerConnections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  displayName: varchar("displayName", { length: 160 }).notNull(),
  runnerType: mysqlEnum("runnerType", ["local_cli", "remote_isolated"]).notNull(),
  status: mysqlEnum("status", ["pending", "paired", "active", "revoked"]).notNull().default("pending"),
  publicKeyFingerprint: varchar("publicKeyFingerprint", { length: 128 }),
  lastSeenAt: timestamp("lastSeenAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("virgoytRunnerUserStatusIdx").on(table.userId, table.status, table.updatedAt),
  index("virgoytRunnerProjectIdx").on(table.projectId),
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
export type VirgoYTAgentProject = typeof virgoytAgentProjects.$inferSelect;
export type VirgoYTAgentRun = typeof virgoytAgentRuns.$inferSelect;
export type VirgoYTAgentPlanStep = typeof virgoytAgentPlanSteps.$inferSelect;
export type VirgoYTToolProposal = typeof virgoytToolProposals.$inferSelect;
export type VirgoYTToolApproval = typeof virgoytToolApprovals.$inferSelect;
export type VirgoYTAgentAuditEvent = typeof virgoytAgentAuditEvents.$inferSelect;
export type VirgoYTProviderProfile = typeof virgoytProviderProfiles.$inferSelect;
export type VirgoYTRunnerConnection = typeof virgoytRunnerConnections.$inferSelect;
