import { describe, expect, it } from "vitest";
import { JARVIS_ADVANCED_TOOL_CONTRACTS, JARVIS_REAL_RESULT_ONLY_RULE, canClaimJarvisWorkflowResult, getJarvisWorkflowTools } from "./jarvisAdvancedWorkflow";

describe("Jarvis advanced workflow contract", () => {
  it("defines an explicit approval and evidence rule for every high-impact workflow tool", () => {
    expect(JARVIS_ADVANCED_TOOL_CONTRACTS.map((contract) => contract.key)).toEqual([
      "search", "runner", "file-change", "browser", "git", "deployment", "image", "vision",
    ]);
    for (const contract of JARVIS_ADVANCED_TOOL_CONTRACTS) {
      expect(contract.approvalRule).toMatch(/approve|confirm|require/i);
      expect(contract.resultRule).toMatch(/only|after/i);
    }
  });

  it("maps normal-language build and visual workflows to their concrete reviewed tool boundaries", () => {
    expect(getJarvisWorkflowTools("builder").map((contract) => contract.key)).toEqual(["file-change", "runner", "git", "deployment"]);
    expect(getJarvisWorkflowTools("image").map((contract) => contract.key)).toEqual(["image", "vision"]);
    expect(JARVIS_REAL_RESULT_ONLY_RULE).toContain("connected tool supplied evidence");
  });

  it("allows completion claims only when a connected tool supplied evidence", () => {
    expect(canClaimJarvisWorkflowResult("approved", true)).toBe(false);
    expect(canClaimJarvisWorkflowResult("completed-with-evidence", false)).toBe(false);
    expect(canClaimJarvisWorkflowResult("completed-with-evidence", true)).toBe(true);
  });
});
