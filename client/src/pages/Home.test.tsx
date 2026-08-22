/* @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const updatePreferences = vi.fn().mockResolvedValue(undefined);
const invalidatePreferences = vi.fn();
const invalidateAuth = vi.fn();
const queryResult = { data: [] as never[] };
const mutationResult = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false };

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 1, name: "Jarvis owner" } }) }));
vi.mock("@/const", () => ({ startLogin: vi.fn(), JARVIS_OPEN_AUTH_EVENT: "jarvis:open-auth" }));
vi.mock("@/lib/jarvisApi", () => ({ streamJarvisResponse: vi.fn(), transcribeJarvisAudio: vi.fn() }));
vi.mock("@/lib/jarvisOutput", () => ({ buildJarvisMarkdownExport: vi.fn(), getLatestJarvisAssistantOutput: vi.fn() }));
vi.mock("@/components/AIChatBox", () => ({ AIChatBox: () => <div /> }));
vi.mock("@/components/HudPanel", () => ({ HudPanel: ({ children }: { children: React.ReactNode }) => <section>{children}</section> }));
vi.mock("@/components/JarvisCore", () => ({ JarvisCore: () => <div /> }));
vi.mock("@/components/JarvisExtensions", () => ({ JarvisExtensions: () => <div /> }));
vi.mock("@/components/WakeWordListener", () => ({ WakeWordListener: () => <div /> }));
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: new Proxy({}, { get: (_, tag) => ({ children, ...props }: { children?: React.ReactNode }) => React.createElement(tag as string, props, children) }),
}));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      auth: { me: { invalidate: invalidateAuth } },
      jarvis: {
        preferences: { get: { invalidate: invalidatePreferences } },
        memory: { list: { invalidate: vi.fn() } },
        tasks: { list: { invalidate: vi.fn() } },
        confirmations: { list: { invalidate: vi.fn() } },
        workspace: { list: { invalidate: vi.fn() } },
        conversations: { list: { invalidate: vi.fn() }, messages: { invalidate: vi.fn() } },
      },
    }),
    jarvis: {
      tasks: { list: { useQuery: () => queryResult }, create: { useMutation: () => mutationResult }, update: { useMutation: () => mutationResult } },
      memory: { list: { useQuery: () => queryResult }, create: { useMutation: () => mutationResult }, update: { useMutation: () => mutationResult }, delete: { useMutation: () => mutationResult } },
      confirmations: { list: { useQuery: () => queryResult }, propose: { useMutation: () => mutationResult }, resolve: { useMutation: () => mutationResult } },
      workspace: { list: { useQuery: () => queryResult }, propose: { useMutation: () => mutationResult }, execute: { useMutation: () => mutationResult } },
      preferences: {
        get: { useQuery: () => ({ data: { model: "nemotron-3-ultra", voiceEnabled: 1, continuousMode: 0, personality: "balanced" } }) },
        update: { useMutation: () => ({ mutateAsync: updatePreferences, isPending: false }) },
      },
      conversations: { list: { useQuery: () => queryResult }, messages: { useQuery: () => queryResult }, star: { useMutation: () => mutationResult } },
    },
  },
}));

import Home from "./Home";

describe("Home settings model preference", () => {
  afterEach(() => {
    updatePreferences.mockClear();
    invalidatePreferences.mockClear();
    invalidateAuth.mockClear();
    window.history.replaceState({}, "", "/");
  });

  it("opens settings and persists the exact selected shared-contract model", async () => {
    render(<Home />);
    fireEvent.click(screen.getByLabelText("Open Jarvis settings"));
    fireEvent.change(screen.getByLabelText("Response model"), { target: { value: "gpt-5" } });

    await waitFor(() => expect(updatePreferences).toHaveBeenCalledWith({ model: "gpt-5" }));
    await waitFor(() => expect(invalidatePreferences).toHaveBeenCalled());
  });

  it("refreshes the authenticated identity and removes the Supabase completion marker", async () => {
    window.history.replaceState({}, "", "/?auth=complete");
    render(<Home />);

    await waitFor(() => expect(invalidateAuth).toHaveBeenCalled());
    expect(window.location.search).toBe("");
  });
});
