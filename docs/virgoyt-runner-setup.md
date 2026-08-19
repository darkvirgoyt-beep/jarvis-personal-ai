# VirgoYT Proposal-Only Runner

## Purpose and security boundary

The portable runner is intentionally a **proposal generator**, not an execution agent. It can format a reviewable plan for a file change, terminal command, browser destination, Git operation, deployment, or runner-pairing request. It does not read environment variables, contact a remote API, retain credentials, open a browser, execute a command, or apply a proposal.

| Capability | Proposal-only CLI | VirgoYT Workspace | Future paired runner |
| --- | --- | --- | --- |
| Generate a structured action proposal | Yes | Yes | Yes |
| Store user-owned plans and approvals | No | Yes | No |
| Hold provider credentials | No | Server vault only | Only with explicit owner pairing |
| Execute a terminal, Git, file, or browser action | No | No | Only after a matching approval is redeemed |
| Reach external networks by default | No | Server-controlled | Owner-controlled |

## Run locally

Install a supported Node.js release, clone the repository, and execute the script from the repository root. The same command works in Windows PowerShell, macOS Terminal, Linux shells, and Termux.

```bash
node scripts/virgoyt-cli.mjs status
node scripts/virgoyt-cli.mjs proposal \
  --project personal-workspace \
  --kind terminal_command \
  --title "Inspect application logs" \
  --details "Propose: tail -n 100 application.log"
```

The second command prints JSON only. Copy the proposal into the authenticated VirgoYT workspace for review. A generated proposal is **not** permission to perform the described operation.

## Use the isolated Docker template

Docker is optional. The supplied Compose configuration has no network access, uses a read-only filesystem, and defaults to the harmless `status` command.

```bash
docker compose -f runner/docker-compose.yml run --rm virgoyt-proposal-runner
docker compose -f runner/docker-compose.yml run --rm virgoyt-proposal-runner proposal \
  --project personal-workspace \
  --kind file_write \
  --title "Draft settings file" \
  --details "Propose creating a reviewed configuration file"
```

## Pairing and execution are intentionally unavailable

The commands `execute`, `apply`, and `connect` always return a refusal. A future paired runner must verify a single-use, project-scoped, expiring approval issued by the VirgoYT workspace before it can interact with a device. It must also display its requested capabilities to the owner and retain an audit event for every approval redemption. Do not add browser automation, shell execution, credential loading, or network access to this proposal-only script.
