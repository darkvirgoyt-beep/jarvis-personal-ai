import { describe, expect, it } from "vitest";
import { createVirgoYTCompileSpec, parseVirgoYTCompileSpec } from "./virgoytCompile";

describe("VirgoYT connected compile contract", () => {
  it("uses fixed reviewed steps and keeps signing and publishing disabled", () => {
    const spec = createVirgoYTCompileSpec({ target: "web", workspacePath: "projects/atlas" });
    expect(spec.steps).toEqual(["verify-package-manifest", "install-locked-dependencies", "run-tests", "build-production-bundle"]);
    expect(spec.signingAllowed).toBe(false);
    expect(spec.publishingAllowed).toBe(false);
  });

  it("rejects traversal paths and malformed execution payloads", () => {
    expect(() => createVirgoYTCompileSpec({ target: "web", workspacePath: "../private" })).toThrow("relative project directory");
    expect(parseVirgoYTCompileSpec(JSON.stringify({ kind: "compile", version: 1, target: "web", workspacePath: "../private" }))).toBeUndefined();
  });
});
