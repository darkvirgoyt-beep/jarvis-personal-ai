export type JarvisMemoryCategory = "preference" | "project" | "personal" | "fact" | "note";

export type DurableMemoryCandidate = {
  content: string;
  category: JarvisMemoryCategory;
};

const compact = (value: string) => value.replace(/\s+/g, " ").trim().replace(/[.?!]+$/, "");

/**
 * Extracts only direct, user-stated facts that are useful beyond the current
 * conversation. It intentionally ignores credentials, health, finances,
 * location, short-lived requests, and ambiguous conversational content.
 */
export function extractDurableMemoryCandidate(message: string): DurableMemoryCandidate | undefined {
  const text = compact(message);
  if (!text || text.length > 420) return undefined;
  if (/\b(password|passcode|otp|one[- ]time code|api key|secret|token|credit card|bank|medical|diagnos(?:is|ed)|address|phone number)\b/i.test(text)) return undefined;

  const called = text.match(/\b(?:please\s+)?call me\s+([a-z][a-z '\-]{1,70})$/i);
  if (called) return { content: `User prefers to be called ${compact(called[1])}.`, category: "preference" };

  const preference = text.match(/\b(?:i\s+)?(?:prefer|like|love|enjoy|want)\s+(.{2,180})$/i);
  if (preference && !/\b(?:today|tonight|right now|this chat|for now|temporary)\b/i.test(preference[1])) {
    return { content: `User preference: ${compact(preference[1])}.`, category: "preference" };
  }

  const project = text.match(/\b(?:i(?:'m| am)|we(?:'re| are))\s+(?:building|working on|creating|developing)\s+(.{3,180})$/i);
  if (project) return { content: `Current project: ${compact(project[1])}.`, category: "project" };

  const durableFact = text.match(/\bmy\s+(?:role|job|occupation|primary language|timezone)\s+(?:is|:)?\s*(.{2,180})$/i);
  if (durableFact) return { content: `User fact: ${compact(durableFact[1])}.`, category: "fact" };

  return undefined;
}

export function isDuplicateDurableMemory(candidate: DurableMemoryCandidate, memories: Array<{ content: string }>): boolean {
  const canonical = candidate.content.toLocaleLowerCase();
  return memories.some((memory) => memory.content.replace(/\s+/g, " ").trim().replace(/[.?!]+$/, "").toLocaleLowerCase() === canonical.replace(/[.?!]+$/, ""));
}

export function shouldCaptureDurableMemory(input: { enabled?: number | boolean | null; privacyMode?: string | null; hasExplicitMemoryCommand?: boolean }): boolean {
  return Boolean(input.enabled) && input.privacyMode !== "minimal" && !input.hasExplicitMemoryCommand;
}
