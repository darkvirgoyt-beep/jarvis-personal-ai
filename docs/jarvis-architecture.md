# Jarvis Architecture

Jarvis is designed as a private, authenticated command center rather than an autonomous background process. The initial release keeps the user in control: it records voice only after a direct interaction, saves conversations and memories only inside the signed-in user’s account, and presents a confirmation barrier before any operation that could affect external systems or delete data.

| Layer | First-release responsibility | Later expansion path |
|---|---|---|
| Command center | Holographic dashboard, conversation UI, activity states, typed commands, microphone controls, and voice settings | Native desktop/mobile shells, gesture controls, spatial UI |
| Voice engine | Browser recording, Whisper transcription, browser speech synthesis, continuous-mode preference | Consent-based background wake-word detection in native clients |
| Jarvis brain | Nemotron 3 Ultra through a server-side OpenRouter stream for chat, specialist-agent selection, safe plan descriptions, and structured task extraction | Configurable providers, capability-based model routing, local models |
| Agent layer | Coding, research, file, system, and creative modes; each produces bounded guidance and action proposals | Plugin-hosted tools, sandboxed execution, policy-aware planning |
| Tool safety layer | Action classification, explicit confirmation records, and disabled external controls by default | OAuth-scoped Gmail, Calendar, smart-home, device, and desktop adapters |
| Private data layer | User-scoped conversations, messages, memories, tasks, preferences, and confirmation events | Encrypted user-held keys, export/import, cloud synchronization |

## Reference Translation

The supplied video reference, [“Forget JARVIS... I Built ULTRON!”](https://youtube.com/shorts/_K9KnTC-SQc), demonstrates a central animated “core” that changes visual state in response to voice commands, device status feedback, and active-task icons. Jarvis adopts that interaction principle as an original web interface: a cyan-and-pink orbital waveform becomes calm while idle, expands and oscillates while listening, accelerates while reasoning, and forms a segmented speaking halo while speech synthesis runs. The product does not copy the source video’s name, assets, device-control claims, or amber visual identity.

## First Release Scope

The working product includes authenticated voice and text chat, a user-controlled memory and task workspace, model and voice preferences, agent routing, research/coding prompt modes, streaming-style response presentation, and action confirmations. It intentionally does not claim native operating-system control, direct device unlocking, background wake-word operation, smart-home access, Gmail/Calendar access, or offline AI until each is connected and authorized through a dedicated adapter.

Jarvis now sends its primary response requests to `nvidia/nemotron-3-ultra-550b-a55b` through OpenRouter’s server-side OpenAI-compatible endpoint with `stream: true`. The browser receives only Jarvis’s application stream; it never receives the provider key. NVIDIA describes Nemotron 3 Ultra as a 550B-parameter (55B active) model for complex agentic workflows, long-context analysis, and tool use, while OpenRouter documents SSE streaming for chat completion requests with `stream: true`. [1] [2]

### Model-selection criteria

Nemotron 3 Ultra is Jarvis’s **user-approved primary model**. The selection was verified against the authenticated OpenRouter model catalog, its exact identifier was confirmed, and its SSE response stream was exercised successfully. The choice prioritizes the user’s requested Nemotron 3 Ultra capability profile—agentic reasoning, coding, planning, tool use, and long-context work—rather than asserting a universal latency ranking. Actual response speed varies by provider capacity, routing, prompt length, reasoning mode, and network conditions. If the primary provider is unavailable, Jarvis labels the change in its application stream and uses the configured built-in fast fallback rather than silently claiming a completed response.

### Preference isolation

Jarvis preference reads accept **no user identifier** and preference updates expose only allow-listed preference values. The protected procedure always derives `userId` from the authenticated session context, so a client-supplied or forged owner identifier is removed by validation and cannot select, read, or overwrite another user’s preferences. This is covered by a dedicated router test in addition to the database-level user-scope contract tests.

## Safety Contract

Jarvis may discuss or prepare plans for actions, but it must not run destructive commands, delete files, unlock devices, send messages, make purchases, or control external systems unless the user first reviews and explicitly confirms the specific action. Browser microphone access remains managed by the browser’s own permission prompt. All server procedures use authenticated user identity and filter data by that user identifier on every read, mutation, and deletion.

## Data Model

| Entity | Key user-scoped fields | Purpose |
|---|---|---|
| Conversation | `userId`, title, timestamps | Separates independent assistant threads |
| Message | `conversationId`, `userId`, role, content, agent | Builds durable conversational context |
| Memory | `userId`, content, category, source, timestamps | Stores explicit long-term preferences and project context |
| Task | `userId`, title, notes, status, priority, dueAt | Supports direct and natural-language productivity work |
| Preference | `userId`, model, voice, speech rate, continuous mode, personality | Makes Jarvis behavior personal without exposing data across users |
| Confirmation | `userId`, action, risk level, payload, status | Leaves an auditable record of proposed and approved high-impact actions |

## Agent Boundaries

| Agent | Permitted first-release output | Confirmation requirement |
|---|---|---|
| Coding | Explain, draft, refactor, and propose code | Required before future file or terminal changes |
| Research | Produce sourced research prompts and concise findings | Required before future external publishing or data collection beyond the user’s request |
| File Management | Describe file operations and create a pending plan | Always required for deletion, moves, or writes outside Jarvis data |
| System Assistant | Create tasks, explain settings, and create pending external-control plans | Always required for external system changes |
| Creative | Produce original text, ideas, and plans | No confirmation for private generation; required for external publishing |

## References

[1] [NVIDIA: Nemotron 3 Ultra model page](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)

[2] [OpenRouter: Streaming API reference](https://openrouter.ai/docs/api-reference/streaming)
