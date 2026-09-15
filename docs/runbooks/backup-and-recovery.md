# KaaryaMitra — Backup & Recovery Runbook

> **Audience:** On-call engineers, DevOps  
> **Recovery Time Objective (RTO):** < 2 hours  
> **Recovery Point Objective (RPO):** < 24 hours (daily backups)

---

## Backup Schedule

| Type | Frequency | Retention | Storage |
|---|---|---|---|
| PostgreSQL dump | Daily (via cron/docker-compose.backup.yml) | 30 days | S3 / object storage |
| Redis data | RDB snapshots (redis.conf) | On-disk (persistent volume) | Docker volume |
| S3 files | Managed by cloud provider versioning | Per provider policy | Tenant prefix |

---

## Trigger a Manual Backup

```bash
# From the server (or CI)
cd /path/to/kaaryamitra

source apps/api/.env
bash scripts/backup/pg-backup.sh
```

Or via Docker:
```bash
docker run --rm \
  --env-file apps/api/.env \
  -v $(pwd)/scripts/backup:/scripts \
  postgres:16-alpine \
  /scripts/pg-backup.sh
```

**Expected output:** `🎉 Backup completed successfully!`

---

## Verify a Backup

```bash
# List recent backups
source apps/api/.env
bash scripts/backup/pg-restore.sh --list

# Expected output lists timestamped .dump files in S3
```

To verify a specific backup without restoring to prod:

```bash
# Restore to a staging/test database
DATABASE_URL="postgresql://user:pass@staging-host/staging_db" \
  bash scripts/backup/pg-restore.sh kaaryamitra_2026-09-15_00-00-00.dump
```

---

## Recovery Procedure

> ⚠️ **Never restore directly to production without team sign-off.**

### Step 1: Declare incident

1. Post in #incidents channel
2. Set API to maintenance mode (update Dokploy env or add a maintenance page)
3. Identify the last known-good backup timestamp

### Step 2: Restore to staging first

```bash
# List available backups
bash scripts/backup/pg-restore.sh --list

# Restore latest to staging
DATABASE_URL="$STAGING_DATABASE_URL" \
  bash scripts/backup/pg-restore.sh --latest
```

### Step 3: Verify data integrity

```sql
-- Connect to staging DB and verify row counts
SELECT 'tenants' AS tbl, count(*) FROM tenants
UNION ALL SELECT 'users', count(*) FROM users
UNION ALL SELECT 'employees', count(*) FROM employees
UNION ALL SELECT 'leave_applications', count(*) FROM leave_applications;
```

### Step 4: Restore to production (if staging looks good)

```bash
# This will prompt for 'CONFIRM' before proceeding
bash scripts/backup/pg-restore.sh kaaryamitra_YYYY-MM-DD_HH-MM-SS.dump
```

### Step 5: Run pending migrations

```bash
npm run db:migrate:prod --workspace=apps/api
```

### Step 6: Restart API and verify health

```bash
# Check health endpoint
curl https://api.kaaryamitra.com/health

# Verify DB and Redis are healthy
curl https://api.kaaryamitra.com/health/ready
```

---

## Redis Recovery

Redis data is ephemeral for caching/queues. If Redis is lost:

1. BullMQ jobs will be lost — manually re-trigger repeatable jobs
2. Rate limit counters reset — acceptable (short window)
3. Sessions are stored in PostgreSQL (not Redis) — no session loss

```bash
# Restart Redis container
docker restart km_redis

# BullMQ repeatable jobs re-register on API startup automatically
docker restart km_api
```

---

## Post-Incident Checklist

- [ ] All tenants can log in
- [ ] `/health/ready` returns 200
- [ ] Spot-check 2-3 tenants' employee data
- [ ] Queue stats show no unexpected backlog
- [ ] Close the incident in #incidents
- [ ] Schedule a post-mortem within 48 hours
