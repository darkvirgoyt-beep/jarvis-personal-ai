import { describe, expect, it } from "vitest";
import { normalizeVirgoYTRiskLevel, redactVirgoYTSensitiveText, virgoytPayloadDigest } from "./virgoytDb";

describe("VirgoYT control-plane persistence safeguards", () => {
  it("redacts common secret forms before they can enter a proposal or audit payload", () => {
    const value = redactVirgoYTSensitiveText("token=abc123456789012 and Bearer ABCDEFGHIJKLMNOP and sk-test_abcdefghijklm");
    expect(value).toContain("token=[REDACTED]");
    expect(value).toContain("Bearer [REDACTED]");
    expect(value).toContain("[REDACTED_API_KEY]");
    expect(value).not.toContain("abcdefghijklm");
  });

  it("elevates destructive and connected operations to a high-risk approval gate", () => {
    expect(normalizeVirgoYTRiskLevel("terminal_command", "low")).toBe("high");
    expect(normalizeVirgoYTRiskLevel("deployment", "medium")).toBe("high");
    expect(normalizeVirgoYTRiskLevel("file_write", "low")).toBe("low");
  });

  it("uses a stable digest to bind an approval record to its reviewed payload", () => {
    expect(virgoytPayloadDigest({ details: "pnpm test" })).toBe(virgoytPayloadDigest({ details: "pnpm test" }));
    expect(virgoytPayloadDigest({ details: "pnpm test" })).not.toBe(virgoytPayloadDigest({ details: "pnpm build" }));
  });
});
