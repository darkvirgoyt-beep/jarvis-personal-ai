# Run Jarvis Locally

This guide explains how to clone, configure, and run **Jarvis Personal AI** from the GitHub repository. The repository intentionally excludes all credentials. You must create your own local environment file before starting the application.

> **Security requirement:** Keep `OPENROUTER_API_KEY`, `DATABASE_URL`, and `JWT_SECRET` private. Do not paste them into source code, client-side variables, issues, or commits. Jarvis uses the Nemotron provider only from its server code so the browser never receives the API key.

## Prerequisites

| Requirement | Recommended version | Purpose |
|---|---:|---|
| Node.js | 22 or later | Runs the React, Express, and TypeScript application |
| pnpm | 10 or later | Installs project dependencies and runs scripts |
| MySQL-compatible database | MySQL 8 or TiDB | Stores private users, conversations, memories, tasks, preferences, and confirmation records |
| OpenRouter account | API access enabled | Provides the server-side Nemotron 3 Ultra response stream |
| Browser microphone permission | Chrome/Edge recommended | Enables push-to-talk voice recording and transcription |

## Installation

Clone the repository, install dependencies, and create a local environment file.

```bash
git clone https://github.com/darkvirgoyt-beep/jarvis-personal-ai.git
cd jarvis-personal-ai
pnpm install
```

Create a local `.env` file using the template in [environment-template.txt](./environment-template.txt), then replace every placeholder with your own value. `OPENROUTER_API_KEY` is required for the primary **Nemotron 3 Ultra** stream. Set `DATABASE_URL` and `JWT_SECRET` before using authenticated workspace features.

| Environment variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | Yes | Server-side provider credential for `nvidia/nemotron-3-ultra-550b-a55b` |
| `DATABASE_URL` | Yes | MySQL/TiDB connection string used by the private workspace |
| `JWT_SECRET` | Yes | Long random secret that signs user sessions |
| `VITE_APP_ID` | For Manus login | Manus OAuth application identifier |
| `OAUTH_SERVER_URL` | For Manus login | OAuth service base URL |
| `VITE_OAUTH_PORTAL_URL` | For Manus login | OAuth portal URL |

## Database Setup

Create a fresh database, enter its connection string in `DATABASE_URL`, then generate and apply migrations. The project uses Drizzle migrations committed under `drizzle/`.

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

In the managed Jarvis environment, schema changes are applied through the project database workflow instead. For a local copy, follow your database provider’s connection and TLS requirements.

## Start Development

Run the development server and open the local address printed by the command.

```bash
pnpm dev
```

Jarvis supports typed commands, push-to-talk microphone recording, speech transcription, browser text-to-speech, streamed assistant replies, specialist-agent modes, private memories and tasks, and confirmation gates. Browser wake-word functionality is intentionally opt-in and subject to browser microphone permissions; it does not run as a hidden background process.

## Browser Voice Behavior

Jarvis uses the browser's built-in `SpeechSynthesis` engine for spoken responses. By default, Jarvis prefers a warm feminine English voice when one is installed locally, then falls back to another local English voice. You can explicitly choose a different installed browser voice in the **Control Deck**, adjust speed, or disable spoken responses. The selected browser voice is stored as a private Jarvis preference, while the response personality adjusts speech rate and pitch. Voice availability and exact sound vary by browser, operating system, and installed system voices; this build does not send response audio to a third-party text-to-speech service.

## Validate Before You Change or Deploy

Run the test suite and the TypeScript validation command before opening a pull request or publishing a change.

```bash
pnpm test
pnpm check
pnpm build
```

The test suite covers the private route scope, cross-user denial behavior, confirmation gates, command parsing, Nemotron request contract, provider fallback, and streamed response behavior.

## Nemotron Configuration

Jarvis’s primary model is fixed on the server to:

```text
nvidia/nemotron-3-ultra-550b-a55b
```

The server requests streamed provider output and relays only application-safe events to the browser. If the primary provider is unavailable, Jarvis uses the configured built-in fallback and identifies that state in the assistant stream. Do not move the API key into any `VITE_*` variable: such variables can be exposed to the browser bundle.

## GitHub Workflow

Create a branch for each change, run validation locally, then open a pull request.

```bash
git checkout -b feature/your-change
# make changes
pnpm test && pnpm check
git add .
git commit -m "Describe your change"
git push -u origin feature/your-change
```

Before committing, use `git status` and confirm that `.env`, credentials, databases, logs, and build output are not staged. The included `.gitignore` already excludes these files.

## Mobile Companion Roadmap

The repository currently contains the deployed **web command center**. The Android-first Jarvis companion is a planned next module; it is not represented as a complete Android app in the current source tree. When added, it should live in a dedicated `mobile/` workspace and reuse the same authenticated server APIs rather than copy provider keys, database credentials, or business logic into a mobile client.

| Capability | Current web command center | Android companion direction |
|---|---|---|
| Voice commands and spoken replies | Push-to-talk, browser transcription, local browser speech voices | Native microphone and device TTS, subject to device permission |
| Location and maps | To be added with browser permission and explicit user action | Permission-based location and native mapping handoff |
| Web search and suggestions | To be added as a confirmation-gated assistant action | Native app interface backed by the same authenticated Jarvis API |
| Calls, messaging, WhatsApp, Instagram | Not available as direct automation | Confirmed deep-link or intent handoff only where Android and the destination app permit it |
| Device unlocking | Not available | Never bypassed; Android lock screen and biometric/device authentication remain in control |

### Recommended Android Module Setup

After the mobile companion is introduced, create a feature branch and add an Expo/React Native workspace. Keep server secrets only in the backend deployment environment. The mobile app should authenticate to Jarvis and request each operating-system permission only immediately before the user-triggered feature needs it.

```bash
git checkout -b feature/android-companion
# Add the mobile workspace only after the app architecture is approved.
# Never copy OPENROUTER_API_KEY, DATABASE_URL, or JWT_SECRET into mobile source or app configuration.
pnpm test
pnpm check
git add .
git commit -m "Plan Android companion foundations"
git push -u github feature/android-companion
```

Every action that could communicate externally or leave Jarvis must remain reviewable. Jarvis may propose a location search, call, message, navigation route, or app handoff, but must show the target and require explicit approval before launching the operating-system action. A native app must use the standard Android permission and authentication flows; it must not attempt to unlock a device, read private app content, or send messages silently.

## Production Notes

For the managed Jarvis project, add or update provider credentials using the project’s secure Secrets interface rather than committing configuration. Create a checkpoint before you publish, then use the project Publish control. The current first release does not include direct operating-system control, device unlocking, smart-home control, Gmail/Calendar connectors, or always-on background wake-word listening; each needs a dedicated, user-authorized integration.

## References

[1] [Nemotron 3 Ultra model page](https://build.nvidia.com/nvidia/nemotron-3-ultra-550b-a55b)

[2] [OpenRouter streaming API reference](https://openrouter.ai/docs/api-reference/streaming)
