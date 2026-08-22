import { describe, expect, it } from "vitest";
import { extractDurableMemoryCandidate, isDuplicateDurableMemory, shouldCaptureDurableMemory } from "./jarvisDurableMemory";

describe("Jarvis durable memory rules", () => {
  it("extracts direct durable preferences and project facts only", () => {
    expect(extractDurableMemoryCandidate("I prefer concise answers.")).toEqual({ content: "User preference: concise answers.", category: "preference" });
    expect(extractDurableMemoryCandidate("We are building a private Android planner.")).toEqual({ content: "Current project: a private Android planner.", category: "project" });
  });

  it("rejects sensitive or temporary material", () => {
    expect(extractDurableMemoryCandidate("My password is dragon-42")).toBeUndefined();
    expect(extractDurableMemoryCandidate("I want a quick answer for today")).toBeUndefined();
  });

  it("requires opt-in, respects minimal privacy mode, and prevents exact duplicates", () => {
    expect(shouldCaptureDurableMemory({ enabled: 1, privacyMode: "standard" })).toBe(true);
    expect(shouldCaptureDurableMemory({ enabled: 0, privacyMode: "standard" })).toBe(false);
    expect(shouldCaptureDurableMemory({ enabled: 1, privacyMode: "minimal" })).toBe(false);
    expect(isDuplicateDurableMemory({ content: "User preference: concise answers.", category: "preference" }, [{ content: "User preference: concise answers" }])).toBe(true);
  });
});
