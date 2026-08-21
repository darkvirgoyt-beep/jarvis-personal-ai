import { describe, expect, it } from "vitest";
import { isStealthAutomationAllowed, jarvisCloudWorkspaceStates, jarvisEngineeringPrinciples } from "./jarvisCloudWorkspace";

describe("Jarvis cloud workspace contract", () => {
  it("reports the active private Supabase runtime without exposing data", () => {
    expect(jarvisCloudWorkspaceStates.find((item) => item.name === "Supabase backend")?.status).toContain("Private Vercel runtime active");
  });

  it("identifies the active approval-gated browser workspace separately from a persistent computer", () => {
    expect(jarvisCloudWorkspaceStates.find((item) => item.name === "Browser workspace")?.status).toContain("Active");
    expect(jarvisCloudWorkspaceStates.find((item) => item.name === "Browser workspace")?.status).toContain("explicit approval");
  });

  it("keeps managed-computer access user controlled and disallows stealth automation", () => {
    expect(jarvisCloudWorkspaceStates.find((item) => item.name === "Managed computer")?.status).toContain("user-controlled");
    expect(jarvisCloudWorkspaceStates.find((item) => item.name === "Managed computer")?.status).toContain("Kali-compatible");
    expect(isStealthAutomationAllowed()).toBe(false);
  });

  it("keeps cloud compilation as an approval-gated runner proposal until a runner is connected", () => {
    const runner = jarvisCloudWorkspaceStates.find((item) => item.name === "Cloud build runner")?.status;
    expect(runner).toContain("reviewed web, Android, or cloud-service runner proposal");
    expect(runner).toContain("no runner is connected");
    expect(runner).toContain("no build can start automatically");
  });

  it("requires minimal changes without weakening core safeguards", () => {
    expect(jarvisEngineeringPrinciples.join(" ")).toContain("smallest tested patch");
    expect(jarvisEngineeringPrinciples.join(" ")).toContain("privacy");
  });
});
