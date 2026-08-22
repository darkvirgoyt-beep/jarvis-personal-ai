export const VIRGOYT_COMPILE_TARGETS = ["web", "android", "service"] as const;
export type VirgoYTCompileTarget = (typeof VIRGOYT_COMPILE_TARGETS)[number];

export type VirgoYTCompileSpec = {
  kind: "compile";
  version: 1;
  target: VirgoYTCompileTarget;
  environment: "ubuntu-node" | "ubuntu-android";
  workspacePath: string;
  steps: readonly string[];
  artifactHints: readonly string[];
  signingAllowed: false;
  publishingAllowed: false;
};

function isSafeWorkspacePath(value: string) {
  return /^(?:[A-Za-z0-9._-]+\/)*[A-Za-z0-9._-]+$/.test(value)
    && !value.split("/").includes("..")
    && !value.startsWith("/");
}

/**
 * Build jobs are fixed toolchain recipes. The runner never accepts a command
 * from the model, chat, or browser, which keeps execution reviewable.
 */
export function createVirgoYTCompileSpec(input: { target: VirgoYTCompileTarget; workspacePath: string }): VirgoYTCompileSpec {
  const workspacePath = input.workspacePath.trim().replace(/^\.\//, "");
  if (!isSafeWorkspacePath(workspacePath)) throw new Error("Workspace path must be a relative project directory without traversal segments.");

  if (input.target === "android") {
    return {
      kind: "compile", version: 1, target: "android", environment: "ubuntu-android", workspacePath,
      steps: ["verify-gradle-wrapper", "gradle-assemble-debug"], artifactHints: ["app/build/outputs/apk/debug/*.apk"],
      signingAllowed: false, publishingAllowed: false,
    };
  }

  return {
    kind: "compile", version: 1, target: input.target, environment: "ubuntu-node", workspacePath,
    steps: ["verify-package-manifest", "install-locked-dependencies", "run-tests", "build-production-bundle"],
    artifactHints: input.target === "service" ? ["dist/**", "Dockerfile"] : ["dist/**", "build/**"],
    signingAllowed: false, publishingAllowed: false,
  };
}

export function parseVirgoYTCompileSpec(payloadJson: string): VirgoYTCompileSpec | undefined {
  try {
    const value = JSON.parse(payloadJson) as Partial<VirgoYTCompileSpec>;
    if (value.kind !== "compile" || value.version !== 1 || !VIRGOYT_COMPILE_TARGETS.includes(value.target as VirgoYTCompileTarget)) return undefined;
    if (typeof value.workspacePath !== "string" || !isSafeWorkspacePath(value.workspacePath)) return undefined;
    if (!Array.isArray(value.steps) || !Array.isArray(value.artifactHints) || value.signingAllowed !== false || value.publishingAllowed !== false) return undefined;
    return value as VirgoYTCompileSpec;
  } catch {
    return undefined;
  }
}
