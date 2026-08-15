// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { JarvisModeNav } from "./JarvisModeNav";

describe("JarvisModeNav", () => {
  it("exposes the four separate keyboard-discoverable workspace modes and reports pending approvals", () => {
    const onModeChange = vi.fn();
    render(<JarvisModeNav activeMode="command" onModeChange={onModeChange} pendingApprovals={2} />);

    expect(screen.getByRole("navigation", { name: "Jarvis workspace modes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /command center/i }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: /conversations/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /private workspace/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^settings/i })).toBeTruthy();
    expect(screen.getByLabelText("2 approvals waiting")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /private workspace/i }));
    expect(onModeChange).toHaveBeenCalledWith("workspace");
  });
});
