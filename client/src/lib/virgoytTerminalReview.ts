export type CompileRecipePreview = {
  environment: string;
  workspacePath: string;
  steps: string[];
  artifactHints: string[];
};

/** Reads only the fixed recipe payload persisted by an approved compile proposal. */
export function getCompileRecipePreview(payloadJson: string): CompileRecipePreview | undefined {
  try {
    const payload = JSON.parse(payloadJson) as Partial<CompileRecipePreview & { kind: string; version: number }>;
    if (payload.kind !== "compile" || payload.version !== 1 || typeof payload.environment !== "string" || typeof payload.workspacePath !== "string") return undefined;
    if (!Array.isArray(payload.steps) || !payload.steps.every((step) => typeof step === "string")) return undefined;
    if (!Array.isArray(payload.artifactHints) || !payload.artifactHints.every((hint) => typeof hint === "string")) return undefined;
    return { environment: payload.environment, workspacePath: payload.workspacePath, steps: payload.steps, artifactHints: payload.artifactHints };
  } catch {
    return undefined;
  }
}

/** Audit details are stored as a JSON string; return a safe concise display value. */
export function summarizeTerminalAuditDetails(detailsJson: string): string {
  try {
    const value = JSON.parse(detailsJson) as unknown;
    if (typeof value === "string") return value.slice(0, 420);
    return JSON.stringify(value).slice(0, 420);
  } catch {
    return detailsJson.slice(0, 420);
  }
}
