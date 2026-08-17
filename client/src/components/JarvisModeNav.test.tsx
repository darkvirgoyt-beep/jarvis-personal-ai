// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { JarvisModeNav } from "./JarvisModeNav";

describe("JarvisModeNav", () => {
  it("exposes six separate keyboard-discoverable private workspace modes and reports pending approvals", () => {
    const onModeChange = vi.fn();
    render(<JarvisModeNav activeMode="chats" onModeChange={onModeChange} pendingApprovals={2} />);

    expect(screen.getByRole("navigation", { name: "Jarvis workspace modes" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^chats/i }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: /^memory/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^projects/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^builder/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^integrations/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /^settings/i })).toBeTruthy();
    expect(screen.getByLabelText("2 approvals waiting")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /^projects/i }));
    expect(onModeChange).toHaveBeenCalledWith("projects");
  });
});
