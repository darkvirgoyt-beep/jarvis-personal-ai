# Jarvis Unified Professional Workspace

## Product intent

Jarvis is evolving from a voice chat interface into a **single professional AI workspace**. A user can describe a goal in normal language, choose the appropriate work mode, review the resulting plan and artifacts, and approve any operation that would write files, open an external destination, use an external account, deploy software, or interact with a paired remote computer.

The experience must be useful for ordinary writing as well as substantial work such as research, application planning, code drafting, document preparation, data analysis, and deployment preparation. A single conversation remains the entry point; specialized workspace surfaces make the outcome inspectable instead of hiding it behind chat text.

## Workspace model

| Surface | User outcome | Current behavior | Safety boundary |
| --- | --- | --- | --- |
| Unified command | Ask in normal language, select an intent, add context, dictate a request | Streams a Jarvis response through the authenticated chat path | Browser audio and text are processed only after user action; provider secrets remain server-only |
| Live work rail | See concise plan stages, active step, outputs, and approvals | Shows status derived from visible client activity and confirmed server events | It never exposes private chain-of-thought or claims that a hidden task is still running |
| Artifacts | Review copyable text, code, calculations, source links, and generated files | Uses existing private workspace proposals and downloadable outputs | Writes require the existing user approval gate |
| Builder | Turn a project request into a reviewable blueprint and file map | Reuses Builder’s architecture plan, readiness report, and GitHub handoff proposal | It does not compile, deploy, create repositories, or modify files silently |
| Integrations | Review model profiles, connection readiness, and external capability scopes | Links to existing server-owned provider configuration and safe handoffs | Secrets are never returned to the browser; external scopes require explicit approval |
| Jarvis Computer | Understand the current runner, check a paired remote-computer session, and propose visible actions | Represents the proposal-only local CLI and future paired remote runner | No hidden browser, terminal, download, executable, credential, CAPTCHA, or stealth automation action is implied or performed |

## Intent routing

The unified composer supplies a clear user-controlled mode, while Jarvis may suggest a mode from the request. Mode selection is not a permission grant; it only adjusts the visible planning prompt and artifact framing.

| Intent | Outputs shown in the workspace | Execution model |
| --- | --- | --- |
| Answer | Structured, copyable response and optional voice replay | Chat response only |
| Research | Source ledger, findings, and link proposals | Search and external navigation require visible approval where needed |
| Code | Code draft, language selection, exportable artifact, and file-change proposal | File writes only after approval |
| App / website | Requirements, architecture, file map, preview readiness, and deployment proposal | Builder plan first; build and deployment stay approval-gated |
| Image | Prompt brief and requested output specification | Image request is explicit; no opaque background jobs are claimed |
| Data / calculate | Formula, assumptions, table/chart artifact, and export option | Deterministic calculation/data processing is visible and reviewable |
| Documents | Draft, edit proposal, and PDF/spreadsheet/document export intent | Exports are user-initiated; private content remains scoped to the account |

## Live progress and reasoning presentation

Jarvis may present an **activity summary** such as “reading supplied files,” “drafting a plan,” “streaming an answer,” or “awaiting approval.” It must not show or fabricate hidden model reasoning. The user sees action summaries, externally verifiable artifacts, error states, and reviewable proposed actions.

## Delivery and integration boundaries

The existing Vercel runtime is appropriate for authenticated chat, bounded API routes, streaming responses, and proposal creation. Long-running, privileged, or local machine work belongs only to a separately owner-paired runner with visible status and a narrow audited contract. APK packaging, signed app publishing, arbitrary executable downloads, and automatic deployment are not represented as completed work unless a user approves an explicit, environment-compatible action.
