#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Tinemu Deployment Script
# Usage: ./scripts/deploy.sh [branch]
#   branch: git branch to deploy (default: main)
#
# Steps:
#   1. Pull latest code from git
#   2. Build new Docker images
#   3. Run database migrations (Prisma)
#   4. Seed database if needed
#   5. Restart containers gracefully
#   6. Verify health endpoint
# =============================================================================
set -euo pipefail

# ---- Configuration ----
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BRANCH="${1:-main}"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
DOCKER_COMPOSE="docker compose"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log()  { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $*"; }
info() { log "${GREEN}INFO:${NC} $*"; }
warn() { log "${YELLOW}WARN:${NC} $*"; }
err()  { log "${RED}ERROR:${NC} $*"; exit 1; }

# ---- Pre-flight Checks ----
command -v docker >/dev/null 2>&1 || err "Docker is not installed"
command -v git    >/dev/null 2>&1 || err "Git is not installed"

if [ ! -f "$COMPOSE_FILE" ]; then
    err "docker-compose.yml not found at ${COMPOSE_FILE}"
fi

# ---- Step 1: Pull Latest Code ----
info "Pulling latest code from branch '${BRANCH}'..."
cd "$PROJECT_DIR"

# Stash any local changes (optional — uncomment if needed)
# git stash --include-untracked || true

git fetch origin
git checkout "$BRANCH"
git pull origin "$BRANCH"

# ---- Step 2: Build Docker Images ----
info "Building Docker images..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" build app --no-cache

# ---- Step 3: Start Database (if not already running) ----
info "Ensuring database is running..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d db

# Wait for database to be healthy
info "Waiting for database to be ready..."
WAIT_SECONDS=0
MAX_WAIT=60
until $DOCKER_COMPOSE -f "$COMPOSE_FILE" exec -T db pg_isready -U tinemu_user -d tinemu_db 2>/dev/null; do
    if [ "$WAIT_SECONDS" -ge "$MAX_WAIT" ]; then
        err "Database did not become healthy within ${MAX_WAIT}s"
    fi
    sleep 2
    WAIT_SECONDS=$((WAIT_SECONDS + 2))
done
info "Database is healthy."

# ---- Step 4: Run Database Migrations ----
info "Running Prisma database migrations..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" run --rm app npx prisma migrate deploy

# ---- Step 5: Seed Database (idempotent) ----
info "Seeding database..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" run --rm -e ADMIN_EMAIL -e ADMIN_PASSWORD app npx prisma db seed

# ---- Step 6: Start New Application Containers ----
info "Starting application services..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d app nginx

# ---- Step 7: Health Check ----
info "Verifying application health endpoint..."
WAIT_SECONDS=0
MAX_WAIT=90
HEALTH_URL="http://localhost:3000/api/health"

until curl -sf "$HEALTH_URL" >/dev/null 2>&1; do
    if [ "$WAIT_SECONDS" -ge "$MAX_WAIT" ]; then
        warn "Health check not passing after ${MAX_WAIT}s — check container logs"
        $DOCKER_COMPOSE -f "$COMPOSE_FILE" logs --tail=20 app
        err "Deployment may have issues. Run './scripts/rollback.sh' to revert."
    fi
    sleep 3
    WAIT_SECONDS=$((WAIT_SECONDS + 3))
done

info "Health check passed! Application is running."

# ---- Step 8: Clean Up Old Images ----
info "Removing old Docker images..."
docker image prune -f --filter "until=24h" || true

# ---- Done ----
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅  Deployment Complete!                         ${NC}"
echo -e "${GREEN}  🌐  https://tinemu.logix.id                      ${NC}"
echo -e "${GREEN}  🕐  $(date)                                      ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
