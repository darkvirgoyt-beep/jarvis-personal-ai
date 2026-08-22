/* @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JarvisMemoryDashboard } from "./JarvisMemoryDashboard";

const memories = [
  { id: 1, content: "Prefers concise project updates", category: "preference" as const, source: "auto" },
  { id: 2, content: "Jarvis workspace redesign", category: "project" as const, source: "manual" },
];

describe("JarvisMemoryDashboard", () => {
  it("filters private records and exposes category, deletion, and durable-memory controls", () => {
    const onDelete = vi.fn();
    const onUpdateCategory = vi.fn();
    const onDurableMemoryChange = vi.fn();
    render(<JarvisMemoryDashboard memories={memories} durableMemoryEnabled={false} onDurableMemoryChange={onDurableMemoryChange} onCreate={vi.fn()} onDelete={onDelete} onUpdateCategory={onUpdateCategory} />);

    expect(screen.getByText("Prefers concise project updates")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Filter memories by category"), { target: { value: "project" } });
    expect(screen.queryByText("Prefers concise project updates")).toBeNull();
    expect(screen.getByText("Jarvis workspace redesign")).toBeTruthy();
    fireEvent.click(screen.getByRole("switch"));
    expect(onDurableMemoryChange).toHaveBeenCalledWith(true);
    fireEvent.change(screen.getByLabelText("Category for memory 2"), { target: { value: "fact" } });
    expect(onUpdateCategory).toHaveBeenCalledWith(memories[1], "fact");
    fireEvent.click(screen.getByLabelText("Delete memory 2"));
    expect(onDelete).toHaveBeenCalledWith(2);
  });
});
