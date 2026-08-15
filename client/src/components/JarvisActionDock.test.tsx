/* @vitest-environment jsdom */
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JarvisActionDock } from "./JarvisActionDock";

describe("JarvisActionDock", () => {
  afterEach(cleanup);

  it("requires a recorded approval before revealing an external handoff link", async () => {
    const onPropose = vi.fn().mockResolvedValue({ id: 14 });
    const onResolve = vi.fn().mockResolvedValue({ success: true });
    render(<JarvisActionDock onPropose={onPropose} onResolve={onResolve} onActivity={vi.fn()} suggestionsEnabled={false} onSuggestionsChange={vi.fn().mockResolvedValue(undefined)} />);

    fireEvent.change(screen.getByLabelText("External action type"), { target: { value: "whatsapp" } });
    fireEvent.change(screen.getByLabelText("External action destination"), { target: { value: "+91 98765 43210 | Hello" } });
    fireEvent.click(screen.getByRole("button", { name: /prepare/i }));

    await waitFor(() => expect(onPropose).toHaveBeenCalledWith(expect.objectContaining({ action: "WhatsApp handoff", riskLevel: "medium" })));
    expect(screen.queryByRole("link", { name: /open approved destination/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /approve handoff/i }));
    await waitFor(() => expect(onResolve).toHaveBeenCalledWith({ id: 14, decision: "approved" }));
    expect(screen.getByRole("link", { name: /open approved destination/i }).getAttribute("href")).toContain("https://wa.me/919876543210?text=Hello");
  });

  it("keeps contextual suggestions off until the user explicitly opts in", async () => {
    const onSuggestionsChange = vi.fn().mockResolvedValue(undefined);
    render(<JarvisActionDock onPropose={vi.fn()} onResolve={vi.fn()} onActivity={vi.fn()} suggestionsEnabled={false} onSuggestionsChange={onSuggestionsChange} />);

    expect(screen.queryByRole("button", { name: /search local weather/i })).toBeNull();
    fireEvent.click(screen.getByLabelText("Enable contextual suggestions"));
    await waitFor(() => expect(onSuggestionsChange).toHaveBeenCalledWith(true));
  });
});
