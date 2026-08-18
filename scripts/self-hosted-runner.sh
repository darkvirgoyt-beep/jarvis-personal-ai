#!/usr/bin/env bash
# Jarvis self-hosted GitHub Actions runner.
# Lets the Jarvis machine (Termux, a VPS, or any Linux box) execute its own
# GitHub Actions jobs locally, so the AI can install tools and compile apps
# through the same pipeline used by GitHub.
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/self-hosted-runner.sh <github-username> <repository> <runner-token>

  github-username  e.g. darkvirgoyt-beep
  repository       e.g. jarvis-personal-ai
  runner-token     from GitHub -> Settings -> Actions -> Runners -> New self-hosted runner

Example:
  scripts/self-hosted-runner.sh darkvirgoyt-beep jarvis-personal-ai AAAA1234...
EOF
}

if [ "$#" -ne 3 ]; then usage; exit 1; fi

USERNAME="$1"; REPO="$2"; TOKEN="$3"
RUNNER_DIR="$HOME/actions-runner"
VERSION="2.322.0"

log() { printf '\033[1;36m[runner]\033[0m %s\n' "$*"; }

# ---- 1. Toolchain (compilers, node, pnpm) ----
log "Ensuring toolchain"
bash "$(dirname "$0")/bootstrap-environment.sh"

# ---- 2. Download GitHub Actions runner ----
mkdir -p "$RUNNER_DIR" && cd "$RUNNER_DIR"

if [ ! -f bin/Runner.Listener ]; then
  log "Downloading actions-runner v$VERSION"
  if [ -n "${TERMUX_VERSION:-}" ] || [ -d /data/data/com.termux ]; then
    curl -sSL -o runner.tar.gz "https://github.com/actions/runner/releases/download/v${VERSION}/actions-runner-linux-arm64-${VERSION}.tar.gz"
  else
    ARCH=$(uname -m)
    case "$ARCH" in
      aarch64|arm64) RUNNER_ARCH=arm64 ;;
      x86_64|amd64)  RUNNER_ARCH=x64 ;;
      *) echo "Unsupported architecture: $ARCH" >&2; exit 1 ;;
    esac
    curl -sSL -o runner.tar.gz "https://github.com/actions/runner/releases/download/v${VERSION}/actions-runner-linux-${RUNNER_ARCH}-${VERSION}.tar.gz"
  fi
  tar xzf runner.tar.gz
  rm runner.tar.gz
fi

# ---- 3. Configure and register ----
if [ ! -f .runner ]; then
  log "Configuring runner for $USERNAME/$REPO"
  ./config.sh --url "https://github.com/$USERNAME/$REPO" --token "$TOKEN" --name "jarvis-self-hosted" --unattended --replace
fi

# ---- 4. Run as a background service ----
log "Installing runner as a system service"
if command -v systemctl >/dev/null 2>&1; then
  sudo ./svc.sh install && sudo ./svc.sh start
  log "Runner service started. Status: sudo ./svc.sh status"
else
  warn "No systemd; starting runner in the background"
  nohup ./run.sh > runner.log 2>&1 &
  log "Runner started in background (logs: $RUNNER_DIR/runner.log)"
fi

log "Done. Your Jarvis machine can now compile and deploy via GitHub Actions."
log "To stop: ./svc.sh stop (systemd) or kill the run.sh process (non-systemd)."