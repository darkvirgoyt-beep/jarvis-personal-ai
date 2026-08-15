import { describe, expect, it } from "vitest";
import { agentInstructions, extractMemoryCommand, extractTaskCommand, JARVIS_AGENTS, requiresExplicitConfirmation } from "./jarvisPolicies";

describe("Jarvis safety and command policies", () => {
  it("provides a purpose-built instruction for each allowed specialist agent", () => {
    expect(JARVIS_AGENTS).toEqual(["general", "coding", "research", "files", "system", "creative"]);
    expect(JARVIS_AGENTS.every(agent => agentInstructions[agent].trim().length > 30)).toBe(true);
    expect(agentInstructions.files).toContain("do not imply");
    expect(agentInstructions.system).toContain("never claim");
  });

  it("requires a confirmation gate for destructive and external commands", () => {
    expect(requiresExplicitConfirmation("Please delete the old draft")).toBe(true);
    expect(requiresExplicitConfirmation("Run a terminal command to restart the service")).toBe(true);
    expect(requiresExplicitConfirmation("Summarize my project notes")).toBe(false);
  });

  it("extracts deliberate task and memory commands", () => {
    expect(extractTaskCommand("/task Outline a priority plan for tomorrow")).toBe("Outline a priority plan for tomorrow");
    expect(extractTaskCommand("Create a priority task for tomorrow")).toBe("tomorrow");
    expect(extractTaskCommand("Add a high priority task to prepare the deployment")).toBe("prepare the deployment");
    expect(extractTaskCommand("Remind me to review the design notes")).toBe("review the design notes");
    expect(extractTaskCommand("This is only a task discussion")).toBeUndefined();
    expect(extractMemoryCommand("/remember I prefer concise strategic updates")).toBe("I prefer concise strategic updates");
  });
});
