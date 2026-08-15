import { describe, expect, it } from "vitest";
import { approvedMobileActionUrl, createMobileActionProposal } from "./jarvisMobileIntents";

describe("Jarvis mobile intent proposals", () => {
  it("creates an approval-gated map handoff", () => {
    const proposal = createMobileActionProposal("maps", "coffee near me");
    expect(proposal.requiresApproval).toBe(true);
    expect(proposal.url).toContain("google.com/maps");
  });

  it("cannot resolve an external action without an explicit approval", () => {
    const proposal = createMobileActionProposal("call", "+1 555 0100");
    expect(() => approvedMobileActionUrl(proposal, false)).toThrow("explicit approval");
    expect(approvedMobileActionUrl(proposal, true)).toBe("tel:+15550100");
  });
});
