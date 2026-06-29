#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web"
PORT="${PORT:-3007}"
HOST="${HOST:-0.0.0.0}"
NAMED_TUNNEL_CONFIG="${NAMED_TUNNEL_CONFIG:-$HOME/.cloudflared/certification-dev.yml}"
NAMED_TUNNEL_NAME="${NAMED_TUNNEL_NAME:-certification-dev}"

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared is required. Install it with: brew install cloudflared" >&2
  exit 1
fi

if ! curl -fsS "http://127.0.0.1:${PORT}/certification-guide/es" >/dev/null 2>&1; then
  echo "Starting production study server on http://${HOST}:${PORT} ..."
  (
    cd "$WEB_DIR"
    ./node_modules/.bin/next start -p "$PORT" -H "$HOST"
  ) &
  SERVER_PID=$!

  for _ in {1..30}; do
    if curl -fsS "http://127.0.0.1:${PORT}/certification-guide/es" >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done

  if ! curl -fsS "http://127.0.0.1:${PORT}/certification-guide/es" >/dev/null 2>&1; then
    echo "Study server did not become ready on port ${PORT}." >&2
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    exit 1
  fi
else
  echo "Using existing study server on http://127.0.0.1:${PORT}"
fi

if [[ -f "$NAMED_TUNNEL_CONFIG" ]]; then
  echo "Opening named Cloudflare tunnel: $NAMED_TUNNEL_NAME"
  echo "Study URL: https://certification-dev.santi020k.com/certification-guide/es"
  cloudflared tunnel --config "$NAMED_TUNNEL_CONFIG" run "$NAMED_TUNNEL_NAME"
else
  echo "Opening Cloudflare quick tunnel to http://127.0.0.1:${PORT}"
  echo "Use the printed trycloudflare.com URL on your phone."
  cloudflared tunnel --url "http://127.0.0.1:${PORT}"
fi
