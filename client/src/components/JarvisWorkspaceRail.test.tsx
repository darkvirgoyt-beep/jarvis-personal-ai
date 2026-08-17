/* @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { JarvisWorkspaceRail } from "./JarvisWorkspaceRail";

describe("JarvisWorkspaceRail", () => {
  it("keeps private recent chats and workspace destinations discoverable", () => {
    const onModeChange = vi.fn();
    const onNewChat = vi.fn();
    const onSelectConversation = vi.fn();
    const onToggleStar = vi.fn();
    render(<JarvisWorkspaceRail activeMode="chats" conversations={[{ id: 12, title: "Kernel refactor" }, { id: 13, title: "Voice prototype", starredAt: new Date("2026-08-17") }]} mobileOpen={false} onCloseMobile={vi.fn()} onModeChange={onModeChange} onNewChat={onNewChat} onSelectConversation={onSelectConversation} onToggleStar={onToggleStar} pendingApprovals={1} userName="Prince" />);

    expect(screen.getAllByText("Kernel refactor").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Prince").length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByRole("button", { name: /^new chat$/i })[0]);
    expect(onNewChat).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getAllByRole("button", { name: /kernel refactor/i })[0]);
    expect(onSelectConversation).toHaveBeenCalledWith(12);
    expect(onModeChange).toHaveBeenCalledWith("chats");
    fireEvent.click(screen.getAllByRole("button", { name: /remove voice prototype from starred chats/i })[0]);
    expect(onToggleStar).toHaveBeenCalledWith(13, false);
    fireEvent.change(screen.getAllByRole("textbox", { name: /search private chats/i })[0], { target: { value: "voice" } });
    expect(screen.queryByText("Kernel refactor")).toBeNull();
  });
});
