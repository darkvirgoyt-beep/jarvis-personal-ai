import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { routeJarvisPrompt } from "@/lib/jarvisIntentRouter";
import { JarvisCommandCenter } from "./JarvisCommandCenter";

describe("JarvisCommandCenter", () => {
  it("makes automatic build routing and the unconnected runner boundary visible", () => {
    const requestRunner = vi.fn();
    const markup = renderToStaticMarkup(<JarvisCommandCenter route={routeJarvisPrompt("Build an Android app")} activity={["Jarvis ready"]} isWorking={false} onRequestRunner={requestRunner} onOpenCompileWorkspace={vi.fn()} />);

    expect(markup).toContain("App &amp; web build");
    expect(markup).toContain("RUNNER UNCONNECTED");
    expect(markup).toContain("OPEN PAIRED COMPILE WORKER");
    expect(markup).toContain("REQUEST UBUNTU RUNNER REVIEW");
    expect(requestRunner).not.toHaveBeenCalled();
  });
});
