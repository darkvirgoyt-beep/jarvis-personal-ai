# Vercel Migration Notes

## Deployment boundary

GitHub Pages currently provides a public static Jarvis launch page only. The complete Jarvis application requires server execution for its authenticated tRPC API, streaming response endpoint, voice transcription route, OAuth callback, database access, and server-only provider credential. The GitHub Pages gateway must therefore not be presented as a full runtime host.

## Verified Vercel direction

The Vercel account connection has an available team named `darkvirgoyt-6238's projects` (`team_IF0dQufUcoq8E5zkCHUMWuQ3`). No existing Jarvis project was found. Vercel supports routing requests to serverless functions and custom route configuration through `vercel.json`; the next implementation step is to extract the current Express application construction from its local port-listening entry point into a request handler that Vercel can invoke.

## Current account prerequisite

On 2026-08-17, Vercel rejected the Git-linked project creation request with the following actionable response: **“Failed to link `darkvirgoyt-beep/jarvis-personal-ai`. You need to add a Login Connection to your GitHub account first.”** The Vercel GitHub Login Connection must be added in the account before Vercel can import this GitHub repository. This is an account authorization step; it cannot be completed by modifying repository source files.

The production migration must retain the following values as server-only Vercel environment configuration: database connection, OAuth configuration, JWT secret, storage configuration, and the OpenRouter credential. No credentials may be committed to the public GitHub repository.

## References

- [Vercel project configuration and custom routes](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercel routing rewrites](https://vercel.com/docs/rewrites)
- [Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel account Login Connections](https://vercel.com/docs/accounts/create-an-account#login-methods-and-connections)
