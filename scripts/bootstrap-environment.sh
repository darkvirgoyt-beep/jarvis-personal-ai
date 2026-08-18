#!/usr/bin/env bash
# Jarvis tool environment bootstrap.
# Installs the toolchain Jarvis needs to install packages and compile projects:
# Node.js, pnpm, git, plus platform compilers (Linux apt / Termux pkg).
# Safe to re-run: existing tools are left untouched.
set -euo pipefail

if [ -n "${TERMUX_VERSION:-}" ] || [ -d /data/data/com.termux ]; then
  IS_TERMUX=1
else
  IS_TERMUX=0
fi

log() { printf '\033[1;36m[env]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[env]\033[0m %s\n' "$*"; }

# ---- 1. Base package manager ----
if [ "$IS_TERMUX" -eq 1 ]; then
  log "Termux detected; refreshing pkg index"
  pkg update -y || warn "pkg update failed (network?)"
  pkg install -y nodejs-lts git build-essential python clang make which 2>/dev/null || pkg install -y nodejs git build-essential python clang make
else
  log "Linux detected; refreshing apt index"
  apt-get update -y
  apt-get install -y --no-install-recommends curl git ca-certificates build-essential python3 make
fi

# ---- 2. Node.js ----
if command -v node >/dev/null 2>&1; then
  log "Node.js already present: $(node --version)"
else
  if [ "$IS_TERMUX" -eq 1 ]; then
    pkg install -y nodejs-lts
  else
    log "Installing Node.js 20 LTS"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
  fi
fi

# ---- 3. pnpm ----
if command -v pnpm >/dev/null 2>&1; then
  log "pnpm already present: $(pnpm --version)"
else
  log "Installing pnpm via corepack"
  npm install -g pnpm@10.4.1
fi

# ---- 4. Git identity fallback ----
git config --global user.name  "${JARVIS_GIT_NAME:-Jarvis Builder}"  || true
git config --global user.email "${JARVIS_GIT_EMAIL:-jarvis@local.builder}" || true

# ---- 5. Rust (for compiling Rust tooling, optional) ----
if [ "$IS_TERMUX" -eq 0 ] && ! command -v cargo >/dev/null 2>&1; then
  log "Installing Rust toolchain"
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
  # shellcheck disable=SC1091
  [ -f "$HOME/.cargo/env" ] && . "$HOME/.cargo/env"
fi

log "Toolchain summary:"
command -v node && node --version || true
command -v pnpm && pnpm --version || true
command -v git && git --version || true
command -v make && make --version | head -1 || true
command -v cargo && cargo --version || true
command -v python3 && python3 --version || true

log "Done. Jarvis can now install packages (pnpm install) and compile projects (pnpm build / make)."