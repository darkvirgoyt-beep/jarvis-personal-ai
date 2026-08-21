# Production QA Audit

## Live audit record

| Date | URL | Checked journey | Observation |
| --- | --- | --- | --- |
| 2026-08-17 | https://scrimly-seven.vercel.app | Public landing | Public landing loaded successfully with the Jarvis workspace preview, sign-in entry point, and privacy statement. |
| 2026-08-17 | https://scrimly-seven.vercel.app | Sign-in dialog | The live dialog exposes separate existing-account and create-account paths, email/password fields, password recovery, Google, GitHub, and an explicit close control. |
| 2026-08-17 | https://scrimly-seven.vercel.app | Post-repair deployment | The production deployment for Git commit `409b373` reached Vercel `READY`; the public landing returned HTTP 200 and the anonymous `auth.me` tRPC request returned the expected `null` identity response through the serverless API. |
| 2026-08-18 | https://scrimly-seven.vercel.app | Responsive auth release | Git commit `c89142d` reached Vercel `READY` at `scrimly-4nxjcc0pk-darkvirgoyt-6238s-projects.vercel.app`. A direct production inspection loaded the Jarvis public landing with its visible Sign in entry and private-workspace call to action. |

The settled desktop capture for `c89142d` confirms that the production document contains the public landing and interactive Sign in, workspace-creation, and workspace-exploration controls. The capture agent presents this high-density browser at a reduced visual scale; this is a capture characteristic, not evidence of a layout regression.

A credential-free production interaction opened the independent Jarvis sign-in dialog. It exposed the existing-account and create-account modes, Google and GitHub provider entries, labeled email and password fields, account-creation and password-recovery paths, a clear primary Sign in securely action, and an explicit Close control. No identity, credential, provider login, or email confirmation action was attempted during this inspection.

**Owner-controlled verification — 2026-08-18:** The owner confirmed that the live email flow works and that confirmation opens the private Jarvis workspace. This closes the previously observed post-confirmation session-handoff defect. The password-reset and social-provider checks remain separate pending actions.

## Known live constraints

Google and GitHub buttons are visible by design but cannot complete sign-in until their corresponding providers are enabled and configured in the owner’s Supabase dashboard. The complete post-confirmation session handoff requires a signed-in owner test because it cannot be safely fabricated with a test account or user credential.

## Next validation

The next production check is to sign in through the existing-account path (or complete password reset), then confirm that the browser sends a Supabase Bearer token to the restored `/api/trpc` handler and Jarvis transitions to the authenticated workspace.

## Viewport review

| Viewport | Result | Notes |
| --- | --- | --- |
| Desktop, 1280 × 720 | Pass | The public landing has a clear hierarchy: branding, privacy promise, primary workspace call to action, secondary exploration action, and a workspace preview. The interface uses a consistent deep-ink, cyan, and restrained violet command-center palette. |
| Phone, 375 × 812 | Pass | The authenticated phone workspace uses a distinct single-column hierarchy rather than a shrunken desktop layout. The conversation composer, voice action, and suggested prompts remain visible without clipping. |

## Latest local release validation

| Area | Result | Evidence |
| --- | --- | --- |
| Existing-session recovery | Pass | The auth hook reads a pre-existing Supabase session on startup, subscribes with a stable dependency list, and invalidates the cached identity on every signed-in event. |
| Confirmation and recovery callback | Pass | Email confirmation, OAuth, and recovery return through the Vercel-safe completion contract; the page refreshes identity state and clears the visible callback marker. |
| Unauthorized API feedback | Pass | Independent Vercel authentication re-opens the Jarvis dialog rather than redirecting into managed-host OAuth. |
| Desktop workspace | Pass | A 1280 × 720 local preview retained the readable three-area command-center layout, focused conversation composer, and clear system state. |
| Phone workspace | Pass | A 375 × 812 local preview retained the distinct single-column experience, visible menu trigger, conversation hierarchy, and accessible composer controls. |

The production bundle completed after temporarily stopping the local TypeScript/watch processes to avoid sandbox resource contention. The checks then completed with 95 deterministic tests and a successful Vercel bundle. A direct production browser inspection also confirmed the public landing and visible sign-in entry. The browser capture uses a high-density viewport scale, so its reduced apparent page size is a capture characteristic rather than a responsive-layout defect. A live user-owned confirmation remains intentionally unperformed because it would require opening a real confirmation link or using account credentials.

On 2026-08-18, the restarted local preview at `https://3000-isk91p5nld03zw2horvr0-ccbd7436.sg1.manus.computer/` loaded the public landing and exposed both the header sign-in control and the private-workspace creation entry. That local host intentionally uses the managed OAuth route, which was unavailable to the sandbox browser at the time of inspection; it is therefore not a valid substitute for the independent Vercel Supabase dialog. The mobile dialog is covered by focused jsdom regression tests and will be visually rechecked after the next Vercel deployment.

### Follow-up visual refinement

The public landing already has a coherent private command-center style. Future design refinement should focus on stronger signature branding and more concise capability language, rather than reworking the established visual system.

### Voice-transcription production verification — 2026-08-19

Vercel deployment `dpl_B7AzFeZFzDBuJPusDriJ1U2HqiDR` for GitHub commit `a3f85b261a496d88b6add72ce4b63f5f0b5bea8d` reached `READY`. The production `POST /api/jarvis/transcribe` endpoint returned `401` without an authenticated session, confirming that it rejects anonymous requests before processing audio. The route now parses audio only on this path, forwards authenticated command audio ephemerally through the server-only `OPENAI_API_KEY`, and does not persist recorded commands in managed storage. Live transcription content was not exercised because the audit deliberately did not use an authenticated session or submit audio.

### Professional workspace release — 2026-08-20

GitHub `main` commit `a1a5c6dfe8a6679348855a9fb225496fb08e6388` reached Vercel `READY` as production deployment `dpl_2B5XfjzB22Lh2CeXyqBngdZbFbBU`. A public production smoke check loaded the Jarvis landing successfully at `https://scrimly-seven.vercel.app/`. Computed browser measurements confirmed a 3840×3300 logical viewport and a normal 60px hero heading; the visually compact screenshot was a one-third device-pixel-ratio capture, not a responsive layout regression. GitHub remains the source of truth, Vercel remains the public host, and the Manus domain is development preview only.

### Production rendering and workspace-route verification — 2026-08-20

The professional workspace release initially exposed a blank client root despite a `READY` Vercel deployment. Direct module inspection isolated the cause to the manual vendor chunks: the Lucide chunk evaluated before its React dependency and raised `Cannot read properties of undefined (reading 'forwardRef')`. GitHub commit `ec5c98fbdb4905f7b14240449defd7cca6844a45` removed that unsafe chunk split while retaining the production exclusion of development JSX diagnostics; Vercel deployment `dpl_pVLawZRBJnuzMVUQyJsoyc2Yw8qG` reached `READY`, and the public Jarvis landing then rendered its sign-in, private-workspace, voice, memory, and guarded-build entry points.

The documented VirgoYT address initially returned the SPA 404 because only `/agent` was registered. GitHub commit `5f805162f5638cf34bfbbed83402adf98c66f5f3` added `/virgoyt` as a compatibility alias and reached Vercel `READY` in deployment `dpl_A3dtZWv9rcFAPmonvWFtMLhet13p`. The public route now displays the expected private-agent sign-in boundary and confirms that no tools run from the unauthenticated page. A credential-free `GET /api/trpc/auth.me` returned HTTP 200 with `{"result":{"data":{"json":null}}}`, confirming the Vercel API function is live and the anonymous identity state is safely null.

### Vercel route-guide compatibility verification — 2026-08-21

The supplied static-SPA routing guide was reviewed against Jarvis’s authenticated serverless runtime. GitHub commit `dd7320de9294054335b79aa3d7c4d3bb13f7c5cf` retained the API-first Vercel rewrites and added only the guide’s safe legacy `?/<path>` browser URL-restoration guard. Vercel deployment `dpl_BLcjvw5Lw3Xv3VRVPJX97F4SWmhz` reached `READY`. Both `https://scrimly-seven.vercel.app/virgoyt` and the legacy form `https://scrimly-seven.vercel.app/?/virgoyt` resolved to the private VirgoYT sign-in boundary; the second address was restored to `/virgoyt` in the browser. No global rewrite was changed in a way that could send `/api/*` requests to the static client.

### Supabase private-runtime cutover verification — 2026-08-21

Following explicit owner approval, GitHub commit `bcc9577ae535beb6d2724b69960f7f41735235f2` moved Vercel runtime access for Jarvis core data, VirgoYT control-plane data, and workspace file storage to server-only Supabase services. Vercel deployment `dpl_HyhE8T7ZTX9DLgq58hx8anvGVaze` reached `READY`. The public landing remained available, and credential-free `GET /api/trpc/auth.me` returned HTTP 200 with `{"result":{"data":{"json":null}}}`, confirming the running function preserves the anonymous boundary after the data-layer switch. A signed-in functional check remains required before treating user-specific private-workspace flows as fully production-verified.

The owner then signed in through the live Vercel page. The private workspace rendered with its private chat list, specialist workspace controls, activity panel, and approval-gated workspace surfaces; no content was opened or modified during inspection. A deliberately credential-free browser `auth.me` probe returned HTTP 200 with a null identity, as expected because that probe did not send the application’s Supabase Bearer token. The final check is therefore to confirm the normal bearer-token tRPC path, not to treat the credential-free result as an authenticated failure.

The normal client bearer-token path was then checked without exposing the token or profile fields. The browser had a Supabase session, a `Bearer` request to `auth.me` returned HTTP 200, and the verified identity was non-null. The signed-in workspace reported no runtime console errors. This validates session transport and server-side identity verification after the cutover. No chat, memory, task, project, approval, or file write was performed; an explicit user-approved write test remains the final optional end-to-end check.

### Signed-in app-capability contract correction — 2026-08-21

An owner-provided signed-in screenshot exposed a stale model-generated denial claiming Jarvis could not compile, sign, or deploy applications. That wording did not meet the documented reviewed-workspace and deployment-proposal contract. GitHub commit `7253f8a25db8f4c804ed59235dea21e1c10b48b9` strengthened the live-model system contract and stream regression coverage: Jarvis must offer app and website architecture, reviewed artifacts, GitHub handoff, and explicit deployment proposals, while accurately reserving actual signing, release, remote-computer, and credentialed deployment execution for connected approved tools. Vercel deployment `dpl_CUjPpinvssVZzoKAM4xvedLMp7cN` reached `READY`; a signed-in new-chat confirmation remains the final user-visible check because historical messages are intentionally immutable.
