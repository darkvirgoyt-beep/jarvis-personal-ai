# Jarvis Public Workspace

## Public entry, private workspaces

Jarvis is now publicly reachable as a discovery and sign-in experience. Visitors may review the product’s voice, memory, project-planning, guarded-handoff, and Builder capabilities before choosing **Create your private workspace**. No visitor can view another person’s conversations, memory, projects, confirmation history, workspace files, or configured connections.

| Surface | Audience | Data boundary |
|---|---|---|
| Public entry | Anyone visiting the published site | Contains product explanation and a static workspace preview only. It performs no private data query. |
| Sign-in | A visitor who elects to create or open a workspace | Starts the existing authenticated account flow. |
| Chats | Signed-in user | Displays only that user’s conversation list and messages. |
| Memory | Signed-in user | Displays and mutates only that user’s retained preferences and facts. |
| Projects | Signed-in user | Displays the user’s private workspace metadata and approval-gated proposals. |
| Builder | Signed-in user | Produces reviewable application plans and protected handoffs; it does not publish or deploy work. |
| Integrations | Signed-in user | Separates connection preparation and safe browser handoffs from authenticated third-party access. |
| Settings | Signed-in user | Limits settings writes to the authenticated profile. |

> **Public publication does not make user records public.** Every private route remains authenticated and every data procedure remains scoped to the signed-in user on the server.

## Original workspace design

The redesign borrows only broad usability principles from modern agent products: a persistent desktop rail, an explicit **New chat** action, discoverable private areas, a focused composer, and a responsive mobile drawer. Its dark command-center material system, cyan signal color, neural presence visual, security-language copy, and component structure remain Jarvis-specific. No third-party name, logo, screenshot, proprietary copy, or cloned layout is included.

At standard desktop widths, Jarvis prioritizes the private conversation and neural presence rather than displaying every telemetry panel at once. Supporting agent and system rails appear on very wide displays. On phone widths, the same six private areas are reachable through a full-height rail drawer, avoiding clipped horizontal navigation.

## Publishing checklist

The current web project is auto-published when a checkpoint is saved. Before inviting other users, the owner should confirm the public site’s name and domain in the project settings, leave authentication enabled, review any future third-party integration permissions, and keep provider secrets in the protected environment configuration. The public landing is intentionally appropriate for general visitors; private workflows require sign-in.
