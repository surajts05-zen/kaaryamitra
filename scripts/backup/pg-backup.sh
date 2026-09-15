#!/usr/bin/env bash
# =============================================================================
# KaaryaMitra — PostgreSQL Backup Script
# =============================================================================
# Usage:
#   ./pg-backup.sh                   # Manual backup
#   ./pg-backup.sh --dry-run         # Print what would be done
#
# Required environment variables:
#   DATABASE_URL    — PostgreSQL connection string
#   S3_BUCKET       — S3 bucket name
#   S3_REGION       — AWS/S3 region
#   S3_ACCESS_KEY_ID
#   S3_SECRET_ACCESS_KEY
#
# Optional:
#   BACKUP_RETENTION_DAYS  — Days to keep backups (default: 30)
#   SLACK_WEBHOOK_URL      — Slack webhook for notifications
#   SMTP_FROM / SMTP_TO    — Email alert addresses
# =============================================================================

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_DIR="/tmp/km_backups"
BACKUP_FILE="kaaryamitra_${TIMESTAMP}.dump"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
S3_PREFIX="backups/postgres"
S3_KEY="${S3_PREFIX}/${BACKUP_FILE}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  echo "🔍 DRY RUN mode — no actual backup will be created"
fi

# ─── Validate required vars ───────────────────────────────────────────────────

for var in DATABASE_URL S3_BUCKET S3_REGION S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY; do
  if [[ -z "${!var:-}" ]]; then
    echo "❌ Required environment variable $var is not set"
    exit 1
  fi
done

# ─── Parse DB credentials from DATABASE_URL ───────────────────────────────────

# Expected format: postgresql://user:pass@host:port/dbname
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|postgresql://([^:]+):.*|\1|')
DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|postgresql://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):.*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+).*|\1|')

echo "=================================================="
echo "KaaryaMitra PostgreSQL Backup — ${TIMESTAMP}"
echo "Database: ${DB_NAME} @ ${DB_HOST}:${DB_PORT}"
echo "Target:   s3://${S3_BUCKET}/${S3_KEY}"
echo "=================================================="

if [[ "$DRY_RUN" == "true" ]]; then
  echo "✅ DRY RUN complete — actual backup skipped"
  exit 0
fi

# ─── Create backup directory ──────────────────────────────────────────────────

mkdir -p "$BACKUP_DIR"

# ─── Run pg_dump ──────────────────────────────────────────────────────────────

echo "📦 Starting pg_dump..."
PGPASSWORD="$DB_PASS" pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --compress=9 \
  --no-password \
  --file="$BACKUP_PATH"

BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
echo "✅ pg_dump complete — ${BACKUP_SIZE}"

# ─── Upload to S3 ─────────────────────────────────────────────────────────────

echo "☁️ Uploading to s3://${S3_BUCKET}/${S3_KEY}..."
AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
AWS_DEFAULT_REGION="$S3_REGION" \
aws s3 cp "$BACKUP_PATH" "s3://${S3_BUCKET}/${S3_KEY}" \
  --storage-class STANDARD_IA \
  --metadata "created_at=${TIMESTAMP},db=${DB_NAME},size=${BACKUP_SIZE}"

echo "✅ Upload complete"

# ─── Cleanup local file ───────────────────────────────────────────────────────

rm -f "$BACKUP_PATH"
echo "🧹 Local backup file removed"

# ─── Prune old backups from S3 ───────────────────────────────────────────────

echo "🗑️ Pruning backups older than ${RETENTION_DAYS} days..."
CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d 2>/dev/null || \
              date -v-${RETENTION_DAYS}d +%Y-%m-%d)

AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
AWS_DEFAULT_REGION="$S3_REGION" \
aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" | \
  while read -r line; do
    FILE_DATE=$(echo "$line" | awk '{print $1}')
    FILE_NAME=$(echo "$line" | awk '{print $4}')
    if [[ "$FILE_DATE" < "$CUTOFF_DATE" ]] && [[ -n "$FILE_NAME" ]]; then
      echo "  Deleting old backup: ${FILE_NAME} (${FILE_DATE})"
      AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY_ID" \
      AWS_SECRET_ACCESS_KEY="$S3_SECRET_ACCESS_KEY" \
      AWS_DEFAULT_REGION="$S3_REGION" \
      aws s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${FILE_NAME}"
    fi
  done

# ─── Slack / Email notification ───────────────────────────────────────────────

if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
  curl -s -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-type: application/json' \
    --data "{
      \"text\": \"✅ KaaryaMitra DB Backup Succeeded\",
      \"attachments\": [{
        \"color\": \"good\",
        \"fields\": [
          {\"title\": \"Timestamp\", \"value\": \"${TIMESTAMP}\", \"short\": true},
          {\"title\": \"Size\", \"value\": \"${BACKUP_SIZE}\", \"short\": true},
          {\"title\": \"S3 Key\", \"value\": \"${S3_KEY}\", \"short\": false}
        ]
      }]
    }" || true
fi

echo ""
echo "🎉 Backup completed successfully!"
echo "   File: ${S3_KEY}"
echo "   Size: ${BACKUP_SIZE}"
echo "   Timestamp: ${TIMESTAMP}"
