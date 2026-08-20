import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { JarvisResearchDesk } from "./JarvisResearchDesk";

describe("JarvisResearchDesk", () => {
  it("renders a source-linked research contract without claiming autonomous browsing", () => {
    const markup = renderToStaticMarkup(<JarvisResearchDesk mode="research" onSendBrief={vi.fn()} />);
    expect(markup).toContain("SOURCE-LINKED RESEARCH");
    expect(markup).toContain("PREPARE RESEARCH BRIEF");
    expect(markup).toContain("Links are proposed for review");
  });

  it("renders local numeric-analysis controls", () => {
    const markup = renderToStaticMarkup(<JarvisResearchDesk mode="data" onSendBrief={vi.fn()} />);
    expect(markup).toContain("LOCAL DATA DESK");
    expect(markup).toContain("ANALYZE WITH JARVIS");
    expect(markup).toContain("calculated in this browser");
  });
});
