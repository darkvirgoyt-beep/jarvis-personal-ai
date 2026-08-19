import type { VirgoYTToolKind } from "./virgoytDb";

export type VirgoYTToolContract = {
  kind: VirgoYTToolKind;
  label: string;
  riskLevel: "medium" | "high";
  requiresExplicitApproval: true;
  requiresPairedRunner: true;
  executionState: "proposal_only";
  description: string;
};

export const VIRGOYT_TOOL_CONTRACTS: Record<VirgoYTToolKind, VirgoYTToolContract> = {
  file_write: {
    kind: "file_write", label: "Write file", riskLevel: "medium", requiresExplicitApproval: true, requiresPairedRunner: true, executionState: "proposal_only",
    description: "Stages a reviewed file-content change for a scoped project workspace.",
  },
  file_delete: {
    kind: "file_delete", label: "Delete file", riskLevel: "high", requiresExplicitApproval: true, requiresPairedRunner: true, executionState: "proposal_only",
    description: "Stages a reviewed file deletion; it cannot execute from the web control plane.",
  },
  terminal_command: {
    kind: "terminal_command", label: "Terminal command", riskLevel: "high", requiresExplicitApproval: true, requiresPairedRunner: true, executionState: "proposal_only",
    description: "Stages one visible command for a paired, isolated or local runner after approval.",
  },
  browser_navigate: {
    kind: "browser_navigate", label: "Browser destination", riskLevel: "medium", requiresExplicitApproval: true, requiresPairedRunner: true, executionState: "proposal_only",
    description: "Stages a visible browser destination. Credentials, logins, and hidden browsing are not supported.",
  },
  git_operation: {
    kind: "git_operation", label: "Git operation", riskLevel: "high", requiresExplicitApproval: true, requiresPairedRunner: true, executionState: "proposal_only",
    description: "Stages a named repository operation; no clone, commit, push, or force operation executes automatically.",
  },
  deployment: {
    kind: "deployment", label: "Deployment", riskLevel: "high", requiresExplicitApproval: true, requiresPairedRunner: true, executionState: "proposal_only",
    description: "Stages a deployment plan. Provider credentials and irreversible release actions require a separately paired runner.",
  },
  runner_connect: {
    kind: "runner_connect", label: "Runner connection", riskLevel: "high", requiresExplicitApproval: true, requiresPairedRunner: true, executionState: "proposal_only",
    description: "Stages a runner-pairing request. It cannot attach to a device or virtual machine without a separately installed and verified adapter.",
  },
};

export function getVirgoYTToolContract(kind: VirgoYTToolKind) {
  return VIRGOYT_TOOL_CONTRACTS[kind];
}

export function listVirgoYTToolContracts() {
  return Object.values(VIRGOYT_TOOL_CONTRACTS);
}
