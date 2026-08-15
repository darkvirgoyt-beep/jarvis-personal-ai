import { describe, expect, it } from "vitest";
import { buildJarvisGitHubHandoff } from "./jarvisGitHub";

describe("Jarvis GitHub handoffs", () => {
  it("creates a canonical browser-auth handoff without handling credentials", () => {
    expect(buildJarvisGitHubHandoff("sign in")).toMatchObject({
      label: "GitHub connection",
      url: "https://github.com/login?return_to=%2Fnew",
      riskLevel: "medium",
    });
  });

  it("allows only canonical GitHub repository destinations", () => {
    expect(buildJarvisGitHubHandoff("github.com/acme/project.git")).toMatchObject({
      destination: "acme/project",
      url: "https://github.com/acme/project",
    });
    expect(() => buildJarvisGitHubHandoff("https://example.com/acme/project?token=secret")).toThrow("plain HTTPS github.com repository URL");
    expect(() => buildJarvisGitHubHandoff("https://github.com/acme/project?token=secret")).toThrow("plain HTTPS github.com repository URL");
  });
});
