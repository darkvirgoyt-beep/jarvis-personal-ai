/* @vitest-environment jsdom */
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { JarvisPublicLanding } from "./JarvisPublicLanding";

describe("JarvisPublicLanding", () => {
  it("offers a public, privacy-preserving sign-in entry without rendering private data", () => {
    const onStart = vi.fn();
    render(<JarvisPublicLanding onStart={onStart} />);

    expect(screen.getByRole("heading", { name: /one private place to think, build, and act with care/i })).toBeTruthy();
    expect(screen.getByText(/your chats, memory, projects, and connected actions remain private after sign-in/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /create your private workspace/i }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
