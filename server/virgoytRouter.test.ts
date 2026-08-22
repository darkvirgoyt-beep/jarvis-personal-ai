import { describe, expect, it, vi, afterEach } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./virgoytDb", () => ({
  VIRGOYT_AGENT_VALUES: ["coding", "research", "ui", "security", "devops"],
  VIRGOYT_PROVIDER_VALUES: ["openrouter", "compatible", "nvidia_nim", "local_bridge"],
  VIRGOYT_TOOL_KIND_VALUES: ["file_write", "file_delete", "terminal_command", "browser_navigate", "git_operation", "deployment", "runner_connect"],
  getVirgoYTProject: vi.fn(),
  listVirgoYTProjects: vi.fn(),
  createVirgoYTProject: vi.fn(),
  archiveVirgoYTProject: vi.fn(),
  deleteEmptyVirgoYTProject: vi.fn(),
  listVirgoYTRuns: vi.fn(),
  getVirgoYTRun: vi.fn(),
  createVirgoYTRun: vi.fn(),
  listVirgoYTPlanSteps: vi.fn(),
  createVirgoYTPlanStep: vi.fn(),
  listVirgoYTToolProposals: vi.fn(),
  createVirgoYTToolProposal: vi.fn(),
  resolveVirgoYTToolProposal: vi.fn(),
  listVirgoYTAuditEvents: vi.fn(),
  createVirgoYTAuditEvent: vi.fn(),
  listVirgoYTProviderProfiles: vi.fn(),
  createVirgoYTProviderProfile: vi.fn(),
  listVirgoYTRunnerConnections: vi.fn(),
  createVirgoYTRunnerConnection: vi.fn(),
}));

import * as db from "./virgoytDb";
import { appRouter } from "./routers";

function privateContext(userId = 42): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `virgoyt-user-${userId}`,
      name: "VirgoYT User",
      email: "virgoyt@example.com",
      loginMethod: "supabase",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
  } as TrpcContext;
}

const project = { id: 7, userId: 42, name: "Private Agent", slug: "private-agent-abc12345", status: "active" };

afterEach(() => vi.clearAllMocks());

describe("VirgoYT private control-plane router", () => {
  it("creates a private project from the authenticated identity and writes an audit event", async () => {
    vi.mocked(db.createVirgoYTProject).mockResolvedValue(project as never);
    const caller = appRouter.createCaller(privateContext(42));

    await caller.virgoyt.projects.create({ name: "Private Agent", description: "Build a safe workspace", defaultAgent: "coding" });

    expect(db.createVirgoYTProject).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      name: "Private Agent",
      defaultAgent: "coding",
      slug: expect.stringMatching(/^private-agent-/),
    }));
    expect(db.createVirgoYTAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, projectId: 7, eventKind: "project.created" }));
  });

  it("does not let a caller create a run in a project outside their identity scope", async () => {
    vi.mocked(db.getVirgoYTProject).mockResolvedValue(undefined);
    const caller = appRouter.createCaller(privateContext(42));

    await expect(caller.virgoyt.runs.create({ projectId: 99, request: "Review this private repository safely" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.getVirgoYTProject).toHaveBeenCalledWith(42, 99);
    expect(db.createVirgoYTRun).not.toHaveBeenCalled();
  });

  it("removes only an empty temporary project through the authenticated user scope", async () => {
    vi.mocked(db.deleteEmptyVirgoYTProject).mockResolvedValue(1);
    const caller = appRouter.createCaller(privateContext(42));

    await caller.virgoyt.projects.deleteEmpty({ projectId: 7 });

    expect(db.deleteEmptyVirgoYTProject).toHaveBeenCalledWith(42, 7);
  });

  it("refuses cleanup when the project is missing, belongs to another user, or contains work", async () => {
    vi.mocked(db.deleteEmptyVirgoYTProject).mockResolvedValue(0);
    const caller = appRouter.createCaller(privateContext(42));

    await expect(caller.virgoyt.projects.deleteEmpty({ projectId: 99 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(db.deleteEmptyVirgoYTProject).toHaveBeenCalledWith(42, 99);
  });

  it("creates a proposed terminal action only and keeps its user-scoped approval separate from execution", async () => {
    vi.mocked(db.getVirgoYTProject).mockResolvedValue(project as never);
    vi.mocked(db.createVirgoYTToolProposal).mockResolvedValue({ id: 11, ...project, title: "Run validation", status: "pending" } as never);
    const caller = appRouter.createCaller(privateContext(42));

    const proposal = await caller.virgoyt.proposals.create({
      projectId: 7,
      toolKind: "terminal_command",
      riskLevel: "low",
      title: "Run validation",
      details: "pnpm test",
    });

    expect(proposal.status).toBe("pending");
    expect(db.createVirgoYTToolProposal).toHaveBeenCalledWith(expect.objectContaining({
      userId: 42,
      projectId: 7,
      toolKind: "terminal_command",
      riskLevel: "low",
    }));
  });

  it("records approval without claiming that a tool was executed", async () => {
    vi.mocked(db.getVirgoYTProject).mockResolvedValue(project as never);
    vi.mocked(db.resolveVirgoYTToolProposal).mockResolvedValue({ id: 11, title: "Run validation", status: "approved" } as never);
    const caller = appRouter.createCaller(privateContext(42));

    const result = await caller.virgoyt.proposals.resolve({ projectId: 7, proposalId: 11, decision: "approved" });

    expect(db.resolveVirgoYTToolProposal).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, projectId: 7, proposalId: 11, decision: "approved" }));
    expect(result.message).toContain("No tool has executed");
  });

  it("registers runners as pending rather than connecting or executing them", async () => {
    vi.mocked(db.getVirgoYTProject).mockResolvedValue(project as never);
    vi.mocked(db.createVirgoYTRunnerConnection).mockResolvedValue({ id: 4, status: "pending" } as never);
    const caller = appRouter.createCaller(privateContext(42));

    const result = await caller.virgoyt.runners.register({ projectId: 7, displayName: "My Linux workstation", runnerType: "local_cli" });

    expect(db.createVirgoYTRunnerConnection).toHaveBeenCalledWith({ userId: 42, projectId: 7, displayName: "My Linux workstation", runnerType: "local_cli" });
    expect(result.runner.status).toBe("pending");
    expect(result.message).toContain("pending");
  });

  it("rejects provider endpoints that try to include browser-submitted credentials", async () => {
    const caller = appRouter.createCaller(privateContext(42));

    await expect(caller.virgoyt.providers.create({
      label: "Unsafe gateway",
      provider: "compatible",
      endpoint: "https://api.example.test/v1?api_key=should-not-store",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(db.createVirgoYTProviderProfile).not.toHaveBeenCalled();
  });
});
