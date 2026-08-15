import type { JarvisCoreState } from "@/components/JarvisCore";

export type JarvisVoiceState = "idle" | "recording" | "transcribing" | "unavailable";

export type JarvisInteractionState = {
  coreState: JarvisCoreState;
  voiceState: JarvisVoiceState;
  isSending: boolean;
};

export type JarvisInteractionEvent =
  | { type: "typed_submitted" }
  | { type: "recording_started" }
  | { type: "recording_stopped" }
  | { type: "transcription_started" }
  | { type: "transcription_completed" }
  | { type: "microphone_unavailable" }
  | { type: "stream_delta" }
  | { type: "stream_finished" }
  | { type: "speech_started" }
  | { type: "speech_finished" }
  | { type: "interaction_failed" };

export const initialJarvisInteractionState: JarvisInteractionState = {
  coreState: "idle",
  voiceState: "idle",
  isSending: false,
};

/**
 * Reduces only visual and request-lifecycle state. Message content and browser
 * media resources remain owned by the command center so they cannot be mutated
 * by an unrelated visual event.
 */
export function transitionJarvisInteraction(
  state: JarvisInteractionState,
  event: JarvisInteractionEvent,
): JarvisInteractionState {
  switch (event.type) {
    case "typed_submitted":
      return { ...state, coreState: "thinking", voiceState: "idle", isSending: true };
    case "recording_started":
      return { ...state, coreState: "listening", voiceState: "recording" };
    case "recording_stopped":
      return { ...state, coreState: "idle", voiceState: "idle" };
    case "transcription_started":
      return { ...state, coreState: "thinking", voiceState: "transcribing" };
    case "transcription_completed":
      return { ...state, coreState: "thinking", voiceState: "idle" };
    case "microphone_unavailable":
      return { ...state, coreState: "idle", voiceState: "unavailable" };
    case "stream_delta":
    case "speech_started":
      return { ...state, coreState: "speaking" };
    case "stream_finished":
      return { ...state, isSending: false };
    case "speech_finished":
      return { ...state, coreState: "idle" };
    case "interaction_failed":
      return { coreState: "idle", voiceState: "idle", isSending: false };
  }
}
