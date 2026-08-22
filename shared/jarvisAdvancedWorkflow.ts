export type JarvisWorkflowToolKey = "search" | "runner" | "file-change" | "browser" | "git" | "deployment" | "image" | "vision";
export type JarvisWorkflowIntent = "answer" | "research" | "code" | "builder" | "image" | "data" | "document" | "debug" | "environment";
export type JarvisWorkflowState = "not-requested" | "proposal-ready" | "approved" | "waiting-for-connected-tool" | "completed-with-evidence";

export type JarvisWorkflowToolContract = {
  key: JarvisWorkflowToolKey;
  label: string;
  approvalRule: string;
  resultRule: string;
};

export const JARVIS_ADVANCED_TOOL_CONTRACTS: readonly JarvisWorkflowToolContract[] = [
  { key: "search", label: "Web research", approvalRule: "Confirm the destination and scope before an external search or navigation.", resultRule: "Only cite sources actually returned by a connected research result." },
  { key: "runner", label: "Connected runner", approvalRule: "Approve a fixed reviewed job before a paired runner can claim it.", resultRule: "Report compilation or execution only after the runner returns a sanitized result." },
  { key: "file-change", label: "Workspace file change", approvalRule: "Review and approve the exact file proposal before any write, edit, or delete.", resultRule: "Call a file changed only when the approved workspace operation returns success." },
  { key: "browser", label: "Browser work", approvalRule: "Approve each external destination or authenticated browser handoff.", resultRule: "Describe a page action only when its connected browser result is visible." },
  { key: "git", label: "Git operation", approvalRule: "Approve repository, branch, and exact mutation before a commit, push, or pull request.", resultRule: "Claim synchronization only after the Git provider returns its result." },
  { key: "deployment", label: "Deployment", approvalRule: "Approve the target, environment, and release action separately.", resultRule: "Claim publication only after the deployment provider returns a live result." },
  { key: "image", label: "Image generation or edit", approvalRule: "Approve the image brief or requested edit before generation begins.", resultRule: "Present only generated assets and provider results; never invent an image output." },
  { key: "vision", label: "Image or document analysis", approvalRule: "Require the user to supply or approve the source material before analysis.", resultRule: "Describe only content observed in the supplied or connected source." },
] as const;

const workflowToolsByIntent: Record<JarvisWorkflowIntent, readonly JarvisWorkflowToolKey[]> = {
  answer: [],
  research: ["search", "browser"],
  code: ["file-change", "runner", "git"],
  builder: ["file-change", "runner", "git", "deployment"],
  image: ["image", "vision"],
  data: ["file-change", "vision"],
  document: ["file-change", "vision"],
  debug: ["file-change", "runner"],
  environment: ["runner", "browser"],
};

export const JARVIS_REAL_RESULT_ONLY_RULE = "Never claim a search, runner execution, file change, browser action, Git operation, deployment, image output, or vision finding is complete unless a connected tool supplied evidence. Before that, describe it only as a proposal, approved request, or waiting-for-tool step.";

export function getJarvisWorkflowTools(intent: JarvisWorkflowIntent) {
  const keys = workflowToolsByIntent[intent];
  return keys.map((key) => JARVIS_ADVANCED_TOOL_CONTRACTS.find((contract) => contract.key === key)!);
}

export function canClaimJarvisWorkflowResult(state: JarvisWorkflowState, hasConnectedEvidence: boolean) {
  return state === "completed-with-evidence" && hasConnectedEvidence;
}
