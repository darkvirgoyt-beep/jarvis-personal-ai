# Supabase Authentication References

Jarvis’s Vercel authentication migration uses browser `getSession()` only to obtain an access token for API transport. Every protected server route must verify the bearer token with Supabase before authorizing private data access.

The browser client uses a Supabase **publishable** key only. The service-role key and database connection string remain server-only.

## Sources

1. [Supabase JavaScript `auth.getUser`](https://supabase.com/docs/reference/javascript/auth-getuser) — describes a network-backed, server-confirmed user lookup suitable for authorization.
2. [Supabase JavaScript sign-in reference](https://supabase.com/docs/reference/javascript/auth-signin) — documents explicit authentication methods such as email/password sign-in and account creation.
3. [Supabase JavaScript `auth.getSession`](https://supabase.com/docs/reference/javascript/auth-getsession) — documents local session retrieval and browser refresh behavior.
4. [Supabase Google login guide](https://supabase.com/docs/guides/auth/social-login/auth-google) — requires a Google web OAuth client, the Vercel production origin as an authorized JavaScript origin, and the project-specific Supabase callback URL as the authorized redirect URI.
5. [Supabase GitHub login guide](https://supabase.com/docs/guides/auth/social-login/auth-github) — requires a GitHub OAuth App, the project-specific Supabase callback URL, and provider credentials stored only in the Supabase provider configuration.
6. [Supabase JavaScript OAuth sign-in reference](https://supabase.com/docs/reference/javascript/auth-signinwithoauth) — documents browser `signInWithOAuth` with an allowed return URL. Jarvis returns to the active application origin at `/?auth=complete`; the deployed Vercel URL must remain on the Supabase redirect allow-list.
