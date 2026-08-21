# Jarvis Supabase Cutover Audit

**Status:** Owner-approved and deployed to Vercel on 2026-08-21; authenticated private-workspace validation remains pending.

The active Supabase project is `ytqacgefcvjrahyyfmaw` in `ap-southeast-2`. Its staged Jarvis profile and core private-data tables already use server-only row-level-security policies for `anon` and `authenticated` roles. At audit time, the two user-profile rows were the only existing records; conversations, messages, memory, tasks, preferences, approvals, workspace metadata, research records, and mobile pairings were empty. Therefore, the cutover does not require copying existing private application records.

The audit identified two remaining infrastructure gaps. First, the VirgoYT user-scoped control-plane tables were still confined to the legacy schema. Second, no `jarvis-private` Storage bucket existed, so approval-gated workspace files would still depend on the managed storage adapter. The migration provisions those tables with ownership foreign keys to `jarvis_users.open_id`, restrictive server-only RLS, a private 10 MiB bucket, and a restrictive Storage policy that prevents browser-key access. Vercel keeps access through the Supabase service-role credential, which is never sent to the browser.

> The cutover intentionally preserves the established model: browser clients authenticate with Supabase Auth, while Jarvis private records and files are accessed only by verified server routes. A user cannot directly enumerate another user’s records or workspace objects.

## Deployment evidence

GitHub commit `bcc9577ae535beb6d2724b69960f7f41735235f2` moved the Vercel-only core and VirgoYT data adapters to the server-only Supabase client, and routed workspace file uploads to the private `jarvis-private` bucket through time-limited signed URLs. Vercel deployment `dpl_HyhE8T7ZTX9DLgq58hx8anvGVaze` reached `READY`. The public landing rendered successfully, and the Vercel `auth.me` API returned HTTP 200 with a null anonymous identity, confirming the server starts without exposing data to unauthenticated callers.

The no-write integration test is intentionally environment-gated because sandbox shells do not receive the Vercel service-role secret. It will execute in an environment where the server-only Supabase variables are available. Since the audit found no existing private application data beyond two user profiles, no historical conversation, file, memory, or project rows needed copying. The remaining validation is a normal signed-in production check of profile creation, an isolated private read/write, and the approval-gated workspace flow.

## References

[1]: https://supabase.com/docs/guides/storage/security/access-control "Supabase Storage access control"
[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
