# Supabase Authentication References

Jarvis’s Vercel authentication migration uses browser `getSession()` only to obtain an access token for API transport. Every protected server route must verify the bearer token with Supabase before authorizing private data access.

The browser client uses a Supabase **publishable** key only. The service-role key and database connection string remain server-only.

## Sources

1. [Supabase JavaScript `auth.getUser`](https://supabase.com/docs/reference/javascript/auth-getuser) — describes a network-backed, server-confirmed user lookup suitable for authorization.
2. [Supabase JavaScript sign-in reference](https://supabase.com/docs/reference/javascript/auth-signin) — documents explicit authentication methods such as email/password sign-in and account creation.
3. [Supabase JavaScript `auth.getSession`](https://supabase.com/docs/reference/javascript/auth-getsession) — documents local session retrieval and browser refresh behavior.
