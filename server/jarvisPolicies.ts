export const JARVIS_AGENTS = ["general", "coding", "research", "files", "system", "creative"] as const;
export type JarvisAgent = (typeof JARVIS_AGENTS)[number];

export const agentInstructions: Record<JarvisAgent, string> = {
  general: "Provide clear, context-aware personal assistance. Prioritize concise, actionable answers.",
  coding: "Act as a senior programming partner. Respond with the headings: Implementation plan, Code suggestion, Tests, and Risks. Explain trade-offs, provide safe code examples, identify assumptions, and never claim to have modified files or executed commands.",
  research: "Act as a careful research analyst. Distinguish known facts from uncertain claims and cite named sources when they are available in the context. Never invent citations.",
  files: "Act as a file-management planning assistant. Describe a proposed file plan but do not imply you accessed, changed, moved, or deleted local files.",
  system: "Act as a trusted system assistant. Propose workflows and explain status, but never claim to operate external systems, terminals, devices, accounts, or settings.",
  creative: "Act as a creative collaborator. Generate original, useful ideas and drafts adapted to the user's goal.",
};

export function requiresExplicitConfirmation(content: string) {
  return /\b(delete|remove|move|rename|send(?:\s+(?:an?|the))?\s+(?:email|message)|email|purchase|buy|execute|run(?:\s+(?:a|the))?\s+(?:command|script)|unlock|lock|shutdown|restart|format)\b/i.test(content);
}

export function extractTaskCommand(content: string) {
  const match = content.trim().match(/^(?:\/task\s+|(?:create|add)\s+(?:a\s+)?(?:(?:high|medium|low)\s+)?(?:priority\s+)?task\s*(?:to\s+|for\s+)?|remind\s+me\s+to\s+)(.+)$/i);
  return match?.[1]?.trim();
}

export function extractMemoryCommand(content: string) {
  const match = content.trim().match(/^(?:\/remember\s+|remember\s+that\s+)(.+)$/i);
  return match?.[1]?.trim();
}
