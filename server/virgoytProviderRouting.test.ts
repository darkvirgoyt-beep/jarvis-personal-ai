import { describe, expect, it } from "vitest";
import { getVirgoYTProviderRoutingSummary, isCredentialFreeProviderEndpoint } from "./virgoytProviderRouting";

describe("VirgoYT provider routing boundary", () => {
  it("reports only credential-free server routing state", () => {
    const summary = getVirgoYTProviderRoutingSummary([
      { provider: "compatible", status: "ready", endpoint: "https://gateway.example/v1", defaultModel: "model-x" },
    ]);

    expect(summary.find((route) => route.id === "compatible")).toMatchObject({
      profileCount: 1,
      credentialState: "not_configured",
      executable: false,
    });
    expect(summary.find((route) => route.id === "local_bridge")?.credentialState).toBe("runner_required");
  });

  it("rejects endpoint URLs that embed credentials", () => {
    expect(isCredentialFreeProviderEndpoint("https://api.example/v1")).toBe(true);
    expect(isCredentialFreeProviderEndpoint("https://key@example.test/v1")).toBe(false);
    expect(isCredentialFreeProviderEndpoint("https://api.example/v1?api_key=secret")).toBe(false);
  });
});
