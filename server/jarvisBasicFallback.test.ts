import { describe, expect, it } from "vitest";
import { buildJarvisBasicFallback } from "./jarvisBasicFallback";

describe("Jarvis basic fallback", () => {
  it("clearly identifies the limited local mode for builder and coding requests", () => {
    const response = buildJarvisBasicFallback("Build a private web application with an API", "coding");

    expect(response).toContain("Jarvis basic response mode is active");
    expect(response).toContain("free local build brief");
    expect(response).toContain("No code, files, migrations, integrations, or deployments were run");
  });

  it("does not imply external execution for general requests", () => {
    const response = buildJarvisBasicFallback("Find my latest project status", "general");

    expect(response).toContain("No external service, device, file, code, message, or action was accessed or executed");
  });
});
