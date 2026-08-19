# VirgoYT Local Runner Foundation

The initial VirgoYT runner is a **proposal-only local CLI**. It prepares a local, credential-free runner manifest and visible tool-proposal drafts. It does not connect to the web app, run a terminal command, alter a file, operate a browser, use a Git credential, or redeem an approval. This deliberate limitation means local setup cannot silently gain computer control.

## Supported Hosts

| Host | Requirement | Recommended command |
| --- | --- | --- |
| Windows | Node.js 20+ | `node scripts/virgoyt-cli.mjs doctor` in PowerShell |
| macOS or Linux | Node.js 20+ | `node scripts/virgoyt-cli.mjs doctor` |
| Termux | `pkg install nodejs git` | `node scripts/virgoyt-cli.mjs doctor` |
| Docker | Docker Engine | `docker compose -f runner/docker-compose.yml run --rm virgoyt-runner` |

## Create a Local Proposal Workspace

Run these commands from a clone of the Jarvis repository. The server URL is public application metadata; do not add an API key, session token, password, or browser cookie to a command, file, or repository.

```bash
node scripts/virgoyt-cli.mjs init \
  --server https://scrimly-seven.vercel.app \
  --project 123 \
  --name "My local development runner"

node scripts/virgoyt-cli.mjs proposal \
  --kind terminal_command \
  --title "Run the project test suite" \
  --details "pnpm test"
```

The CLI stores configuration and draft proposals in `.virgoyt/`. Add that directory to your personal global ignore if it is associated with a local machine; it contains no secrets but is machine-specific working state.

## Isolated-Runner Roadmap

The supplied `runner/Dockerfile` and `runner/docker-compose.yml` are a hardened inspection scaffold: unprivileged user, read-only root filesystem, dropped Linux capabilities, and no mapped host directory or daemon socket. A future remote adapter must be implemented only after it can satisfy all of the following conditions:

1. Pair through an authenticated, short-lived, user-scoped runner registration—not an API key in a config file.
2. Redeem a single-use approval nonce from the control plane and record success, failure, and scope in the audit ledger.
3. Use an ephemeral workspace or an explicitly mounted project directory; never mount a home directory, Docker socket, credential store, or browser profile.
4. Run an allow-listed command or browser action with visible parameters, timeout, output cap, network policy, and cancellation support.
5. Require a fresh proposal for destructive filesystem, Git push, deployment, authentication, payment, or external communication actions.

> A Docker container is **not** a bypass for approval, account login, bot detection, operating-system permissions, or site policies. It is an isolation layer that must remain visibly user-controlled.
