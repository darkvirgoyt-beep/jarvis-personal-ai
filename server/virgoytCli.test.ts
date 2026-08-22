import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = path.join(projectRoot, "scripts", "virgoyt-cli.mjs");

describe("VirgoYT proposal-only CLI", () => {
  it("emits a redacted, approval-required proposal without executing it", () => {
    const stdout = execFileSync(process.execPath, [
      cliPath,
      "proposal",
      "--project", "workspace-7",
      "--kind", "terminal_command",
      "--title", "Inspect app logs",
      "--details", "command=tail -n 20 app.log token=super-secret-value",
    ], { encoding: "utf8" });
    const proposal = JSON.parse(stdout) as Record<string, unknown>;

    expect(proposal).toMatchObject({
      type: "virgoyt.tool_proposal",
      projectId: "workspace-7",
      toolKind: "terminal_command",
      riskLevel: "high",
      requiresApproval: true,
      executable: false,
    });
    expect(proposal.details).toContain("token=[REDACTED]");
    expect(proposal.payloadDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects unrecognized commands and reports the fixed approved-recipe boundary", () => {
    const status = JSON.parse(execFileSync(process.execPath, [cliPath, "status"], { encoding: "utf8" })) as Record<string, unknown>;
    const attempt = spawnSync(process.execPath, [cliPath, "execute"], { encoding: "utf8" });

    expect(status).toMatchObject({ credentialAccess: false, commandExecution: "fixed-approved-compile-recipes-only", signingAllowed: false, publishingAllowed: false, requiresWorkspaceApproval: true });
    expect(attempt.status).toBe(2);
    expect(attempt.stderr).toContain("Unknown command");
  });
});
