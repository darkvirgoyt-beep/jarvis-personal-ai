import { and, desc, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import {
  virgoytAgentAuditEvents,
  virgoytAgentPlanSteps,
  virgoytAgentProjects,
  virgoytAgentRuns,
  virgoytProviderProfiles,
  virgoytRunnerConnections,
  virgoytToolApprovals,
  virgoytToolProposals,
} from "../drizzle/schema";
import { getDb } from "./db";

export const VIRGOYT_AGENT_VALUES = ["coding", "research", "ui", "security", "devops"] as const;
export const VIRGOYT_PROVIDER_VALUES = ["openrouter", "compatible", "nvidia_nim", "local_bridge"] as const;
export const VIRGOYT_TOOL_KIND_VALUES = ["file_write", "file_delete", "terminal_command", "browser_navigate", "git_operation", "deployment", "runner_connect"] as const;

export type VirgoYTAgent = (typeof VIRGOYT_AGENT_VALUES)[number];
export type VirgoYTProvider = (typeof VIRGOYT_PROVIDER_VALUES)[number];
export type VirgoYTToolKind = (typeof VIRGOYT_TOOL_KIND_VALUES)[number];
export type VirgoYTRiskLevel = "low" | "medium" | "high";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("VirgoYT control-plane storage is unavailable");
  return db;
}

/** Redacts common credential forms before any proposal or audit record is persisted. */
export function redactVirgoYTSensitiveText(value: string) {
  return value
    .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED_API_KEY]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+\-/=]{12,}\b/gi, "Bearer [REDACTED]")
    .replace(/\b(api[_ -]?key|password|secret|token)\s*[:=]\s*\S+/gi, "$1=[REDACTED]");
}

export function virgoytPayloadDigest(payload: unknown) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function normalizeVirgoYTRiskLevel(toolKind: VirgoYTToolKind, requested: VirgoYTRiskLevel): VirgoYTRiskLevel {
  const confirmationRequired = new Set<VirgoYTToolKind>(["file_delete", "terminal_command", "git_operation", "deployment", "runner_connect"]);
  return confirmationRequired.has(toolKind) ? "high" : requested;
}

export async function listVirgoYTProjects(userId: number) {
  const db = await requireDb();
  return db.select().from(virgoytAgentProjects)
    .where(eq(virgoytAgentProjects.userId, userId))
    .orderBy(desc(virgoytAgentProjects.updatedAt));
}

export async function createVirgoYTProject(input: {
  userId: number;
  name: string;
  slug: string;
  description?: string | null;
  defaultAgent: VirgoYTAgent;
}) {
  const db = await requireDb();
  const result = await db.insert(virgoytAgentProjects).values({
    ...input,
    description: input.description ?? null,
  });
  const id = Number(result[0].insertId);
  return getVirgoYTProject(input.userId, id);
}

export async function getVirgoYTProject(userId: number, projectId: number) {
  const db = await requireDb();
  const rows = await db.select().from(virgoytAgentProjects)
    .where(and(eq(virgoytAgentProjects.id, projectId), eq(virgoytAgentProjects.userId, userId))).limit(1);
  return rows[0];
}

export async function archiveVirgoYTProject(userId: number, projectId: number) {
  const db = await requireDb();
  const result = await db.update(virgoytAgentProjects).set({ status: "archived", updatedAt: new Date() })
    .where(and(eq(virgoytAgentProjects.id, projectId), eq(virgoytAgentProjects.userId, userId)));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function listVirgoYTRuns(userId: number, projectId: number) {
  const db = await requireDb();
  return db.select().from(virgoytAgentRuns)
    .where(and(eq(virgoytAgentRuns.userId, userId), eq(virgoytAgentRuns.projectId, projectId)))
    .orderBy(desc(virgoytAgentRuns.createdAt));
}

export async function getVirgoYTRun(userId: number, projectId: number, runId: number) {
  const db = await requireDb();
  const rows = await db.select().from(virgoytAgentRuns)
    .where(and(
      eq(virgoytAgentRuns.id, runId),
      eq(virgoytAgentRuns.userId, userId),
      eq(virgoytAgentRuns.projectId, projectId),
    )).limit(1);
  return rows[0];
}

export async function createVirgoYTRun(input: {
  userId: number;
  projectId: number;
  conversationId?: number | null;
  agent: VirgoYTAgent;
  provider: VirgoYTProvider;
  modelId: string;
  requestSummary: string;
}) {
  const db = await requireDb();
  const result = await db.insert(virgoytAgentRuns).values({
    ...input,
    conversationId: input.conversationId ?? null,
    requestSummary: redactVirgoYTSensitiveText(input.requestSummary),
    status: "planning",
    startedAt: new Date(),
  });
  const id = Number(result[0].insertId);
  return getVirgoYTRun(input.userId, input.projectId, id);
}

export async function listVirgoYTPlanSteps(userId: number, projectId: number, runId: number) {
  const db = await requireDb();
  return db.select().from(virgoytAgentPlanSteps)
    .where(and(
      eq(virgoytAgentPlanSteps.userId, userId),
      eq(virgoytAgentPlanSteps.projectId, projectId),
      eq(virgoytAgentPlanSteps.runId, runId),
    )).orderBy(virgoytAgentPlanSteps.stepOrder);
}

export async function createVirgoYTPlanStep(input: {
  userId: number;
  projectId: number;
  runId: number;
  stepOrder: number;
  title: string;
  description?: string | null;
  assignedAgent: VirgoYTAgent;
  requiresApproval: number;
}) {
  const db = await requireDb();
  const result = await db.insert(virgoytAgentPlanSteps).values({
    ...input,
    description: input.description ? redactVirgoYTSensitiveText(input.description) : null,
  });
  const id = Number(result[0].insertId);
  const rows = await db.select().from(virgoytAgentPlanSteps)
    .where(and(eq(virgoytAgentPlanSteps.id, id), eq(virgoytAgentPlanSteps.userId, input.userId))).limit(1);
  return rows[0];
}

export async function listVirgoYTToolProposals(userId: number, projectId: number) {
  const db = await requireDb();
  return db.select().from(virgoytToolProposals)
    .where(and(eq(virgoytToolProposals.userId, userId), eq(virgoytToolProposals.projectId, projectId)))
    .orderBy(desc(virgoytToolProposals.createdAt));
}

export async function getVirgoYTToolProposal(userId: number, projectId: number, proposalId: number) {
  const db = await requireDb();
  const rows = await db.select().from(virgoytToolProposals)
    .where(and(
      eq(virgoytToolProposals.id, proposalId),
      eq(virgoytToolProposals.userId, userId),
      eq(virgoytToolProposals.projectId, projectId),
    )).limit(1);
  return rows[0];
}

export async function createVirgoYTToolProposal(input: {
  userId: number;
  projectId: number;
  runId?: number | null;
  toolKind: VirgoYTToolKind;
  riskLevel: VirgoYTRiskLevel;
  title: string;
  details: string;
  expiresAt: Date;
}) {
  const db = await requireDb();
  const payload = { details: redactVirgoYTSensitiveText(input.details) };
  const result = await db.insert(virgoytToolProposals).values({
    ...input,
    runId: input.runId ?? null,
    title: redactVirgoYTSensitiveText(input.title),
    riskLevel: normalizeVirgoYTRiskLevel(input.toolKind, input.riskLevel),
    payloadDigest: virgoytPayloadDigest(payload),
    payloadJson: JSON.stringify(payload),
  });
  const id = Number(result[0].insertId);
  return getVirgoYTToolProposal(input.userId, input.projectId, id);
}

export async function resolveVirgoYTToolProposal(input: {
  userId: number;
  projectId: number;
  proposalId: number;
  decision: "approved" | "rejected";
  approvalNonce: string;
  expiresAt: Date;
}) {
  const db = await requireDb();
  const nextStatus = input.decision === "approved" ? "approved" : "rejected";
  const result = await db.update(virgoytToolProposals).set({ status: nextStatus, resolvedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(virgoytToolProposals.id, input.proposalId),
      eq(virgoytToolProposals.userId, input.userId),
      eq(virgoytToolProposals.projectId, input.projectId),
      eq(virgoytToolProposals.status, "pending"),
    ));
  if (Number(result[0]?.affectedRows ?? 0) !== 1) return undefined;

  await db.insert(virgoytToolApprovals).values({
    userId: input.userId,
    proposalId: input.proposalId,
    decision: input.decision,
    approvalNonce: input.approvalNonce,
    expiresAt: input.expiresAt,
  });
  return getVirgoYTToolProposal(input.userId, input.projectId, input.proposalId);
}

export async function listVirgoYTAuditEvents(userId: number, projectId: number) {
  const db = await requireDb();
  return db.select().from(virgoytAgentAuditEvents)
    .where(and(eq(virgoytAgentAuditEvents.userId, userId), eq(virgoytAgentAuditEvents.projectId, projectId)))
    .orderBy(desc(virgoytAgentAuditEvents.createdAt));
}

export async function createVirgoYTAuditEvent(input: {
  userId: number;
  projectId?: number | null;
  runId?: number | null;
  proposalId?: number | null;
  eventKind: string;
  details: string;
}) {
  const db = await requireDb();
  await db.insert(virgoytAgentAuditEvents).values({
    userId: input.userId,
    projectId: input.projectId ?? null,
    runId: input.runId ?? null,
    proposalId: input.proposalId ?? null,
    eventKind: input.eventKind,
    detailsJson: JSON.stringify({ details: redactVirgoYTSensitiveText(input.details) }),
  });
}

export async function listVirgoYTProviderProfiles(userId: number) {
  const db = await requireDb();
  const rows = await db.select().from(virgoytProviderProfiles)
    .where(eq(virgoytProviderProfiles.userId, userId))
    .orderBy(desc(virgoytProviderProfiles.updatedAt));
  return rows.map(toVirgoYTProviderProfileSummary);
}

function toVirgoYTProviderProfileSummary(profile: typeof virgoytProviderProfiles.$inferSelect) {
  const { credentialCiphertext: _credentialCiphertext, ...summary } = profile;
  return summary;
}

export async function createVirgoYTProviderProfile(input: {
  userId: number;
  label: string;
  provider: VirgoYTProvider;
  endpoint?: string | null;
  defaultModel?: string | null;
  credentialCiphertext?: string | null;
  credentialRef?: string | null;
  status?: "unconfigured" | "ready" | "disabled" | "error";
}) {
  const db = await requireDb();
  const result = await db.insert(virgoytProviderProfiles).values({
    ...input,
    endpoint: input.endpoint ?? null,
    defaultModel: input.defaultModel ?? null,
    credentialCiphertext: input.credentialCiphertext ?? null,
    credentialRef: input.credentialRef ?? null,
    status: input.status ?? "unconfigured",
  });
  const id = Number(result[0].insertId);
  const rows = await db.select().from(virgoytProviderProfiles)
    .where(and(eq(virgoytProviderProfiles.id, id), eq(virgoytProviderProfiles.userId, input.userId))).limit(1);
  return rows[0] ? toVirgoYTProviderProfileSummary(rows[0]) : undefined;
}

export async function updateVirgoYTProviderProfileCredential(input: {
  userId: number;
  profileId: number;
  credentialCiphertext: string | null;
  credentialRef: string | null;
  status: "unconfigured" | "ready" | "disabled" | "error";
}) {
  const db = await requireDb();
  const result = await db.update(virgoytProviderProfiles).set({
    credentialCiphertext: input.credentialCiphertext,
    credentialRef: input.credentialRef,
    status: input.status,
    updatedAt: new Date(),
  }).where(and(eq(virgoytProviderProfiles.id, input.profileId), eq(virgoytProviderProfiles.userId, input.userId)));
  return Number(result[0]?.affectedRows ?? 0);
}

export async function listVirgoYTRunnerConnections(userId: number, projectId: number) {
  const db = await requireDb();
  return db.select().from(virgoytRunnerConnections)
    .where(and(eq(virgoytRunnerConnections.userId, userId), eq(virgoytRunnerConnections.projectId, projectId)))
    .orderBy(desc(virgoytRunnerConnections.updatedAt));
}

export async function createVirgoYTRunnerConnection(input: {
  userId: number;
  projectId: number;
  displayName: string;
  runnerType: "local_cli" | "remote_isolated";
}) {
  const db = await requireDb();
  const result = await db.insert(virgoytRunnerConnections).values({ ...input, status: "pending" });
  const id = Number(result[0].insertId);
  const rows = await db.select().from(virgoytRunnerConnections)
    .where(and(eq(virgoytRunnerConnections.id, id), eq(virgoytRunnerConnections.userId, input.userId))).limit(1);
  return rows[0];
}
