import { describe, expect, it } from "vitest";
import { buildJarvisBasicFallback } from "./jarvisBasicFallback";

describe("Jarvis basic fallback", () => {
  it("keeps app planning and reviewed deployment proposals available while preserving execution boundaries", () => {
    const response = buildJarvisBasicFallback("Build a private web application with an API", "coding");

    expect(response).toContain("Jarvis app workspace mode is active");
    expect(response).toContain("app request is still supported through Builder");
    expect(response).toContain("implementation and publish proposal for your approval");
    expect(response).toContain("approval-gated");
    expect(response).toContain("Builder can prepare a web, Android, or cloud-service toolchain checklist");
    expect(response).toContain("persistent Cloud Computer is not connected");
    expect(response).toContain("No code, files, migrations, integrations, builds, signed artifacts, or deployments were run automatically");
    expect(response).not.toContain("cannot generate a full live code response");
  });

  it("does not imply external execution for general requests", () => {
    const response = buildJarvisBasicFallback("Find my latest project status", "general");

    expect(response).toContain("browser-based private workspace and Builder remain available");
    expect(response).toContain("will not claim it can run software or control a virtual desktop");
    expect(response).toContain("No external service, device, file, code, message, or action was accessed or executed");
  });
});
