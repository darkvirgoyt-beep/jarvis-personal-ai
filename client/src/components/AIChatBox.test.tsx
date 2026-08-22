import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: React.ReactNode }) => React.createElement("div", undefined, children),
}));

import { AIChatBox } from "./AIChatBox";

describe("AIChatBox Jarvis interaction states", () => {
  it("renders typed commands, incremental assistant output, and the streaming state", () => {
    const markup = renderToStaticMarkup(
      <AIChatBox
        messages={[
          { role: "user", content: "Create a task" },
          { role: "assistant", content: "I am preparing your" },
        ]}
        onSendMessage={vi.fn()}
        isLoading
        voiceState="idle"
        onVoiceStart={vi.fn()}
        onVoiceStop={vi.fn()}
      />,
    );

    expect(markup).toContain("Create a task");
    expect(markup).toContain("I am preparing your");
    expect(markup).toContain("animate-spin");
    expect(markup).toContain("Hold to talk to Jarvis");
  });

  it("renders the active microphone listening control distinctly", () => {
    const markup = renderToStaticMarkup(
      <AIChatBox
        messages={[]}
        onSendMessage={vi.fn()}
        voiceState="recording"
        onVoiceStart={vi.fn()}
        onVoiceStop={vi.fn()}
      />,
    );

    expect(markup).toContain("Release to send voice command");
    expect(markup).toContain("voice-command-button--recording");
  });

  it("renders a processing microphone control while a captured command is transcribing", () => {
    const markup = renderToStaticMarkup(
      <AIChatBox
        messages={[{ role: "user", content: "Summarize my private notes" }, { role: "assistant", content: "" }]}
        onSendMessage={vi.fn()}
        isLoading
        voiceState="transcribing"
        onVoiceStart={vi.fn()}
        onVoiceStop={vi.fn()}
      />,
    );

    expect(markup).toContain("Summarize my private notes");
    expect(markup).toContain("Transcribing voice command");
    expect(markup).toContain("animate-spin");
  });

  it("renders explicit work modes, browser-local staged context, and reusable assistant output controls", () => {
    const markup = renderToStaticMarkup(
      <AIChatBox
        messages={[{ role: "assistant", content: "Here is a reviewed plan." }]}
        onSendMessage={vi.fn()}
        voiceState="idle"
        activeIntent="research"
        intents={[{ id: "answer", label: "Answer", description: "Write" }, { id: "research", label: "Research", description: "Sources" }]}
        onIntentChange={vi.fn()}
        stagedAttachments={[{ name: "requirements.md", size: 2048 }]}
        onStageAttachments={vi.fn()}
        onRemoveAttachment={vi.fn()}
        onSpeakMessage={vi.fn()}
      />,
    );

    expect(markup).toContain("Research");
    expect(markup).toContain("requirements.md");
    expect(markup).toContain("Local context is staged in this browser only");
    expect(markup).toContain("Copy Jarvis response");
    expect(markup).toContain("Replay Jarvis response");
  });
});
