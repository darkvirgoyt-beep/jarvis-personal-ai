import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JarvisCore } from "./JarvisCore";

describe("JarvisCore", () => {
  it.each([
    ["idle", "STANDING BY", "jarvis-core--idle"],
    ["listening", "LISTENING", "jarvis-core--listening"],
    ["thinking", "REASONING", "jarvis-core--thinking"],
    ["speaking", "SPEAKING", "jarvis-core--speaking"],
  ] as const)("renders a distinct %s visual state", (state, label, className) => {
    const markup = renderToStaticMarkup(<JarvisCore state={state} />);
    expect(markup).toContain(label);
    expect(markup).toContain(className);
    expect(markup).toContain("jarvis-core__waveform");
  });
});
