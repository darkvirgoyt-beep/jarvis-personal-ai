import { describe, expect, it } from "vitest";
import { buildJarvisCodingPrompt } from "./jarvisCoding";

describe("buildJarvisCodingPrompt", () => {
  it("keeps the selected language and required safe structured-output sections", () => {
    const prompt = buildJarvisCodingPrompt("Python", "Create a rate limiter");
    expect(prompt).toContain("senior Python coding assistant");
    expect(prompt).toContain("Create a rate limiter");
    expect(prompt).toContain("Implementation plan");
    expect(prompt).toContain("Safe code suggestions");
    expect(prompt).toContain("Tests");
    expect(prompt).toContain("Risks");
    expect(prompt).toContain("Do not execute commands");
  });
});
