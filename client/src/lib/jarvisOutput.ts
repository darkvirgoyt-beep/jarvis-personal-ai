export type JarvisOutputMessage = { role: string; content: string };

export function getLatestJarvisAssistantOutput(messages: JarvisOutputMessage[]): string | undefined {
  return [...messages].reverse().find((message) => message.role === "assistant" && message.content.trim())?.content;
}

export function buildJarvisMarkdownExport(content: string) {
  return {
    filename: "jarvis-coding-plan.md",
    mimeType: "text/markdown;charset=utf-8",
    text: content,
  } as const;
}
