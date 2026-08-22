// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabaseClient", () => ({
  hasSupabaseAuthConfiguration: false,
  requireSupabaseClient: vi.fn(),
}));

import { JarvisAuthDialog } from "./JarvisAuthDialog";

describe("JarvisAuthDialog mobile access flow", () => {
  it("uses a scroll-safe dialog with full-width mobile auth controls", () => {
    render(<JarvisAuthDialog open onOpenChange={vi.fn()} onAuthenticated={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("max-h-[calc(100dvh-1.5rem)]");
    expect(dialog.className).toContain("overflow-y-auto");
    expect(screen.getByRole("button", { name: "Google" }).className).toContain("w-full");
    expect(screen.getByRole("button", { name: "GitHub" }).className).toContain("w-full");
    expect(screen.getByRole("button", { name: "Sign in securely" }).className).toContain("w-full");
    expect(screen.getByRole("note").textContent).toContain("Keep me signed in on this browser");
    expect(screen.getByRole("note").textContent).toContain("never stores your password");
  });

  it("gives an accessible, actionable error when the deployment has no auth configuration", () => {
    render(<JarvisAuthDialog open onOpenChange={vi.fn()} onAuthenticated={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Sign in securely" }));

    expect(screen.getByRole("alert").textContent).toContain("not configured for this deployment yet");
  });
});
