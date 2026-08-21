import { describe, expect, it } from "vitest";
import { routeJarvisPrompt } from "./jarvisIntentRouter";

describe("routeJarvisPrompt", () => {
  it("routes ordinary app-building language to the reviewed build workflow", () => {
    const route = routeJarvisPrompt("Build a mobile web app for my study plan");
    expect(route.intent).toBe("builder");
    expect(route.agent).toBe("Coding");
    expect(route.needsRunner).toBe(true);
  });

  it("prioritizes a Kali request as an approval-gated environment handoff", () => {
    const route = routeJarvisPrompt("Use a Kali Linux sandbox to investigate this security log");
    expect(route.intent).toBe("environment");
    expect(route.runnerProfile).toBe("kali");
    expect(route.agent).toBe("System");
  });

  it("routes debugging and visual requests without asking the user to choose a mode", () => {
    expect(routeJarvisPrompt("Debug this failing stack trace").intent).toBe("debug");
    expect(routeJarvisPrompt("Create a neon logo for my app").intent).toBe("image");
  });

  it("keeps normal conversation in the general assistant workflow", () => {
    const route = routeJarvisPrompt("Help me plan my day");
    expect(route.intent).toBe("answer");
    expect(route.agent).toBe("General");
  });
});
