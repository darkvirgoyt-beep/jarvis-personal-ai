import { describe, expect, it } from "vitest";
import { initialJarvisInteractionState, transitionJarvisInteraction } from "./jarvisInteractionState";

describe("Jarvis interaction state machine", () => {
  it("moves a typed command through thinking, streaming, speaking, and idle completion", () => {
    const submitted = transitionJarvisInteraction(initialJarvisInteractionState, { type: "typed_submitted" });
    const receivingDelta = transitionJarvisInteraction(submitted, { type: "stream_delta" });
    const streamFinished = transitionJarvisInteraction(receivingDelta, { type: "stream_finished" });
    const speaking = transitionJarvisInteraction(streamFinished, { type: "speech_started" });
    const complete = transitionJarvisInteraction(speaking, { type: "speech_finished" });

    expect(submitted).toMatchObject({ coreState: "thinking", voiceState: "idle", isSending: true });
    expect(receivingDelta).toMatchObject({ coreState: "speaking", isSending: true });
    expect(streamFinished).toMatchObject({ coreState: "speaking", isSending: false });
    expect(speaking.coreState).toBe("speaking");
    expect(complete).toEqual(initialJarvisInteractionState);
  });

  it("moves a voice command through listening and transcription before the response stream begins", () => {
    const recording = transitionJarvisInteraction(initialJarvisInteractionState, { type: "recording_started" });
    const transcribing = transitionJarvisInteraction(recording, { type: "transcription_started" });
    const transcribed = transitionJarvisInteraction(transcribing, { type: "transcription_completed" });
    const submitted = transitionJarvisInteraction(transcribed, { type: "typed_submitted" });

    expect(recording).toMatchObject({ coreState: "listening", voiceState: "recording", isSending: false });
    expect(transcribing).toMatchObject({ coreState: "thinking", voiceState: "transcribing", isSending: false });
    expect(transcribed).toMatchObject({ coreState: "thinking", voiceState: "idle", isSending: false });
    expect(submitted).toMatchObject({ coreState: "thinking", voiceState: "idle", isSending: true });
  });

  it("returns to a safe idle visual state after media or stream failures", () => {
    const unavailable = transitionJarvisInteraction(initialJarvisInteractionState, { type: "microphone_unavailable" });
    const recovered = transitionJarvisInteraction(unavailable, { type: "interaction_failed" });

    expect(unavailable).toMatchObject({ coreState: "idle", voiceState: "unavailable", isSending: false });
    expect(recovered).toEqual(initialJarvisInteractionState);
  });
});
