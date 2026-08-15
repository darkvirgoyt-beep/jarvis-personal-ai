# Jarvis Environment Configuration

This guide identifies the values needed to run Jarvis outside the managed project environment. **Never commit a `.env` file, a provider key, database password, session secret, or OAuth credential.** Create `.env` locally from [`environment-template.txt`](./environment-template.txt), and use your hosting provider’s encrypted secrets interface for deployed values.

## Local Setup

Copy the supplied safe template and replace only the placeholders that apply to your environment.

```bash
cp docs/environment-template.txt .env
# Edit .env locally. Do not add it to Git.
```

| Variable | Where it is used | Local requirement | Security rule |
|---|---|---|---|
| `OPENROUTER_API_KEY` | Server-side Nemotron 3 Ultra stream | Required for primary provider responses | Server only; never prefix with `VITE_` or place in a mobile app |
| `DATABASE_URL` | Server-side MySQL/TiDB private workspace | Required for conversations, memory, tasks, preferences, and approvals | Keep the password and host private; use TLS when your provider requires it |
| `JWT_SECRET` | Server-side session signing | Required for authenticated sessions | Generate a long, random, unique value per environment |
| `VITE_APP_ID` | Manus OAuth browser configuration | Required only when using Manus login outside the managed project | Public browser configuration; it is not a password |
| `OAUTH_SERVER_URL` | Manus OAuth server configuration | Required only when using Manus login outside the managed project | Use the official OAuth service URL supplied for your app |
| `VITE_OAUTH_PORTAL_URL` | Manus OAuth browser configuration | Required only when using Manus login outside the managed project | Public browser configuration; it is not a password |
| `VITE_APP_TITLE` | Browser title and branding | Optional | Safe public configuration |

> A `VITE_*` value is included in the browser bundle. It must never contain a provider key, database URL, session secret, mobile-app secret, or private access token.

## Production / Managed Project Setup

For this deployed Jarvis project, use the secure **Secrets** panel rather than a committed file. The managed runtime supplies the OAuth, application, analytics, and Forge integration variables automatically. You normally need to maintain only provider credentials such as `OPENROUTER_API_KEY` when they change.

| Managed value | Who provides it | Do you add it to GitHub? |
|---|---|---|
| `BUILT_IN_FORGE_API_KEY`, `BUILT_IN_FORGE_API_URL` | Managed project runtime | No |
| `JWT_SECRET`, OAuth URLs, application identifiers | Managed project runtime | No |
| `OWNER_NAME`, `OWNER_OPEN_ID`, analytics variables | Managed project runtime | No |
| `OPENROUTER_API_KEY` | You, through the encrypted project secret input | No |

After entering or replacing `OPENROUTER_API_KEY`, validate that the account is authorized for `nvidia/nemotron-3-ultra-550b-a55b`. A 403 response means the provider rejected the credential or model access; do not work around this by moving the key into client code.

## GitHub and Mobile Companion Boundary

The repository should contain only `.env` placeholders, documentation, and application code. Configure GitHub Actions secrets only if you later add a workflow that needs them; do not use repository variables for secrets. An Android or iOS Jarvis companion must call the authenticated Jarvis backend and use operating-system permissions. It must **not** contain `OPENROUTER_API_KEY`, `DATABASE_URL`, `JWT_SECRET`, or any server-side OAuth secret.

Before pushing changes, run:

```bash
git status
git diff --cached
pnpm vitest run --exclude server/openrouterCredential.test.ts
pnpm check
```

Confirm `.env` is absent from `git status` before committing. The OpenRouter live credential check is intentionally separate because it requires an active provider-authorized account.

## References

[1] [OpenRouter API keys and provider access](https://openrouter.ai/docs/quickstart)

[2] [Vite environment-variable security guidance](https://vite.dev/guide/env-and-mode)

[3] [GitHub encrypted secrets documentation](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions)
