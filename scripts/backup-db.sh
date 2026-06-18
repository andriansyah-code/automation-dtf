#!/usr/bin/env bash
# =============================================================================
# backup-db.sh — Tinemu PostgreSQL Database Backup
# Usage: ./scripts/backup-db.sh [backup-dir]
#   backup-dir: directory to store backups (default: ./backups)
#
# Creates timestamped pg_dump backups and prunes old ones (>14 days).
# Can be run via cron for automated daily backups:
#   0 3 * * * /path/to/tinemu/scripts/backup-db.sh
# =============================================================================
set -euo pipefail

# ---- Configuration ----
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${1:-${PROJECT_DIR}/backups}"
DB_CONTAINER="tinemu-db"
DB_USER="${POSTGRES_USER:-tinemu_user}"
DB_NAME="${POSTGRES_DB:-tinemu_db}"
RETENTION_DAYS=14

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $*"; }
info() { log "${GREEN}INFO:${NC} $*"; }
warn() { log "${YELLOW}WARN:${NC} $*"; }
err()  { log "${RED}ERROR:${NC} $*"; exit 1; }

# ---- Pre-flight Checks ----
command -v docker >/dev/null 2>&1 || err "Docker is not installed"

# Check if database container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    err "Database container '${DB_CONTAINER}' is not running."
    echo ""
    echo "Start the stack first:"
    echo "  cd ${PROJECT_DIR} && docker compose up -d db"
    exit 1
fi

# ---- Create Backup Directory ----
mkdir -p "$BACKUP_DIR"

# ---- Generate Timestamp ----
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.sql.gz"
BACKUP_INFO="${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.info"

# ---- Perform Backup ----
info "Starting database backup..."
info "  Container: ${DB_CONTAINER}"
info "  Database:  ${DB_NAME}"
info "  Output:    ${BACKUP_FILE}"

# Use pg_dump inside the container, pipe through gzip
docker exec "$DB_CONTAINER" pg_dump \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=custom \
    --compress=9 \
    --file="/tmp/${DB_NAME}-backup.dump" \
    --verbose 2>&1 | tail -5

# Copy the dump out of the container
docker cp "${DB_CONTAINER}:/tmp/${DB_NAME}-backup.dump" "${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.dump"

# Also create a plain SQL gzip backup for easy inspection
docker exec "$DB_CONTAINER" pg_dump \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --clean \
    --if-exists \
    | gzip > "$BACKUP_FILE"

# Clean up temp file inside container
docker exec "$DB_CONTAINER" rm -f "/tmp/${DB_NAME}-backup.dump" 2>/dev/null || true

# ---- Write Backup Info ----
{
    echo "Backup Timestamp: $(date)"
    echo "Database:         ${DB_NAME}"
    echo "Container:        ${DB_CONTAINER}"
    echo "Backup File:      ${BACKUP_FILE}"
    echo "Custom Format:    ${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.dump"
    echo "File Size:        $(du -h "$BACKUP_FILE" | cut -f1)"
    echo "PostgreSQL Version: $(docker exec "$DB_CONTAINER" psql --username="$DB_USER" --dbname="$DB_NAME" -c 'SELECT version();' -t 2>/dev/null | tr -d ' ')"
} > "$BACKUP_INFO"

# ---- Prune Old Backups ----
info "Pruning backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=0
while IFS= read -r -d '' OLD_FILE; do
    rm -f "$OLD_FILE"
    DELETED_COUNT=$((DELETED_COUNT + 1))
done < <(find "$BACKUP_DIR" -maxdepth 1 -name "${DB_NAME}-*.sql.gz" -o -name "${DB_NAME}-*.dump" -o -name "${DB_NAME}-*.info" -mtime +${RETENTION_DAYS} -print0)

if [ "$DELETED_COUNT" -gt 0 ]; then
    info "Removed ${DELETED_COUNT} old backup(s)."
else
    info "No old backups to prune."
fi

# ---- Done ----
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅  Backup Complete!                             ${NC}"
echo -e "${GREEN}  📦  File: ${BACKUP_FILE}        ${NC}"
echo -e "${GREEN}  💾  Size: ${BACKUP_SIZE}                         ${NC}"
echo -e "${GREEN}  🕐  $(date)                                      ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

# Restore command hint
echo ""
echo "To restore this backup:"
echo "  gunzip -c ${BACKUP_FILE} | docker exec -i ${DB_CONTAINER} psql --username=${DB_USER} --dbname=${DB_NAME}"
echo ""
echo "Or with custom format:"
echo "  docker exec -i ${DB_CONTAINER} pg_restore --username=${DB_USER} --dbname=${DB_NAME} < ${BACKUP_DIR}/${DB_NAME}-${TIMESTAMP}.dump"
