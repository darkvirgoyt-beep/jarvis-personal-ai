import { describe, expect, it } from "vitest";
import { isStealthAutomationAllowed, jarvisCloudWorkspaceStates, jarvisEngineeringPrinciples } from "./jarvisCloudWorkspace";

describe("Jarvis cloud workspace contract", () => {
  it("reports a migration-ready Supabase state without claiming data migration", () => {
    expect(jarvisCloudWorkspaceStates.find((item) => item.name === "Supabase backend")?.status).toContain("no private records moved");
  });

  it("identifies the active approval-gated browser workspace separately from a persistent computer", () => {
    expect(jarvisCloudWorkspaceStates.find((item) => item.name === "Browser workspace")?.status).toContain("Active");
    expect(jarvisCloudWorkspaceStates.find((item) => item.name === "Browser workspace")?.status).toContain("explicit approval");
  });

  it("keeps managed-computer access user controlled and disallows stealth automation", () => {
    expect(jarvisCloudWorkspaceStates.find((item) => item.name === "Managed computer")?.status).toContain("user-controlled");
    expect(isStealthAutomationAllowed()).toBe(false);
  });

  it("requires minimal changes without weakening core safeguards", () => {
    expect(jarvisEngineeringPrinciples.join(" ")).toContain("smallest tested patch");
    expect(jarvisEngineeringPrinciples.join(" ")).toContain("privacy");
  });
});
