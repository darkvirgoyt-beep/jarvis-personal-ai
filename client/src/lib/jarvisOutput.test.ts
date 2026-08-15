import { describe, expect, it } from "vitest";
import { buildJarvisMarkdownExport, getLatestJarvisAssistantOutput } from "./jarvisOutput";

describe("Jarvis coding output helpers", () => {
  it("selects the latest non-empty assistant output for safe copy and export", () => {
    expect(getLatestJarvisAssistantOutput([
      { role: "assistant", content: "Older plan" },
      { role: "user", content: "Refine it" },
      { role: "assistant", content: "Latest plan" },
    ])).toBe("Latest plan");
  });

  it("creates a Markdown-only download contract", () => {
    expect(buildJarvisMarkdownExport("# Plan")).toEqual({
      filename: "jarvis-coding-plan.md",
      mimeType: "text/markdown;charset=utf-8",
      text: "# Plan",
    });
  });
});
