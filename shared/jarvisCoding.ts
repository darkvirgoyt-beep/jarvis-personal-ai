export function buildJarvisCodingPrompt(language: string, brief: string): string {
  return [
    `Act as a senior ${language} coding assistant.`,
    brief.trim(),
    "Return these exact sections: Implementation plan, Safe code suggestions, Tests, and Risks.",
    "Do not execute commands or modify files.",
  ].join(" ");
}
