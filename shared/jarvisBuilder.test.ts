import { describe, expect, it } from "vitest";
import { createJarvisBuilderPlan } from "./jarvisBuilder";

describe("Jarvis Builder plan", () => {
  it("creates a reviewable full-stack blueprint with backend readiness checks", () => {
    const plan = createJarvisBuilderPlan({
      name: "Study companion",
      brief: "A private study dashboard for focused learning sessions.",
      projectType: "web_app",
      capabilities: ["api", "database", "authentication", "storage"],
    });

    expect(plan.slug).toBe("study-companion");
    expect(plan.recommendedFiles).toContain("server/routers/project.ts");
    expect(plan.recommendedFiles).toContain("drizzle/schema.ts");
    expect(plan.blueprint).toContain("No generated code will be executed");
    expect(plan.generationPrompt).toContain("Compile-readiness checklist");
  });

  it("keeps a website plan frontend-focused when no backend capabilities are selected", () => {
    const plan = createJarvisBuilderPlan({ name: "Portfolio", brief: "A focused responsive portfolio.", projectType: "website", capabilities: [] });

    expect(plan.recommendedFiles).not.toContain("server/routers/project.ts");
    expect(plan.blueprint).toContain("Responsive website");
  });
});
