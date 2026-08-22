/**
 * Converts rendered assistant Markdown into short, natural text suitable for
 * browser speech synthesis. Written content remains unchanged in the chat;
 * only the spoken version is normalized.
 */
export function normalizeJarvisSpeechText(markdown: string): string {
  const withoutCode = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/```[\s\S]*$/g, " ")
    .replace(/`[^`]*`/g, " ");

  const normalized = withoutCode
    // Preserve human-readable link/image labels but never read raw URLs.
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<https?:\/\/[^>\s]+>/g, " ")
    .replace(/\bhttps?:\/\/[^\s<>()]+/g, " ")
    // Remove Markdown layout syntax while retaining the authored words.
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*(?:[-+*•]|\d+[.)])\s+/gm, ". ")
    .replace(/^\s*(?:[-:|]\s*){3,}$/gm, ". ")
    .replace(/^\s*\|\s*/gm, "")
    .replace(/\s*\|\s*$/gm, ". ")
    .replace(/\s+\|\s+/g, "; ")
    .replace(/(\*\*|__|~~)/g, "")
    .replace(/(?<!\w)[*_](?!\w)/g, "")
    // Translate the most common display-math punctuation into readable words.
    .replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, "$1 over $2")
    .replace(/\\sqrt\s*\{([^}]*)\}/g, "square root of $1")
    .replace(/\\(?:times|cdot)\b/g, " times ")
    .replace(/\\div\b/g, " divided by ")
    .replace(/\\(?:left|right|text|mathrm|mathbf)\b/g, " ")
    .replace(/\\[()[\]]/g, " ")
    .replace(/[$\\{}]/g, " ")
    // HTML is visual markup, not something Jarvis should pronounce.
    .replace(/<[^>]*>/g, " ")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n+/g, " ")
    .replace(/\s*([.?!;:])\s*/g, "$1 ")
    .replace(/(?:\.\s*){2,}/g, ". ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s.,;:—–-]+/, "")
    .trim();

  return normalized;
}
