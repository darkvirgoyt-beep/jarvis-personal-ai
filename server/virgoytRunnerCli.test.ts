import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const cli = join(process.cwd(), "scripts", "virgoyt-cli.mjs");

describe("VirgoYT proposal-only local runner CLI", () => {
  it("creates a credential-free proposal-only manifest and draft without executing a tool", () => {
    const dir = mkdtempSync(join(tmpdir(), "virgoyt-cli-"));
    const configPath = join(dir, "runner.json");
    execFileSync(process.execPath, [cli, "init", "--server", "https://scrimly-seven.vercel.app", "--project", "7", "--name", "Local runner", "--config", configPath], { encoding: "utf8" });
    const config = JSON.parse(readFileSync(configPath, "utf8"));
    expect(config.mode).toBe("proposal_only");
    expect(Object.keys(config).some((key) => /credential|token|password|api.?key/i.test(key))).toBe(false);

    execFileSync(process.execPath, [cli, "proposal", "--kind", "terminal_command", "--title", "Run validation", "--config", configPath], { encoding: "utf8" });
    const proposalFiles = readdirSync(join(dir, "proposals"));
    expect(proposalFiles).toHaveLength(1);
    const draft = JSON.parse(readFileSync(join(dir, "proposals", proposalFiles[0]), "utf8"));
    expect(draft.executionState).toBe("proposal_only");
  });

  it("rejects command-line credential material", () => {
    expect(() => execFileSync(process.execPath, [cli, "init", "--server", "https://scrimly-seven.vercel.app", "--project", "7", "--name", "Local runner", "--token", "not-allowed"], { encoding: "utf8" })).toThrow();
  });
});
