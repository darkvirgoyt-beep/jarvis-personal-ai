import { describe, expect, it } from "vitest";
import { getVirgoYTToolContract, listVirgoYTToolContracts } from "./virgoytToolContracts";

describe("VirgoYT tool contracts", () => {
  it("makes every mutable or external tool explicitly approved and runner-bound", () => {
    for (const contract of listVirgoYTToolContracts()) {
      expect(contract.requiresExplicitApproval).toBe(true);
      expect(contract.requiresPairedRunner).toBe(true);
      expect(contract.executionState).toBe("proposal_only");
    }
  });

  it("locks destructive tool risk levels in server-owned contracts", () => {
    expect(getVirgoYTToolContract("terminal_command").riskLevel).toBe("high");
    expect(getVirgoYTToolContract("git_operation").riskLevel).toBe("high");
    expect(getVirgoYTToolContract("deployment").riskLevel).toBe("high");
    expect(getVirgoYTToolContract("file_write").riskLevel).toBe("medium");
  });
});
