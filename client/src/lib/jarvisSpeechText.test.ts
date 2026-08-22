import { describe, expect, it } from "vitest";
import { normalizeJarvisSpeechText } from "./jarvisSpeechText";

describe("Jarvis speech text normalization", () => {
  it("keeps natural prose while removing Markdown, URLs, and code syntax", () => {
    const spoken = normalizeJarvisSpeechText(`
# Deployment brief

**Status:** ready. Visit [the control panel](https://example.com/control).

- Run \`pnpm build\`
- Review ~~unnecessary~~ code

\`\`\`ts
const secret = "do not read";
\`\`\`

Formula: $\\frac{a}{b} \\times \\sqrt{9}$.
`);

    expect(spoken).toContain("Deployment brief");
    expect(spoken).toContain("Status: ready. Visit the control panel.");
    expect(spoken).toContain("Run.");
    expect(spoken).toContain("Review unnecessary code.");
    expect(spoken).toContain("Formula: a over b times square root of 9.");
    expect(spoken).not.toMatch(/[\[*`#]/);
    expect(spoken).not.toContain("https://");
    expect(spoken).not.toContain("pnpm build");
    expect(spoken).not.toContain("const secret");
  });

  it("leaves ordinary prose readable and removes raw HTML tags", () => {
    expect(normalizeJarvisSpeechText("Hello, <strong>Commander</strong>. Ready when you are.")).toBe("Hello, Commander. Ready when you are.");
  });
});
