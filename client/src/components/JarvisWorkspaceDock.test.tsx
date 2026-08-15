/* @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JarvisWorkspaceDock } from "./JarvisWorkspaceDock";

afterEach(cleanup);

describe("JarvisWorkspaceDock", () => {
  it("labels itself as a managed isolated workspace and exposes folder, file, and code operations", () => {
    render(<JarvisWorkspaceDock items={[]} onPropose={vi.fn()} onExecute={vi.fn()} onReject={vi.fn()} onActivity={vi.fn()} />);

    expect(screen.getByText("Private files, folders, and code")).toBeTruthy();
    expect(screen.getByText(/not your phone or computer/i)).toBeTruthy();
    expect(screen.getByText("ISOLATED")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Create folder" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Create text file" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Write code file" })).toBeTruthy();
  });

  it("requires an explicit review and approval before a private workspace write executes", async () => {
    const onPropose = vi.fn().mockResolvedValue({ id: 41 });
    const onExecute = vi.fn().mockResolvedValue({ id: 1 });
    render(<JarvisWorkspaceDock items={[]} onPropose={onPropose} onExecute={onExecute} onReject={vi.fn().mockResolvedValue(undefined)} onActivity={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Workspace path"), { target: { value: "projects/jarvis/README.md" } });
    fireEvent.click(screen.getByText("PREPARE WRITE"));
    await waitFor(() => expect(onPropose).toHaveBeenCalledWith(expect.objectContaining({ operation: "code", path: "projects/jarvis/README.md" })));
    expect(onExecute).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("APPROVE & CREATE"));
    await waitFor(() => expect(onExecute).toHaveBeenCalledWith({ confirmationId: 41 }));
  });

  it.each([
    { operation: "file", path: "notes/brief.md", contentVisible: true },
    { operation: "folder", path: "projects/jarvis", contentVisible: false },
  ])("prepares and approves a private $operation creation separately from code writes", async ({ operation, path, contentVisible }) => {
    const onPropose = vi.fn().mockResolvedValue({ id: 52 });
    const onExecute = vi.fn().mockResolvedValue({ id: 2 });
    render(<JarvisWorkspaceDock items={[]} onPropose={onPropose} onExecute={onExecute} onReject={vi.fn().mockResolvedValue(undefined)} onActivity={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Workspace operation"), { target: { value: operation } });
    fireEvent.change(screen.getByLabelText("Workspace path"), { target: { value: path } });
    expect(Boolean(screen.queryByLabelText("Workspace file content"))).toBe(contentVisible);
    fireEvent.click(screen.getByText("PREPARE WRITE"));
    await waitFor(() => expect(onPropose).toHaveBeenCalledWith(expect.objectContaining({ operation, path })));
    expect(onExecute).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("APPROVE & CREATE"));
    await waitFor(() => expect(onExecute).toHaveBeenCalledWith({ confirmationId: 52 }));
  });
});
