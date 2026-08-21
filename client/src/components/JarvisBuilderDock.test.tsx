// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { JarvisBuilderDock } from "./JarvisBuilderDock";

describe("JarvisBuilderDock", () => {
  it("separates project planning, backend capability selection, and approval-gated blueprint staging", () => {
    const onGenerate = vi.fn();
    const onPropose = vi.fn().mockResolvedValue({ id: 9 });
    render(<JarvisBuilderDock onGenerate={onGenerate} onPropose={onPropose} onOpenWorkspace={vi.fn()} onActivity={vi.fn()} onProposeConfirmation={vi.fn().mockResolvedValue({ id: 12 })} onResolveConfirmation={vi.fn()} />);

    expect(screen.getByRole("region", { name: "Jarvis Builder" })).toBeTruthy();
    expect(screen.getByText("BUILD & COMPILE READINESS")).toBeTruthy();
    expect(screen.getByRole("button", { name: /server api/i })).toBeTruthy();
    expect(screen.getByText(/never runs generated code/i)).toBeTruthy();
    expect(screen.getByText(/GitHub connection/i)).toBeTruthy();
    expect(screen.getByLabelText("GitHub repository destination")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("What should it do?"), { target: { value: "A focused project workspace for teams." } });
    fireEvent.click(screen.getByRole("button", { name: /generate with jarvis/i }));
    expect(onGenerate).toHaveBeenCalledWith(expect.stringContaining("Product architecture"));
  });

  it("prepares a cloud runner proposal without starting a build", async () => {
    const onProposeConfirmation = vi.fn().mockResolvedValue({ id: 27 });
    const view = render(<JarvisBuilderDock onGenerate={vi.fn()} onPropose={vi.fn()} onOpenWorkspace={vi.fn()} onActivity={vi.fn()} onProposeConfirmation={onProposeConfirmation} onResolveConfirmation={vi.fn()} />);
    const panel = within(view.container);

    expect(panel.getByRole("region", { name: "Cloud build control" })).toBeTruthy();
    expect(panel.getByText("RUNNER UNCONNECTED")).toBeTruthy();
    fireEvent.click(panel.getByRole("button", { name: /android package/i }));
    fireEvent.click(panel.getByRole("button", { name: /prepare runner proposal/i }));

    await waitFor(() => expect(onProposeConfirmation).toHaveBeenCalledWith(expect.objectContaining({
      action: "Prepare Android package runner proposal",
      details: expect.stringContaining("does not install dependencies, start a build, sign an artifact, publish a release, or create a deployment"),
    })));
    expect(panel.getByText(/Prepare Android package runner/)).toBeTruthy();
  });
});
