import { TRPCError } from "@trpc/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../virgoytDb";
import { getVirgoYTProviderRoutingSummary, isCredentialFreeProviderEndpoint } from "../virgoytProviderRouting";

const agentSchema = z.enum(db.VIRGOYT_AGENT_VALUES);
const providerSchema = z.enum(db.VIRGOYT_PROVIDER_VALUES);
const toolKindSchema = z.enum(db.VIRGOYT_TOOL_KIND_VALUES);
const projectIdSchema = z.number().int().positive();
const providerEndpointSchema = z.string().url().max(500).refine((value) => {
  return isCredentialFreeProviderEndpoint(value);
}, "Provider endpoints cannot contain credentials. Configure credentials separately.");

function slugify(value: string) {
  const slug = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug.slice(0, 104) || "project";
}

async function requireProject(userId: number, projectId: number) {
  const project = await db.getVirgoYTProject(userId, projectId);
  if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "VirgoYT project not found" });
  return project;
}

async function requireRun(userId: number, projectId: number, runId: number) {
  const run = await db.getVirgoYTRun(userId, projectId, runId);
  if (!run) throw new TRPCError({ code: "NOT_FOUND", message: "VirgoYT agent run not found" });
  return run;
}

export const virgoytRouter = router({
  catalog: protectedProcedure.query(() => ({
    agents: [
      { id: "coding", name: "Coding", description: "Plans and reviews implementation work." },
      { id: "research", name: "Research", description: "Builds source-aware research briefs." },
      { id: "ui", name: "UI", description: "Designs readable, responsive interfaces." },
      { id: "security", name: "Security", description: "Flags trust and approval boundaries." },
      { id: "devops", name: "DevOps", description: "Prepares safe build and deployment proposals." },
    ],
    toolPolicy: "All write, terminal, browser, Git, deployment, and runner actions are proposals until explicitly approved.",
  })),

  projects: router({
    list: protectedProcedure.query(({ ctx }) => db.listVirgoYTProjects(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string().trim().min(2).max(160),
      description: z.string().trim().max(6000).nullable().optional(),
      defaultAgent: agentSchema.default("coding"),
    })).mutation(async ({ ctx, input }) => {
      const project = await db.createVirgoYTProject({
        userId: ctx.user.id,
        name: input.name,
        slug: `${slugify(input.name)}-${randomUUID().slice(0, 8)}`,
        description: input.description,
        defaultAgent: input.defaultAgent,
      });
      if (!project) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "VirgoYT project could not be created" });
      await db.createVirgoYTAuditEvent({ userId: ctx.user.id, projectId: project.id, eventKind: "project.created", details: project.name });
      return project;
    }),
    archive: protectedProcedure.input(z.object({ projectId: projectIdSchema })).mutation(async ({ ctx, input }) => {
      const updated = await db.archiveVirgoYTProject(ctx.user.id, input.projectId);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "VirgoYT project not found" });
      await db.createVirgoYTAuditEvent({ userId: ctx.user.id, projectId: input.projectId, eventKind: "project.archived", details: "Project archived by owner" });
      return { success: true } as const;
    }),
  }),

  runs: router({
    list: protectedProcedure.input(z.object({ projectId: projectIdSchema })).query(async ({ ctx, input }) => {
      await requireProject(ctx.user.id, input.projectId);
      return db.listVirgoYTRuns(ctx.user.id, input.projectId);
    }),
    create: protectedProcedure.input(z.object({
      projectId: projectIdSchema,
      conversationId: z.number().int().positive().nullable().optional(),
      agent: agentSchema.default("coding"),
      provider: providerSchema.default("openrouter"),
      modelId: z.string().trim().min(1).max(160).default("nvidia/nemotron-3-ultra-550b-a55b"),
      request: z.string().trim().min(4).max(12_000),
    })).mutation(async ({ ctx, input }) => {
      await requireProject(ctx.user.id, input.projectId);
      const run = await db.createVirgoYTRun({
        userId: ctx.user.id,
        projectId: input.projectId,
        conversationId: input.conversationId,
        agent: input.agent,
        provider: input.provider,
        modelId: input.modelId,
        requestSummary: input.request,
      });
      if (!run) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "VirgoYT agent run could not be created" });
      await db.createVirgoYTAuditEvent({ userId: ctx.user.id, projectId: input.projectId, runId: run.id, eventKind: "run.planning", details: `Planning with ${input.agent}` });
      return run;
    }),
  }),

  plans: router({
    list: protectedProcedure.input(z.object({ projectId: projectIdSchema, runId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      await requireRun(ctx.user.id, input.projectId, input.runId);
      return db.listVirgoYTPlanSteps(ctx.user.id, input.projectId, input.runId);
    }),
    create: protectedProcedure.input(z.object({
      projectId: projectIdSchema,
      runId: z.number().int().positive(),
      stepOrder: z.number().int().min(1).max(100),
      title: z.string().trim().min(3).max(240),
      description: z.string().trim().max(6000).nullable().optional(),
      assignedAgent: agentSchema,
      requiresApproval: z.boolean().default(false),
    })).mutation(async ({ ctx, input }) => {
      await requireRun(ctx.user.id, input.projectId, input.runId);
      const step = await db.createVirgoYTPlanStep({
        userId: ctx.user.id,
        projectId: input.projectId,
        runId: input.runId,
        stepOrder: input.stepOrder,
        title: input.title,
        description: input.description,
        assignedAgent: input.assignedAgent,
        requiresApproval: Number(input.requiresApproval),
      });
      if (!step) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "VirgoYT plan step could not be created" });
      await db.createVirgoYTAuditEvent({ userId: ctx.user.id, projectId: input.projectId, runId: input.runId, eventKind: "plan.step_created", details: input.title });
      return step;
    }),
  }),

  proposals: router({
    list: protectedProcedure.input(z.object({ projectId: projectIdSchema })).query(async ({ ctx, input }) => {
      await requireProject(ctx.user.id, input.projectId);
      return db.listVirgoYTToolProposals(ctx.user.id, input.projectId);
    }),
    create: protectedProcedure.input(z.object({
      projectId: projectIdSchema,
      runId: z.number().int().positive().nullable().optional(),
      toolKind: toolKindSchema,
      riskLevel: z.enum(["low", "medium", "high"]).default("medium"),
      title: z.string().trim().min(3).max(240),
      details: z.string().trim().min(3).max(12_000),
    })).mutation(async ({ ctx, input }) => {
      await requireProject(ctx.user.id, input.projectId);
      if (input.runId) await requireRun(ctx.user.id, input.projectId, input.runId);
      const proposal = await db.createVirgoYTToolProposal({
        userId: ctx.user.id,
        projectId: input.projectId,
        runId: input.runId,
        toolKind: input.toolKind,
        riskLevel: input.riskLevel,
        title: input.title,
        details: input.details,
        expiresAt: new Date(Date.now() + 15 * 60_000),
      });
      if (!proposal) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "VirgoYT tool proposal could not be created" });
      await db.createVirgoYTAuditEvent({ userId: ctx.user.id, projectId: input.projectId, runId: input.runId, proposalId: proposal.id, eventKind: "proposal.created", details: proposal.title });
      return proposal;
    }),
    resolve: protectedProcedure.input(z.object({
      projectId: projectIdSchema,
      proposalId: z.number().int().positive(),
      decision: z.enum(["approved", "rejected"]),
    })).mutation(async ({ ctx, input }) => {
      await requireProject(ctx.user.id, input.projectId);
      const resolved = await db.resolveVirgoYTToolProposal({
        userId: ctx.user.id,
        projectId: input.projectId,
        proposalId: input.proposalId,
        decision: input.decision,
        approvalNonce: randomUUID(),
        expiresAt: new Date(Date.now() + 5 * 60_000),
      });
      if (!resolved) throw new TRPCError({ code: "CONFLICT", message: "VirgoYT proposal was not found, expired, or already resolved" });
      await db.createVirgoYTAuditEvent({ userId: ctx.user.id, projectId: input.projectId, proposalId: input.proposalId, eventKind: `proposal.${input.decision}`, details: resolved.title });
      return {
        proposal: resolved,
        message: input.decision === "approved"
          ? "Approval recorded. No tool has executed; a paired runner must later redeem the single-use approval."
          : "Proposal rejected. No tool executed.",
      } as const;
    }),
  }),

  audit: router({
    list: protectedProcedure.input(z.object({ projectId: projectIdSchema })).query(async ({ ctx, input }) => {
      await requireProject(ctx.user.id, input.projectId);
      return db.listVirgoYTAuditEvents(ctx.user.id, input.projectId);
    }),
  }),

  providers: router({
    list: protectedProcedure.query(({ ctx }) => db.listVirgoYTProviderProfiles(ctx.user.id)),
    routing: protectedProcedure.query(async ({ ctx }) => {
      const profiles = await db.listVirgoYTProviderProfiles(ctx.user.id);
      return getVirgoYTProviderRoutingSummary(profiles);
    }),
    create: protectedProcedure.input(z.object({
      label: z.string().trim().min(2).max(100),
      provider: providerSchema,
      endpoint: providerEndpointSchema.nullable().optional(),
      defaultModel: z.string().trim().max(160).nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const profile = await db.createVirgoYTProviderProfile({ userId: ctx.user.id, ...input });
      if (!profile) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "VirgoYT provider profile could not be created" });
      await db.createVirgoYTAuditEvent({ userId: ctx.user.id, eventKind: "provider.profile_created", details: `${input.provider}:${input.label}` });
      return profile;
    }),
  }),

  runners: router({
    list: protectedProcedure.input(z.object({ projectId: projectIdSchema })).query(async ({ ctx, input }) => {
      await requireProject(ctx.user.id, input.projectId);
      return db.listVirgoYTRunnerConnections(ctx.user.id, input.projectId);
    }),
    register: protectedProcedure.input(z.object({
      projectId: projectIdSchema,
      displayName: z.string().trim().min(2).max(160),
      runnerType: z.enum(["local_cli", "remote_isolated"]),
    })).mutation(async ({ ctx, input }) => {
      await requireProject(ctx.user.id, input.projectId);
      const runner = await db.createVirgoYTRunnerConnection({ userId: ctx.user.id, ...input });
      if (!runner) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "VirgoYT runner request could not be created" });
      await db.createVirgoYTAuditEvent({ userId: ctx.user.id, projectId: input.projectId, eventKind: "runner.registration_requested", details: `${input.runnerType}:${input.displayName}` });
      return {
        runner,
        message: "Runner registration is pending. Pairing and command execution are intentionally unavailable until the signed local or isolated runner adapter is installed.",
      } as const;
    }),
  }),
});
