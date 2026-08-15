# Jarvis Mobile Capability and Safety Boundaries

Jarvis is a private assistant that can propose and prepare user-requested actions. It does not bypass operating-system protections, silently communicate with other people, unlock devices, read data from other apps, or claim that an external action happened without an explicit user-approved handoff.

## Capability Matrix

| Capability | Browser command center | Planned Android companion | Jarvis safety boundary |
|---|---|---|---|
| Voice commands | Push-to-talk and opt-in wake-word-ready interface | Included companion source: native push-to-talk with runtime permission | The microphone is activated only by a visible user action; no background wake word is enabled in the companion. |
| Spoken replies | Local browser speech synthesis | Device text-to-speech | A warm feminine installed voice is preferred locally; users can select a different voice or turn speech off. |
| Current location | Browser geolocation after a user click | Included companion source: foreground location permission | Location is requested only on demand for a map proposal, not continuously tracked, and is not persisted. |
| Nearby places and maps | Location can prepare a map-search or directions link | Native map intent or installed maps app | Jarvis shows the destination first and requires approval before opening the external map. |
| Web search | Jarvis prepares a search link | Native browser or custom tab handoff | Jarvis requires approval before external navigation. |
| Calls and messages | A browser can prepare, but not silently place, a handoff | Included companion source: confirmation-gated `tel:` and `sms:` handoffs subject to OS and app rules | Jarvis displays the target and requires approval. The operating system and destination app remain responsible for final sending or dialing. |
| WhatsApp and Instagram | Link handoff only where the destination supports it | Intent/deep-link handoff only where the destination supports it | Jarvis does not read private app content, automate protected UI, or silently transmit content. |
| Device unlocking | Not available | Not available for Jarvis bypass | Lock-screen and biometric/device authentication always remain under the operating system’s control. |

> **Approval rule:** A voice command can propose an external action. Jarvis must identify the target and obtain an explicit approval immediately before opening a map, search, call, message, or app destination.

## Privacy Defaults

Location is treated as transient command context. Jarvis requests it through the browser or device permission prompt only after the user activates a nearby-place or directions action. The resulting coordinates are kept in memory for the current action only, unless the user explicitly decides to save a named location in their private workspace. Contextual suggestions are opt-in and must describe the signal used, such as a manually requested location category or the current task list.

## Android-First Companion Contract

The repository includes an Android-first Expo companion source under `mobile/`. It authenticates to the existing Jarvis backend using an opaque, one-time, verifier-bound pairing code and retains the exchanged short-lived session only in secure device storage. It never embeds `OPENROUTER_API_KEY`, database credentials, session-signing secrets, or GitHub credentials. Native capabilities remain behind runtime permissions, confirmation sheets, and Android’s intent resolver. Android documents common implicit intents for maps, phone, web search, and text messaging; Jarvis uses those user-visible handoffs rather than direct, unattended execution. [2] The source is release-ready for a connected managed Android build service, but it is not itself a signed APK, a published store app, or a device-unlock capability. See [`android-companion.md`](./android-companion.md) for the handoff and pairing protocol.

## Optional Isolated Virtual Computer

Jarvis’s browser **Private workspace** is already a user-scoped, approval-gated storage workspace; it is not a general-purpose operating system and cannot access a personal phone or computer. A separate Cloud Computer may later supply an isolated, persistent Ubuntu environment for approved coding, browser research, and workspace automation. It must be created or attached by the owner, authenticated separately, and kept distinct from the Jarvis web runtime. No operation should be enabled until the owner approves the precise workspace or command scope.

The virtual computer begins as a Linux environment rather than an unlocked imitation of the owner’s device. It must not be used to bypass lock screens, obtain credentials, access another app’s private content, or run unattended actions outside a configured approval policy. Secrets remain in the secure server-side environment or the connected service’s own permission store rather than in project files or client code.

## Technical References

The browser Geolocation API requires permission and can be invoked with `getCurrentPosition()` after a user request. Android common intents are the appropriate pattern for asking another installed application to view a map, dial a number, or compose a message. [1] [2]

## References

[1] [MDN Web Docs — Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

[2] [Android Developers — Common intents](https://developer.android.com/guide/components/intents-common)
