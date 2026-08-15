/* @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const updatePreferences = vi.fn().mockResolvedValue(undefined);
const invalidatePreferences = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      jarvis: {
        preferences: { get: { invalidate: invalidatePreferences } },
        memory: { list: { invalidate: vi.fn() } },
        tasks: { list: { invalidate: vi.fn() } },
      },
    }),
    jarvis: {
      preferences: {
        get: { useQuery: () => ({ data: { model: "nemotron-3-ultra", personality: "balanced", speechRate: 100, privacyMode: "standard", continuousMode: 0, visualMode: "hud", pluginSettings: "{}" } }) },
        update: { useMutation: () => ({ mutateAsync: updatePreferences, isPending: false }) },
      },
      memory: { list: { useQuery: () => ({ data: [] }) }, update: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } },
      tasks: { list: { useQuery: () => ({ data: [] }) }, create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } },
      confirmations: { list: { useQuery: () => ({ data: [] }) } },
      research: { list: { useQuery: () => ({ data: [] }) } },
    },
  },
}));

import { JarvisExtensions } from "./JarvisExtensions";

describe("JarvisExtensions persisted preference controls", () => {
  afterEach(() => {
    updatePreferences.mockClear();
    invalidatePreferences.mockClear();
  });

  it("sends model, privacy, and continuous-mode changes through the authenticated preferences mutation", async () => {
    render(<JarvisExtensions voiceStorageKey="jarvisVoice:test" onRun={vi.fn()} onCopyLatest={vi.fn()} onExportLatest={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Response model"), { target: { value: "nemotron-3-ultra" } });
    fireEvent.change(screen.getByLabelText("Privacy mode"), { target: { value: "minimal" } });
    fireEvent.click(screen.getByLabelText("Continuous conversation"));

    await waitFor(() => {
      expect(updatePreferences).toHaveBeenCalledWith({ model: "nemotron-3-ultra" });
      expect(updatePreferences).toHaveBeenCalledWith({ privacyMode: "minimal" });
      expect(updatePreferences).toHaveBeenCalledWith({ continuousMode: true });
    });
    await waitFor(() => expect(invalidatePreferences).toHaveBeenCalled());
  });
});
