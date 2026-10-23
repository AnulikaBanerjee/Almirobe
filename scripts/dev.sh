#!/usr/bin/env bash
# Almirobe local dev — run from repo root or anywhere:
#   ./scripts/dev.sh docker    # Postgres, Redis, MinIO, worker
#   ./scripts/dev.sh backend   # Spring API on :8080
#   ./scripts/dev.sh frontend  # Vite on :5173
#   ./scripts/dev.sh all       # docker + backend + frontend (background)
#   ./scripts/dev.sh stop      # stop background API/FE and optional docker
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

LOG_DIR="$ROOT/scripts/.logs"
PID_BACKEND="$LOG_DIR/backend.pid"
PID_FRONTEND="$LOG_DIR/frontend.pid"

sync_auth_env_file() {
  local env_file="$ROOT/.env"
  [[ -f "$env_file" ]] || return 0
  if ! grep -q '^GOOGLE_CLIENT_ID=' "$env_file" 2>/dev/null; then
    local cid
    cid="$(grep -E '^VITE_GOOGLE_CLIENT_ID=' "$env_file" | cut -d= -f2- | tr -d '"' | tr -d "'")"
    if [[ -n "$cid" ]]; then
      echo "GOOGLE_CLIENT_ID=$cid" >>"$env_file"
      echo "Added GOOGLE_CLIENT_ID to .env (copied from VITE_GOOGLE_CLIENT_ID)."
    fi
  fi
  if ! grep -q '^JWT_SECRET=' "$env_file" 2>/dev/null; then
    echo 'JWT_SECRET=dev-secret-change-me-at-least-32-characters-long' >>"$env_file"
    echo "Added JWT_SECRET to .env (dev default)."
  fi
}

load_env() {
  sync_auth_env_file
  if [[ -f "$ROOT/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT/.env"
    set +a
  fi
  export JWT_SECRET="${JWT_SECRET:-dev-secret-change-me-at-least-32-characters-long}"
  export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-${VITE_GOOGLE_CLIENT_ID:-}}"
  if [[ -d /opt/homebrew/opt/openjdk ]]; then
    export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk}"
  fi
}

cmd_docker() {
  echo "Starting Docker services (postgres, redis, minio, minio-init, worker)…"
  docker compose up -d postgres redis minio minio-init worker
  docker compose ps
}

cmd_backend() {
  load_env
  if [[ -z "$GOOGLE_CLIENT_ID" ]]; then
    echo "Warning: GOOGLE_CLIENT_ID is empty — set it in .env as VITE_GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID for Google sign-in."
  fi
  echo "Starting backend → http://localhost:8080"
  cd "$ROOT/backend"
  exec mvn -q spring-boot:run
}

cmd_frontend() {
  load_env
  echo "Starting frontend → http://localhost:5173"
  cd "$ROOT"
  exec npm run dev
}

running_pid() {
  local file="$1"
  [[ -f "$file" ]] && kill -0 "$(cat "$file")" 2>/dev/null
}

cmd_all() {
  mkdir -p "$LOG_DIR"
  cmd_docker
  load_env

  if running_pid "$PID_BACKEND"; then
    echo "Backend already running (pid $(cat "$PID_BACKEND"))."
  else
    echo "Starting backend in background (log: $LOG_DIR/backend.log)…"
    cd "$ROOT/backend"
    nohup mvn -q spring-boot:run >>"$LOG_DIR/backend.log" 2>&1 &
    echo $! >"$PID_BACKEND"
    cd "$ROOT"
  fi

  if running_pid "$PID_FRONTEND"; then
    echo "Frontend already running (pid $(cat "$PID_FRONTEND"))."
  else
    echo "Starting frontend in background (log: $LOG_DIR/frontend.log)…"
    cd "$ROOT"
    nohup npm run dev >>"$LOG_DIR/frontend.log" 2>&1 &
    echo $! >"$PID_FRONTEND"
  fi

  echo ""
  echo "Frontend:  http://localhost:5173"
  echo "Backend:   http://localhost:8080"
  echo "Logs:      tail -f $LOG_DIR/backend.log $LOG_DIR/frontend.log"
  echo "Stop:      ./scripts/dev.sh stop"
}

cmd_stop() {
  if [[ -f "$PID_FRONTEND" ]]; then
    pid=$(cat "$PID_FRONTEND")
    if kill -0 "$pid" 2>/dev/null; then kill "$pid" 2>/dev/null || true; fi
    rm -f "$PID_FRONTEND"
  fi
  if [[ -f "$PID_BACKEND" ]]; then
    pid=$(cat "$PID_BACKEND")
    if kill -0 "$pid" 2>/dev/null; then kill "$pid" 2>/dev/null || true; fi
    rm -f "$PID_BACKEND"
  fi
  echo "Stopped background frontend/backend (if any)."
  echo "To stop Docker: docker compose -f \"$ROOT/docker-compose.yml\" stop"
}

usage() {
  cat <<EOF
Usage: ./scripts/dev.sh <command>

  docker     Start Postgres, Redis, MinIO, worker (Docker)
  backend    Run Spring Boot API (foreground)
  frontend   Run Vite dev server (foreground)
  all        Docker + API + FE in background
  stop       Stop background API/FE started with 'all'

Two-terminal workflow (recommended while coding):
  ./scripts/dev.sh docker
  ./scripts/dev.sh backend    # terminal 1
  ./scripts/dev.sh frontend   # terminal 2
EOF
}

case "${1:-}" in
  docker) cmd_docker ;;
  backend) cmd_backend ;;
  frontend) cmd_frontend ;;
  all) cmd_all ;;
  stop) cmd_stop ;;
  *) usage; exit 1 ;;
esac
