import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const agentSchema = z.enum(["general", "coding", "research", "files", "system", "creative"]);
const memoryCategorySchema = z.enum(["preference", "project", "personal", "fact", "note"]);
const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);
const taskPrioritySchema = z.enum(["low", "medium", "high"]);
const modelSchema = z.enum(["nemotron-3-ultra", "gpt-5-mini", "gpt-5", "claude-sonnet-4-6", "gemini-3-flash-preview"]);

async function requireConversation(userId: number, conversationId: number) {
  const conversation = await db.getJarvisConversation(userId, conversationId);
  if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Jarvis conversation not found" });
  return conversation;
}

export const jarvisRouter = router({
  agents: protectedProcedure.query(() => ([
    { id: "general", name: "General", description: "Context-aware daily assistance" },
    { id: "coding", name: "Coding", description: "Plan, write, and explain software" },
    { id: "research", name: "Research", description: "Investigate topics with source-aware answers" },
    { id: "files", name: "Files", description: "Prepare safe file-management plans" },
    { id: "system", name: "System", description: "Coordinate approved tools and workflows" },
    { id: "creative", name: "Creative", description: "Develop original concepts and writing" },
  ])),

  conversations: router({
    list: protectedProcedure.query(({ ctx }) => db.listJarvisConversations(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      title: z.string().trim().min(1).max(180),
      activeAgent: agentSchema.default("general"),
    })).mutation(({ ctx, input }) => db.createJarvisConversation(ctx.user.id, input.title, input.activeAgent)),
    messages: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        await requireConversation(ctx.user.id, input.conversationId);
        return db.listJarvisMessages(ctx.user.id, input.conversationId);
      }),
  }),

  memory: router({
    list: protectedProcedure.query(({ ctx }) => db.listJarvisMemories(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      content: z.string().trim().min(1).max(6000),
      category: memoryCategorySchema.default("note"),
    })).mutation(async ({ ctx, input }) => {
      await db.createJarvisMemory({ userId: ctx.user.id, ...input, source: "manual" });
      return { success: true } as const;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      content: z.string().trim().min(1).max(6000),
      category: memoryCategorySchema,
    })).mutation(async ({ ctx, input }) => {
      const updated = await db.updateJarvisMemory(ctx.user.id, input.id, input.content, input.category);
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Jarvis memory not found" });
      return { success: true } as const;
    }),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const deleted = await db.deleteJarvisMemory(ctx.user.id, input.id);
        if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Jarvis memory not found" });
        return { success: true } as const;
      }),
  }),

  tasks: router({
    list: protectedProcedure.query(({ ctx }) => db.listJarvisTasks(ctx.user.id)),
    create: protectedProcedure.input(z.object({
      title: z.string().trim().min(1).max(240),
      notes: z.string().trim().max(6000).nullable().optional(),
      priority: taskPrioritySchema.default("medium"),
      dueAt: z.date().nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      await db.createJarvisTask({ userId: ctx.user.id, ...input });
      return { success: true } as const;
    }),
    update: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      title: z.string().trim().min(1).max(240).optional(),
      notes: z.string().trim().max(6000).nullable().optional(),
      status: taskStatusSchema.optional(),
      priority: taskPrioritySchema.optional(),
      dueAt: z.date().nullable().optional(),
    })).mutation(async ({ ctx, input }) => {
      const updated = await db.updateJarvisTask({ userId: ctx.user.id, ...input });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Jarvis task not found" });
      return { success: true } as const;
    }),
  }),

  preferences: router({
    get: protectedProcedure.query(({ ctx }) => db.getJarvisPreferences(ctx.user.id)),
    update: protectedProcedure.input(z.object({
      model: modelSchema.optional(),
      personality: z.enum(["balanced", "concise", "strategic", "creative"]).optional(),
      voiceEnabled: z.boolean().optional(),
      continuousMode: z.boolean().optional(),
      speechRate: z.number().int().min(70).max(140).optional(),
    })).mutation(({ ctx, input }) => db.updateJarvisPreferences({
      userId: ctx.user.id,
      model: input.model,
      personality: input.personality,
      voiceEnabled: input.voiceEnabled === undefined ? undefined : Number(input.voiceEnabled),
      continuousMode: input.continuousMode === undefined ? undefined : Number(input.continuousMode),
      speechRate: input.speechRate,
    })),
  }),

  confirmations: router({
    list: protectedProcedure.query(({ ctx }) => db.listJarvisConfirmations(ctx.user.id)),
    propose: protectedProcedure.input(z.object({
      action: z.string().trim().min(1).max(180),
      riskLevel: z.enum(["low", "medium", "high"]).default("high"),
      details: z.string().trim().min(1).max(4000),
    })).mutation(({ ctx, input }) => db.createJarvisConfirmation({
      userId: ctx.user.id,
      action: input.action,
      riskLevel: input.riskLevel,
      payload: JSON.stringify({ details: input.details }),
    })),
    resolve: protectedProcedure.input(z.object({
      id: z.number().int().positive(),
      decision: z.enum(["approved", "rejected"]),
    })).mutation(async ({ ctx, input }) => {
      const resolved = await db.resolveJarvisConfirmation(ctx.user.id, input.id, input.decision);
      if (!resolved) throw new TRPCError({ code: "NOT_FOUND", message: "Jarvis approval gate not found or already resolved" });
      return {
        success: true,
        message: input.decision === "approved"
          ? "Jarvis recorded your approval. No external action is executed until a connected tool is available and displayed for review."
          : "Jarvis rejected the proposed action. No external action was executed.",
      } as const;
    }),
  }),
});
