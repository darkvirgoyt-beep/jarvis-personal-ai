# Jarvis Cloud Workspace and Deployment

## Current public service

Jarvis is publicly hosted at [jarvisai-tyjkhyjq.manus.space](https://jarvisai-tyjkhyjq.manus.space). The public landing lets anyone discover the product, but chats, memories, projects, action approvals, files, and connection preparation require sign-in and remain scoped to the authenticated user.

The source of truth is the private [Jarvis GitHub repository](https://github.com/darkvirgoyt-beep/jarvis-personal-ai). GitHub stores reviewable source and version history; it does not run this application’s Express API, private database procedures, streaming endpoint, OAuth flow, or server-side model credentials. A GitHub Pages URL would therefore be inappropriate for the complete full-stack product. The current managed hosting is the live web URL; a future external deployment must support the Node server and protected environment variables.

## Supabase migration readiness

An active Supabase project is connected to the owner account. Its Jarvis PostgreSQL schema has been staged with user-scoped tables, indexes, Row Level Security, explicit server-only API-role policies, and no remaining Supabase security-advisor findings. Jarvis remains on its existing managed cloud database so current user-scoped records are not moved silently. The next safe migration needs an explicit owner approval, a read-only export validation, and a maintenance/reconciliation plan before the runtime connection is switched.

| Step | Status | Safeguard |
|---|---|---|
| Inventory source records | Pending approval | Count and reconcile users, conversations, messages, memories, tasks, confirmations, research, and workspace metadata without exposing file bytes. |
| Apply Postgres schema | Staged and security-hardened | User-scoped tables, indexes, Row Level Security, and deny-by-default API-role policies are applied; no records were imported. |
| Import private metadata | Deferred | Requires an explicit approved migration window; S3 file bytes remain in object storage. |
| Switch runtime database | Deferred | Requires protected `SUPABASE_URL` and server-only credential configuration plus integration testing. |
| Validate and rollback window | Required | Compare per-user counts and retain the existing database until validation succeeds. |

> **No private record has been copied to Supabase yet.** This prevents accidental cross-user exposure or interruption of the live personal AI service.

## User-controlled cloud computer and browser work

Jarvis can prepare safe, visible handoffs and can later support an attached persistent cloud computer. A genuine computer session must be provisioned and connected by its owner; the owner remains able to observe and control the browser. Jarvis may suggest or prepare a browser destination, download reviewable files, or propose an executable action, but it must wait for the user’s approval and never collect passwords, bypass MFA/CAPTCHAs, hide automation, or evade bot detection.

| Capability | Supported boundary |
|---|---|
| Website sign-in | The user signs in directly through the browser or connected browser session; credentials are never requested or stored in Jarvis. |
| Browser navigation | A user-approved destination may be opened visibly in a normal browser session. |
| Downloads | Files can be prepared and downloaded only after review; potentially executable files require an explicit risk warning. |
| Executables | Jarvis may explain, inspect, or propose a verified execution plan. Running an executable requires user approval in an attached, owner-controlled environment. |
| Security challenges | MFA, CAPTCHA, security keys, and account recovery remain manual user steps. |
| Web automation | No stealth, impersonation, rate-limit evasion, fingerprint evasion, or "undetectable" browsing is supported. |

## Desktop and phone experiences

Jarvis uses one authenticated data model but intentionally different interaction layouts. The desktop interface is a persistent rail and focused multi-panel workspace that prioritizes current chat and projects. The phone interface becomes a single-column command surface with a full-height drawer for **Chats**, **Memory**, **Projects**, **Builder**, **Integrations**, and **Settings**. This is a purpose-built mobile interaction model, not simply a squeezed desktop ratio.

## Efficient, careful engineering

Jarvis compresses an instruction into the smallest complete build brief before generating output. During debugging it identifies the root cause, applies the smallest tested change, and avoids speculative rewrites. Concision never overrides correctness, user review, privacy, or security controls.
