#!/usr/bin/env bash
# =============================================================================
# rollback.sh — Tinemu Rollback Script
# Usage: ./scripts/rollback.sh [version-tag]
#   version-tag: Docker image tag to rollback to (e.g. v1.2.3)
#   If not specified, uses the previous image (tinemu/app:previous)
#
# Steps:
#   1. Tag current 'latest' as 'previous' if not already done
#   2. Pull or reference the target image
#   3. Recreate containers with the target image
#   4. Verify health endpoint
# =============================================================================
set -euo pipefail

# ---- Configuration ----
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"
DOCKER_COMPOSE="docker compose"
IMAGE_NAME="tinemu/app"
TARGET_TAG="${1:-previous}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $*"; }
info() { log "${GREEN}INFO:${NC} $*"; }
warn() { log "${YELLOW}WARN:${NC} $*"; }
err()  { log "${RED}ERROR:${NC} $*"; exit 1; }

# ---- Pre-flight Checks ----
command -v docker >/dev/null 2>&1 || err "Docker is not installed"

if [ ! -f "$COMPOSE_FILE" ]; then
    err "docker-compose.yml not found at ${COMPOSE_FILE}"
fi

cd "$PROJECT_DIR"

# ---- Step 1: Check Target Image Exists ----
TARGET_IMAGE="${IMAGE_NAME}:${TARGET_TAG}"
info "Rollback target: ${TARGET_IMAGE}"

if ! docker image inspect "$TARGET_IMAGE" >/dev/null 2>&1; then
    err "Image ${TARGET_IMAGE} not found locally."
    echo ""
    echo "Available images:"
    docker images "${IMAGE_NAME}" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}"
    exit 1
fi

# ---- Step 2: Tag Current Latest as Backup ----
if docker image inspect "${IMAGE_NAME}:latest" >/dev/null 2>&1; then
    BACKUP_TAG="pre-rollback-$(date +%Y%m%d-%H%M%S)"
    info "Tagging current latest as ${IMAGE_NAME}:${BACKUP_TAG}"
    docker tag "${IMAGE_NAME}:latest" "${IMAGE_NAME}:${BACKUP_TAG}"
fi

# ---- Step 3: Tag Target as Latest ----
info "Tagging ${TARGET_IMAGE} as latest..."
docker tag "$TARGET_IMAGE" "${IMAGE_NAME}:latest"

# ---- Step 4: Recreate App Container ----
info "Recreating app container with target image..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d app --force-recreate

# ---- Step 5: Wait and Health Check ----
info "Waiting for application to start..."
WAIT_SECONDS=0
MAX_WAIT=90
HEALTH_URL="http://localhost:3000/api/health"

until curl -sf "$HEALTH_URL" >/dev/null 2>&1; do
    if [ "$WAIT_SECONDS" -ge "$MAX_WAIT" ]; then
        warn "Health check failed after ${MAX_WAIT}s for rollback image."
        warn "Previous image is tagged as ${IMAGE_NAME}:${BACKUP_TAG}"
        warn "Run the following to restore:"
        echo ""
        echo "  docker tag ${IMAGE_NAME}:${BACKUP_TAG} ${IMAGE_NAME}:latest"
        echo "  docker compose -f ${COMPOSE_FILE} up -d app --force-recreate"
        echo ""
        err "Rollback may have issues. Manual intervention required."
    fi
    sleep 3
    WAIT_SECONDS=$((WAIT_SECONDS + 3))
done

# ---- Step 6: Verify Nginx Is Running ----
info "Ensuring nginx is running..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" up -d nginx

# ---- Done ----
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅  Rollback Complete!                           ${NC}"
echo -e "${GREEN}  🎯  Rolled back to: ${TARGET_IMAGE}              ${NC}"
echo -e "${GREEN}  💾  Previous version: ${IMAGE_NAME}:${BACKUP_TAG:-N/A}${NC}"
echo -e "${GREEN}  🕐  $(date)                                      ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
