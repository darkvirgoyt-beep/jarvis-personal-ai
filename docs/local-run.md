# Run Jarvis on Your Own Device

This guide runs the **full-stack Jarvis source** on your own Termux, macOS, Linux, or Windows environment. It does not copy the hosted project’s credentials, database, OAuth configuration, or managed storage into your device. You supply your own local or hosted MySQL-compatible database, provider key, session secret, and, if you use Manus sign-in, OAuth app settings.

> **Keep secrets local.** Never commit `.env`, `OPENROUTER_API_KEY`, `DATABASE_URL`, `JWT_SECRET`, OAuth secrets, or any database export. The public repository contains only the safe template under `docs/environment-template.txt`.

## What Runs Locally

| Capability | Local status | Boundary |
|---|---|---|
| Jarvis web UI, typed chat, Builder, memory, tasks, and workspace proposals | Supported | Requires a configured database and working auth path for private data. |
| Nemotron streaming | Supported | Requires your own valid server-side `OPENROUTER_API_KEY`; never expose it to the browser. |
| Browser push-to-talk and spoken replies | Supported where the browser permits it | Microphone permission and installed browser voices vary by device and browser. |
| Android companion source | Included under `mobile/` | A development build is separate from the web server; it does not receive server secrets. |
| Persistent virtual PC / software compilation | Not included by a local browser run | Attach or operate a separately approved computer environment; do not treat the browser workspace as a desktop VM. |
| Manus-managed OAuth, S3, analytics, and Forge services | Not automatically portable | Use your own equivalent configuration or keep using the hosted Jarvis deployment. |

## Shared Setup

Install **Node.js 22+**, Git, and pnpm 10. Then clone the source, install exact dependencies, and create a private environment file.

```bash
git clone https://github.com/darkvirgoyt-beep/jarvis-personal-ai.git
cd jarvis-personal-ai
corepack enable
corepack install
pnpm install --frozen-lockfile
cp docs/environment-template.txt .env
```

Edit `.env` with your own values. At minimum, authenticated workspace use needs `DATABASE_URL` and `JWT_SECRET`; live Nemotron responses also need `OPENROUTER_API_KEY`. The complete variable contract and security rules are in [`environment-setup.md`](./environment-setup.md).

Apply the committed schema to an empty local database, then start development:

```bash
pnpm drizzle-kit migrate
pnpm dev
```

Open the local address printed by the server, typically `http://localhost:3000`. Before a code change or local deployment, run:

```bash
pnpm vitest run --exclude server/openrouterCredential.test.ts
pnpm check
pnpm build
```

Run `server/openrouterCredential.test.ts` only after adding a valid key; it makes live provider requests and will fail for missing, rejected, or model-ineligible credentials.

## macOS and Linux

Install Node.js 22+ using your normal package manager or Node version manager, then follow **Shared Setup**. On Ubuntu/Debian, ensure build tools are available before installing native dependencies:

```bash
sudo apt update
sudo apt install -y git build-essential
```

Use a local MySQL 8 server, a local TiDB-compatible environment, or a TLS-protected remote database. Never use the managed production `DATABASE_URL` on an untrusted personal device.

## Windows (PowerShell)

Install the Node.js 22 LTS release and Git for Windows. In **PowerShell**, clone and prepare the repository as follows:

```powershell
git clone https://github.com/darkvirgoyt-beep/jarvis-personal-ai.git
Set-Location jarvis-personal-ai
corepack enable
corepack install
pnpm install --frozen-lockfile
Copy-Item docs/environment-template.txt .env
notepad .env
pnpm drizzle-kit migrate
pnpm dev
```

Keep the server terminal running while you use Jarvis in a current Chrome or Edge browser. Grant microphone permission only when you want push-to-talk; speech synthesis uses voices installed on Windows and in the selected browser.

## Android Termux

Termux runs the same Node-based server, but a remote MySQL/TiDB database is usually more practical than running a database beside the app on a phone. Install Termux from a maintained source, update packages, then install Git and the current Node LTS package.

```bash
pkg update && pkg upgrade
pkg install git nodejs-lts
git clone https://github.com/darkvirgoyt-beep/jarvis-personal-ai.git
cd jarvis-personal-ai
corepack enable
corepack install
pnpm install --frozen-lockfile
cp docs/environment-template.txt .env
nano .env
pnpm drizzle-kit migrate
pnpm dev
```

Open `http://127.0.0.1:3000` in the Android browser. Termux does not turn Jarvis into an always-on Android assistant: background execution can be stopped by Android, browser microphone access is controlled by the browser, and OS actions such as calls or messages remain confirmation-gated Android intent handoffs in the companion app.

## Local Security Checklist

Before sharing a screenshot, opening a port, or pushing a branch, verify that `.env` is absent from Git status:

```bash
git status --short
git diff --cached
```

Do not expose a development server to the public internet without TLS, authentication, firewall rules, and a review of callback URLs. For everyday use, the hosted server-backed Jarvis deployment remains the safer path: [Launch Jarvis](https://jarvisai-tyjkhyjq.manus.space).

## References

[1] [Node.js downloads](https://nodejs.org/en/download)

[2] [pnpm installation guide](https://pnpm.io/installation)

[3] [Termux package management](https://termux.dev/en/)

