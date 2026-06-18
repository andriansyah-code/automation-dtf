#!/usr/bin/env bash
# =============================================================================
# init-db.sh — PostgreSQL Initialization Script
# Run automatically by PostgreSQL Docker image on first container start.
# Creates extensions and any additional setup needed.
# =============================================================================
set -e

# Create UUID extension (needed for gen_random_uuid() if used)
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOSQL

echo "PostgreSQL initialization complete."
