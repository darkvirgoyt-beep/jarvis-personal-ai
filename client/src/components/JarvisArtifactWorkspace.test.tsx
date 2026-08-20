import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { JarvisArtifactWorkspace } from "./JarvisArtifactWorkspace";

describe("JarvisArtifactWorkspace", () => {
  it("renders reviewed artifact modes, staged local context, and explicit safety boundaries", () => {
    const markup = renderToStaticMarkup(<JarvisArtifactWorkspace stagedAttachments={[{ name: "brief.txt", size: 2048 }]} onDraft={vi.fn()} onOpenBuilder={vi.fn()} />);

    expect(markup).toContain("ARTIFACT STUDIO");
    expect(markup).toContain("Spreadsheet");
    expect(markup).toContain("Code change");
    expect(markup).toContain("brief.txt");
    expect(markup).toContain("DRAFT WITH JARVIS");
    expect(markup).toContain("require their own visible confirmation");
    expect(markup).toContain("DOWNLOAD BRIEF");
  });
});
