import { describe, expect, it } from "vitest";
import { buildJarvisWorkspaceProposal, normalizeJarvisWorkspacePath } from "./jarvisWorkspace";

describe("Jarvis virtual workspace paths", () => {
  it("normalizes safe relative paths for private workspace records", () => {
    expect(normalizeJarvisWorkspacePath("  projects\\jarvis\u002FREADME.md ")).toBe("projects/jarvis/README.md");
    expect(buildJarvisWorkspaceProposal("code", "src/app.ts", "export const jarvis = true;")).toMatchObject({
      operation: "code", path: "src/app.ts", name: "app.ts",
    });
  });

  it("rejects traversal and unsafe logical workspace paths", () => {
    expect(() => normalizeJarvisWorkspacePath("../secrets.txt")).toThrow(/paths/i);
    expect(() => normalizeJarvisWorkspacePath("/etc/passwd")).toThrow(/relative/i);
  });
});
