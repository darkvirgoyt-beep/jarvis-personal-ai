import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({
  trpc: (() => {
    const query = (data: unknown) => ({ data });
    const mutation = () => ({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false });
    return {
      useUtils: () => ({
        jarvis: {
          preferences: { get: { invalidate: vi.fn() } },
          memory: { list: { invalidate: vi.fn() } },
          tasks: { list: { invalidate: vi.fn() } },
        },
      }),
      jarvis: {
        preferences: {
          get: { useQuery: () => query({ personality: "balanced", speechRate: 100, privacyMode: "standard", visualMode: "hud", pluginSettings: "{}" }) },
          update: { useMutation: mutation },
        },
        memory: { list: { useQuery: () => query([]) }, update: { useMutation: mutation } },
        tasks: { list: { useQuery: () => query([]) }, create: { useMutation: mutation } },
        confirmations: { list: { useQuery: () => query([]) } },
        research: { list: { useQuery: () => query([]) } },
      },
    };
  })(),
}));

import { JarvisExtensions } from "./JarvisExtensions";

describe("JarvisExtensions control deck", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows coding output controls and the authenticated privacy-memory model control", () => {
    const markup = renderToStaticMarkup(
      <JarvisExtensions
        voiceStorageKey="jarvisVoice:test"
        onRun={vi.fn()}
        onCopyLatest={vi.fn()}
        onExportLatest={vi.fn()}
      />,
    );

    expect(markup).toContain("CODING AGENT");
    expect(markup).toContain("TypeScript");
    expect(markup).toContain("PREPARE CODE PLAN");
    expect(markup).toContain("COPY LATEST RESPONSE");
    expect(markup).toContain("DOWNLOAD LATEST PLAN");
    expect(markup).toContain("Nemotron 3 Ultra");
    expect(markup).toContain("Continuous conversation");
    expect(markup).toContain("Privacy mode");
    expect(markup).toContain("Standard private history");
    expect(markup).toContain("PRIVATE &amp; USER-CONTROLLED");
  });
});
