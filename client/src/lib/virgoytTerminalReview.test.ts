import { describe, expect, it } from "vitest";
import { getCompileRecipePreview, summarizeTerminalAuditDetails } from "./virgoytTerminalReview";

describe("VirgoYT reviewed terminal helpers", () => {
  it("accepts only persisted fixed compile recipes", () => {
    expect(getCompileRecipePreview(JSON.stringify({ kind: "compile", version: 1, environment: "ubuntu-node", workspacePath: "projects/jarvis", steps: ["run-tests"], artifactHints: ["dist/**"] }))).toEqual({ environment: "ubuntu-node", workspacePath: "projects/jarvis", steps: ["run-tests"], artifactHints: ["dist/**"] });
    expect(getCompileRecipePreview(JSON.stringify({ kind: "shell", version: 1, command: "rm -rf /" }))).toBeUndefined();
  });

  it("presents audit detail text without requiring arbitrary command output", () => {
    expect(summarizeTerminalAuditDetails('"compile.requested"')).toBe("compile.requested");
    expect(summarizeTerminalAuditDetails("runner reported a safe result")).toBe("runner reported a safe result");
  });
});
