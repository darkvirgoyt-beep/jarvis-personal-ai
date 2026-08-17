# Jarvis Capability and Safety Boundaries

Jarvis is a private, voice-driven web assistant. It can respond to typed or permitted microphone input, maintain user-scoped workspace records, prepare research and code artifacts, and propose actions for review. It is not an autonomous replacement for a person’s device, identity, or external accounts.

## What Jarvis Can Do Today

| Area | Available behavior | User control |
| --- | --- | --- |
| Conversation | Stream responses through the configured server-side model provider and keep the signed-in user’s history private. | Users may create, search, star, and manage only their own conversations. |
| Voice | Offer visible push-to-talk controls, a keyboard shortcut, and browser speech synthesis when supported. | Microphone access requires browser permission and a user action; speech can be disabled. |
| Memory and tasks | Store signed-in users’ memories, tasks, preferences, and workspace plans under their own identity. | Users can review and change these records in the private workspace. |
| Research, code, and Builder | Produce source-led research notes, code suggestions, and reviewable project plans. | Generated work remains a proposal until the user explicitly approves an available handoff. |
| External destinations | Prepare browser, maps, search, calling, messaging, and app-link handoffs where supported. | Jarvis displays the target and requires approval before opening an external destination. |

## What Jarvis Does Not Claim or Do

| Boundary | Meaning |
| --- | --- |
| No credential collection | Jarvis does not ask for, store, or expose passwords, provider keys, session tokens, or OAuth secrets in chat, client code, or the public repository. |
| No silent communication or payment | Jarvis cannot silently call, text, send WhatsApp or Instagram messages, post, purchase, or transfer money. The operating system and destination service retain their own confirmation steps. |
| No device-unlock bypass | Jarvis cannot unlock a phone or computer, bypass biometrics, defeat CAPTCHAs, evade bot detection, or access another application’s private data. |
| No hidden computer control | The browser Private Workspace is not a desktop operating system. A future Cloud Computer must be separately owner-connected, visibly controlled, and approval-gated. |
| No unapproved file execution | Jarvis can prepare file, folder, or code proposals inside its scoped workspace. It does not silently execute destructive commands, download/run untrusted programs, or modify a personal device. |
| No fabricated completion | If a provider, permission, connection, or action is unavailable, Jarvis reports that limitation instead of claiming the task ran. |

## Authentication and Privacy

On Vercel, Jarvis uses Supabase Auth for the independent sign-in experience. Email confirmation, OAuth, and password recovery use a return URL on the deployed Jarvis origin. Browser access tokens are sent only to Jarvis’s API over the current site connection and are verified server-side before an identity is mapped to a user-scoped profile. The client never receives the Supabase service-role key, database password, or model-provider credential.

Google and GitHub sign-in require the owner to enable each provider in Supabase before they can complete. Their provider callback is `https://ytqacgefcvjrahyyfmaw.supabase.co/auth/v1/callback`; the application return remains the configured Jarvis production domain. Until this configuration is complete, Jarvis shows an actionable provider-configuration response rather than pretending the sign-in succeeded.

For mobile-specific permissions and Android intent handoffs, see [Mobile Capability and Safety Boundaries](./mobile-capabilities.md). For the optional isolated-computer design, see [Cloud Workspace](./cloud-workspace.md).
