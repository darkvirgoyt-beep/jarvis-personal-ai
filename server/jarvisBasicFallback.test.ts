import { describe, expect, it } from "vitest";
import { buildJarvisBasicFallback } from "./jarvisBasicFallback";

describe("Jarvis basic fallback", () => {
  it("clearly identifies provider-unavailable mode while preserving the active Builder and private-workspace boundaries", () => {
    const response = buildJarvisBasicFallback("Build a private web application with an API", "coding");

    expect(response).toContain("Jarvis workspace assistance mode is active");
    expect(response).toContain("Your private Builder is still available");
    expect(response).toContain("active approval-gated private workspace");
    expect(response).toContain("persistent Cloud Computer is not connected");
    expect(response).toContain("No code, files, migrations, integrations, or deployments were run");
  });

  it("does not imply external execution for general requests", () => {
    const response = buildJarvisBasicFallback("Find my latest project status", "general");

    expect(response).toContain("browser-based private workspace and Builder remain available");
    expect(response).toContain("will not claim it can run software or control a virtual desktop");
    expect(response).toContain("No external service, device, file, code, message, or action was accessed or executed");
  });
});
