// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { JarvisBuilderDock } from "./JarvisBuilderDock";

describe("JarvisBuilderDock", () => {
  it("separates project planning, backend capability selection, and approval-gated blueprint staging", () => {
    const onGenerate = vi.fn();
    const onPropose = vi.fn().mockResolvedValue({ id: 9 });
    render(<JarvisBuilderDock onGenerate={onGenerate} onPropose={onPropose} onOpenWorkspace={vi.fn()} onActivity={vi.fn()} />);

    expect(screen.getByRole("region", { name: "Jarvis Builder" })).toBeTruthy();
    expect(screen.getByText("COMPILE READINESS")).toBeTruthy();
    expect(screen.getByRole("button", { name: /server api/i })).toBeTruthy();
    expect(screen.getByText(/never runs generated code/i)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("What should it do?"), { target: { value: "A focused project workspace for teams." } });
    fireEvent.click(screen.getByRole("button", { name: /generate with jarvis/i }));
    expect(onGenerate).toHaveBeenCalledWith(expect.stringContaining("Product architecture"));
  });
});
