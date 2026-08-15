# Jarvis Verification Record

## Scope

This record summarizes the final validation performed for the authenticated Jarvis command center build, including the reference-inspired desktop and mobile interface, secure provider routing, private workspace controls, and browser-native voice features.

## Automated checks

| Check | Result | Evidence |
|---|---|---|
| Unit and contract tests | Passed | `pnpm test`: 17 test files and 41 tests passed, including live OpenRouter catalog and Nemotron stream verification. |
| Type safety | Passed | `pnpm check` completed without TypeScript errors. |
| Nemotron request and stream contract | Passed | Provider contract, keep-alive handling, incremental delta, and fallback behavior are covered by the server tests. |
| Private-data scope and denials | Passed | Router and database-scope tests cover authenticated ownership constraints and explicit cross-user mutation denial behavior. |
| Model selection contract | Passed | `shared/jarvisModels.ts` is the single source for accepted values, the Nemotron default, and selector labels. It is consumed by both client selectors, router validation, and stream routing. `jarvisModels.test.ts` validates the default and alternate boundary, while `jarvisStream.test.ts` proves a persisted `gpt-5` preference reaches the selected runtime provider rather than silently drifting to Nemotron. |
| Interaction lifecycle reducer | Passed | `client/src/lib/jarvisInteractionState.test.ts` verifies typed submission, recording, transcription, incremental stream, speech lifecycle, and recovery transitions. The command center uses this reducer for its visual/request lifecycle state. |
| Control-deck model and privacy controls | Passed | `server/jarvisRouter.test.ts` verifies privacy-mode and continuous-mode writes always use the authenticated user id, while matching memory create/update/delete calls retain the same scope. The browser-level `JarvisExtensions.interaction.test.tsx` changes the visible default Nemotron model, privacy, and continuous-conversation controls and verifies their exact persisted mutation payloads. `JarvisModelSelector.test.tsx` confirms the shared selector used in both the settings modal and main deck emits the precise selected model value. |
| Chat state rendering | Passed | `AIChatBox.test.tsx` covers typed messages, partial streamed assistant content plus loading feedback, recording controls, and the dedicated transcribing microphone state. |

## Manual visual checks

| Surface | Result | Observation |
|---|---|---|
| Desktop command center | Captured and reviewed | Full-page authenticated preview captured at **1440 × 1100**. The three-column desktop layout kept the agent rail, neural visualizer, conversation feed, system HUD, private workspace, and safety protocol visible without collisions. |
| Desktop control deck | Captured and reviewed | The final 1440 × 1100 capture showed distinct voice, task, plugin, research, coding, and memory panels, including the visible Nemotron primary-engine status plus continuous-conversation, privacy, and visual-motion controls. |
| Mobile command center | Captured and reviewed | Full-page authenticated preview captured at **390 × 844**. The layout stacked into a single column with no horizontal overflow; the command feed, microphone/send controls, status panels, and control-deck inputs, including model, privacy, and continuous-conversation controls, remained visible and reachable. |
| Voice visual states | Passed | The deterministic reducer verifies `idle → listening → transcribing → thinking → speaking → idle` lifecycle states. `JarvisCore` tests verify separate core-state rendering, while `AIChatBox` tests verify recording and transcribing microphone controls. |
| Streamed response UI | Passed | The interaction reducer verifies stream-delivery state, the chat component renders partial assistant output with loading feedback, and authenticated stream endpoint tests cover incremental event handling and fallback behavior. |

## Memory and privacy boundary

Jarvis does not expose a separate global “memory on/off” switch. Instead, every memory operation is user-scoped and the **Privacy mode** setting controls whether the streamed response receives standard private context or the reduced `minimal` context. The private workspace remains the explicit control surface for creating, reviewing, editing, and deleting memories. Router and database-scope tests verify that a forged user identity cannot read or mutate another user’s memories or preferences; the explicit privacy-memory test also verifies that no caller-supplied user id can replace the authenticated owner during a privacy preference write.

The main control deck and settings surface share the same persisted **Response model** preference and common `shared/jarvisModels.ts` selector contract. They identify **Nemotron 3 Ultra** as the default primary server-side engine and expose **Continuous conversation** alongside privacy mode. The persisted default routes to Nemotron. When a user explicitly chooses one of the server-validated alternate models, the stream uses that selection; if it is unavailable, the stream returns to Nemotron. If the default Nemotron provider is unavailable, a documented, tested `gpt-5-mini` fallback protects response continuity. The visible continuous-mode control writes only to the signed-in user’s preferences and determines whether the opt-in wake-word listener is enabled while the tab remains active.

## Browser limitations

Browser wake-word and speech playback require user permission and browser support. Jarvis intentionally uses opt-in browser microphone and `SpeechSynthesis` capabilities; it does not maintain hidden background audio capture or claim native device control. Browser voice names and sound vary by operating system and installed voices.
