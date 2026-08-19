// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const createProject = vi.fn().mockResolvedValue({ id: 42, name: "Private agent lab" });
const invalidate = vi.fn().mockResolvedValue(undefined);

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { name: "Ada", email: "ada@example.test" }, loading: false }),
}));

vi.mock("@/components/JarvisAuthDialog", () => ({
  JarvisAuthDialog: () => null,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      auth: { me: { invalidate } },
      virgoyt: {
        projects: { list: { invalidate } },
        runs: { list: { invalidate } },
        plans: { list: { invalidate } },
        proposals: { list: { invalidate } },
        audit: { list: { invalidate } },
        runners: { list: { invalidate } },
        providers: { list: { invalidate } },
      },
    }),
    virgoyt: {
      catalog: { useQuery: () => ({ data: { agents: [{ id: "coding", name: "Coding", description: "Plans code work." }] } }) },
      projects: {
        list: { useQuery: () => ({ data: [] }) },
        create: { useMutation: () => ({ mutateAsync: createProject, isPending: false }) },
      },
      runs: {
        list: { useQuery: () => ({ data: [] }) },
        create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      },
      plans: {
        list: { useQuery: () => ({ data: [] }) },
        create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      },
      proposals: {
        list: { useQuery: () => ({ data: [] }) },
        create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
        resolve: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      },
      audit: { list: { useQuery: () => ({ data: [] }) } },
      providers: {
        list: { useQuery: () => ({ data: [] }) },
        routing: { useQuery: () => ({ data: [] }) },
        credentialVault: { useQuery: () => ({ data: { configured: false } }) },
        create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
        configureCredential: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      },
      runners: {
        list: { useQuery: () => ({ data: [] }) },
        register: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      },
    },
  },
}));

import VirgoYTAgent from "./VirgoYTAgent";

describe("VirgoYTAgent", () => {
  afterEach(() => {
    cleanup();
    createProject.mockClear();
  });

  it("renders the private multi-area workspace and makes tool use approval-first", () => {
    render(<VirgoYTAgent />);

    expect(screen.getByRole("navigation", { name: "VirgoYT workspace areas" })).toBeTruthy();
    for (const label of ["Chat", "Projects", "Files", "Terminal", "Agents", "Settings"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
    expect(screen.getByText("Chat").className).not.toContain("hidden");
    expect(screen.getByRole("button", { name: "Chat" }).className).toContain("justify-start");

    fireEvent.click(screen.getByRole("button", { name: "Files" }));
    expect(screen.getByText("Files are proposed, never silently changed.")).toBeTruthy();
    expect(screen.getByText(/Approval records intent only; no local or remote tool is invoked/)).toBeTruthy();
  });

  it("creates a user-scoped project before allowing an agent run", async () => {
    render(<VirgoYTAgent />);
    fireEvent.click(screen.getByRole("button", { name: "Projects" }));
    fireEvent.change(screen.getByPlaceholderText("Project name"), { target: { value: "Private agent lab" } });
    fireEvent.click(screen.getByRole("button", { name: "Create project" }));

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledWith({
        name: "Private agent lab",
        description: null,
        defaultAgent: "coding",
      });
    });
    expect(screen.getByText("Private project “Private agent lab” created.")).toBeTruthy();
  });
});
