/* @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JarvisModelSelector } from "./JarvisModelSelector";

describe("JarvisModelSelector", () => {
  it("uses the persisted Nemotron default and emits the exact selected model value", () => {
    const onChange = vi.fn();
    render(<JarvisModelSelector onChange={onChange} />);

    const selector = screen.getByLabelText("Response model") as HTMLSelectElement;
    expect(selector.value).toBe("nemotron-3-ultra");
    fireEvent.change(selector, { target: { value: "gpt-5" } });
    expect(onChange).toHaveBeenCalledWith("gpt-5");
  });
});
