#!/usr/bin/env bash
# Copy-paste friendly: every command below can be run line-by-line in a terminal.
# Or run this whole file:  bash scripts/dev-commands.sh
#
# Repo root (adjust if you moved the project):
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$REPO_ROOT"

# --- 1) Docker (database, queue, storage, image worker) ---
docker compose up -d postgres redis minio minio-init worker

# --- 2) Load .env for API auth (Google sign-in, JWT) ---
set -a
[[ -f .env ]] && source .env
set +a
export JWT_SECRET="${JWT_SECRET:-dev-secret-change-me-at-least-32-characters-long}"
export GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-$VITE_GOOGLE_CLIENT_ID}"
[[ -d /opt/homebrew/opt/openjdk ]] && export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk}"

# --- 3) Backend (run in its own terminal tab) ---
# cd "$REPO_ROOT/backend" && mvn spring-boot:run

# --- 4) Frontend (run in another terminal tab) ---
# cd "$REPO_ROOT" && npm run dev

# URLs after servers are up:
#   Frontend  http://localhost:5173
#   Backend   http://localhost:8080

echo "Docker services started. Open two terminals and run:"
echo "  cd \"$REPO_ROOT/backend\" && mvn spring-boot:run"
echo "  cd \"$REPO_ROOT\" && npm run dev"
echo ""
echo "Or use: ./scripts/dev.sh all"
