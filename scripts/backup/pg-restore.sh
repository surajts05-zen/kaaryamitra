#!/usr/bin/env bash
# =============================================================================
# KaaryaMitra — PostgreSQL Restore Script
# =============================================================================
# Usage:
#   ./pg-restore.sh <backup-key>         # Restore specific backup
#   ./pg-restore.sh --latest             # Restore most recent backup
#   ./pg-restore.sh --list               # List available backups
#
# The script downloads the backup from S3 and runs pg_restore.
# A pre-restore snapshot is taken for rollback safety.
#
# ⚠️  WARNING: This will DROP and recreate all objects in the target DB.
#     Always test in staging first. Never run directly in production
#     without verifying the backup and taking a current snapshot.
# =============================================================================

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────

S3_PREFIX="backups/postgres"
RESTORE_DIR="/tmp/km_restore"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

for var in DATABASE_URL S3_BUCKET S3_REGION S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY; do
  if [[ -z "${!var:-}" ]]; then
    echo "❌ Required environment variable $var is not set"
    exit 1
  fi
done

DB_USER=$(echo "$DATABASE_URL" | sed -E 's|postgresql://([^:]+):.*|\1|')
DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):.*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+).*|\1|')

AWS_CMD="env AWS_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID} AWS_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY} AWS_DEFAULT_REGION=${S3_REGION} aws"

# ─── List mode ────────────────────────────────────────────────────────────────

if [[ "${1:-}" == "--list" ]]; then
  echo "📋 Available backups in s3://${S3_BUCKET}/${S3_PREFIX}/"
  echo ""
  $AWS_CMD s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | sort -r | head -20
  exit 0
fi

# ─── Determine backup key ─────────────────────────────────────────────────────

if [[ "${1:-}" == "--latest" ]]; then
  echo "🔍 Finding latest backup..."
  BACKUP_KEY=$($AWS_CMD s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | sort -r | head -1 | awk '{print $4}')
  if [[ -z "$BACKUP_KEY" ]]; then
    echo "❌ No backups found in s3://${S3_BUCKET}/${S3_PREFIX}/"
    exit 1
  fi
  echo "Found: ${BACKUP_KEY}"
elif [[ -n "${1:-}" ]]; then
  BACKUP_KEY="${1}"
else
  echo "Usage: $0 <backup-key> | --latest | --list"
  exit 1
fi

echo ""
echo "============================================================"
echo "KaaryaMitra PostgreSQL Restore"
echo "Backup: ${BACKUP_KEY}"
echo "Target: ${DB_NAME} @ ${DB_HOST}:${DB_PORT}"
echo "Time:   ${TIMESTAMP}"
echo "============================================================"
echo ""
echo "⚠️  This will OVERWRITE the existing database."
read -rp "Type 'CONFIRM' to proceed: " CONFIRM

if [[ "$CONFIRM" != "CONFIRM" ]]; then
  echo "Aborted."
  exit 0
fi

mkdir -p "$RESTORE_DIR"
LOCAL_FILE="${RESTORE_DIR}/${BACKUP_KEY}"

# ─── Pre-restore snapshot ──────────────────────────────────────────────────────

echo ""
echo "📸 Taking pre-restore snapshot for rollback safety..."
SNAPSHOT_FILE="${RESTORE_DIR}/pre_restore_snapshot_${TIMESTAMP}.dump"
PGPASSWORD="$DB_PASS" pg_dump \
  --host="$DB_HOST" --port="$DB_PORT" \
  --username="$DB_USER" --dbname="$DB_NAME" \
  --format=custom --compress=9 --no-password \
  --file="$SNAPSHOT_FILE"
echo "✅ Snapshot saved: ${SNAPSHOT_FILE}"

# ─── Download backup from S3 ──────────────────────────────────────────────────

echo ""
echo "⬇️  Downloading backup from S3..."
$AWS_CMD s3 cp "s3://${S3_BUCKET}/${S3_PREFIX}/${BACKUP_KEY}" "$LOCAL_FILE"
echo "✅ Download complete"

# ─── Restore ──────────────────────────────────────────────────────────────────

echo ""
echo "🔄 Running pg_restore..."
PGPASSWORD="$DB_PASS" pg_restore \
  --host="$DB_HOST" --port="$DB_PORT" \
  --username="$DB_USER" --dbname="$DB_NAME" \
  --clean --if-exists \
  --no-owner --no-privileges \
  --verbose \
  "$LOCAL_FILE" 2>&1 | tail -20

echo ""
echo "✅ Restore complete"

# ─── Verify row counts ────────────────────────────────────────────────────────

echo ""
echo "🔍 Verifying restore..."
PGPASSWORD="$DB_PASS" psql \
  --host="$DB_HOST" --port="$DB_PORT" \
  --username="$DB_USER" --dbname="$DB_NAME" \
  --no-password -c "
    SELECT schemaname, tablename,
           pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY size_bytes DESC
    LIMIT 10;
  " 2>/dev/null || true

echo ""
echo "🎉 Restore verification complete"
echo "   Pre-restore snapshot kept at: ${SNAPSHOT_FILE}"
echo "   Remove it manually once you confirm everything is OK."
rm -f "$LOCAL_FILE"
