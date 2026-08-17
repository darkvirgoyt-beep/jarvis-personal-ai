# Vercel Migration Notes

## Deployment boundary

GitHub Pages currently provides a public static Jarvis launch page only. The complete Jarvis application requires server execution for its authenticated tRPC API, streaming response endpoint, voice transcription route, OAuth callback, database access, and server-only provider credential. The GitHub Pages gateway must therefore not be presented as a full runtime host.

## Verified Vercel direction

The Vercel account connection has an available team named `darkvirgoyt-6238's projects` (`team_IF0dQufUcoq8E5zkCHUMWuQ3`). No existing Jarvis project was found. Vercel supports routing requests to serverless functions and custom route configuration through `vercel.json`; the next implementation step is to extract the current Express application construction from its local port-listening entry point into a request handler that Vercel can invoke.

## Completed import and function repair

The owner authorized the Vercel GitHub Login Connection and Vercel imported the public `darkvirgoyt-beep/jarvis-personal-ai` repository as the `scrimly` project. The public Vercel deployment is available at `https://scrimly-seven.vercel.app`.

The owner also authorized public access to the Vercel URL. Vercel Authentication (SSO deployment protection), password protection, and Trusted IP protection are disabled for the `scrimly` project. An unauthenticated browser request now loads the Jarvis public landing page directly at the Vercel URL. This access setting does not configure application authentication, database access, storage, transcription, or model credentials.

The first deployment returned `ERR_MODULE_NOT_FOUND` because the catch-all serverless entry imported local application modules that were not included in the function bundle. The deployment adapter now builds a standalone server artifact, including its ESM-only authentication dependency. The verified production API now reaches the Jarvis Express application: an unknown `/api/test` route returns the application-level `Cannot GET /api/test`, and `/api/trpc` returns the expected tRPC `No procedure found on path` response. Those responses prove routing and application loading rather than a Vercel function import failure.

## Remaining independent runtime prerequisites

The Vercel deployment is a verified public client and serverless-route shell, but it is **not yet an independent full Jarvis runtime**. The current source still relies on managed-platform services that are not automatically available to a Vercel function. Before real authentication, private storage, voice transcription, and AI responses are enabled on the Vercel domain, the owner must approve and configure independent equivalents.

The approved Supabase target is the active `darkvirgoyt-beep's Project` (`ytqacgefcvjrahyyfmaw`) in `ap-southeast-2`, with public API URL `https://ytqacgefcvjrahyyfmaw.supabase.co`. The previously staged Jarvis schema and deny-by-default RLS policies belong to this owner project. Its database password, service-role key, and any other private credentials are intentionally not recorded in this repository.

The connected project confirms three applied Jarvis migrations: `jarvis_private_cloud_schema`, `jarvis_server_only_rls_hardening`, and `jarvis_revoke_public_rls_helper`. This establishes the private table layout and server-only RLS boundary; it does not move records from the managed database or authorize a Vercel service-role connection by itself.

| Capability | Required Vercel-compatible configuration | Current state |
| --- | --- | --- |
| User authentication | An independent OAuth/OIDC provider plus Vercel callback URL | Not configured; the current Manus OAuth callback cannot be assumed to cover the Vercel domain. |
| Private database | Owner Supabase PostgreSQL connection and an approved migration/cutover | Schema is staged with RLS; credentials and data-cutover approval are pending. |
| Object storage | S3-compatible bucket credentials and a server-side storage adapter | Not configured; current storage proxy is managed-platform-only. |
| Voice transcription | Independent Whisper-compatible provider key and server-side endpoint | Not configured; current transcription helper is managed-platform-only. |
| AI responses | A valid server-only `OPENROUTER_API_KEY` (the present key was rejected by the provider) | Requires a replacement key. |

No database URLs, service-role keys, storage secrets, or provider keys are committed to the public repository. They must be entered in the Vercel project environment settings only after the owner selects the providers and approves the credentials.

The production migration must retain the following values as server-only Vercel environment configuration: database connection, OAuth configuration, JWT secret, storage configuration, and the OpenRouter credential. No credentials may be committed to the public GitHub repository.

## Production Supabase scope correction and remaining session investigation

On 17 August 2026, the linked Vercel environment screen initially showed the browser-safe `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` values scoped to **Production and Preview**, while `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` were incorrectly scoped to **Preview only**. That prevented the Vercel production server from verifying a browser Supabase access token or upserting the corresponding `jarvis_users` profile.

The owner then authorized the scope correction. The Vercel environment screen now verifies all five required Supabase variables are scoped to **Production and Preview**, and a subsequent production redeployment completed successfully. Values remain private Vercel environment values and are not copied into source control.

If a confirmed session still returns to the Jarvis sign-in dialog after a hard reload of the stable production domain, the next investigation target is the authenticated request itself (client access-token delivery and server profile mapping), not the Vercel environment scope.

## API-first routing repair

The remaining sign-in loop was traced to the production `vercel.json` rewrite order. Authenticated `/api/*` requests were reaching the static client fallback instead of the bundled serverless catch-all, producing a `404` before Supabase identity verification could run. The route configuration now sends `/api/:path*` to `api/[...path].ts` before applying the static fallback.

The deployment generated from commit `0776caa` is live and the deployed `auth.me` tRPC query now reaches the serverless handler with HTTP `200` and a JSON response for an unauthenticated request. A signed-in browser must still be checked with the owner’s session to verify the complete Supabase token-to-workspace handoff.

## Post-confirmation session recovery repair

The follow-up code repair makes all Supabase return paths converge on the same browser state. On application startup, Jarvis now reads any existing local Supabase session before relying on the event subscription, so a confirmation or recovery event that completed before React mounted cannot leave `auth.me` cached as anonymous. The email sign-up flow now uses the same `/?auth=complete` Vercel-safe callback contract as provider OAuth and recovery. That callback closes the dialog, refreshes the user query, and removes the marker from the address bar.

The global API error handler now sends an unauthenticated Vercel visitor to the in-app Jarvis dialog rather than initiating managed-host OAuth. Password reset refreshes the authenticated query and replaces the recovery URL with `/` after a successful password update. TypeScript, 95 deterministic tests, and the Vercel production build pass for this repair. The only remaining end-to-end verification is an owner-controlled sign-in/confirmation run on the new Vercel deployment; no user credential or confirmation link is fabricated for testing.

## References

- [Vercel project configuration and custom routes](https://vercel.com/docs/project-configuration/vercel-json)
- [Vercel routing rewrites](https://vercel.com/docs/rewrites)
- [Vercel Node.js functions](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel account Login Connections](https://vercel.com/docs/accounts/create-an-account#login-methods-and-connections)
