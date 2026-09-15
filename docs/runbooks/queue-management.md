# KaaryaMitra — Queue Management Runbook

> **Audience:** On-call engineers, DevOps  
> **Applies to:** All BullMQ queues in the KaaryaMitra API

---

## Queues

| Queue Name | Purpose | Schedule |
|---|---|---|
| `billing-meter` | Trial expiry, usage metering, invoice generation | Daily @ midnight |
| `webhook-retry` | Retry failed webhook deliveries with exponential backoff | Every 5 minutes |
| `document-expiry` | Send expiry notifications, mark documents EXPIRED | Daily @ 7 AM |

---

## Inspect Queue Status

### Via Admin API (Super Admin JWT required)

```bash
# All queue stats
curl -H "Authorization: Bearer <SUPER_ADMIN_JWT>" \
  https://api.kaaryamitra.com/api/v1/admin/queues

# Failed jobs in a specific queue
curl -H "Authorization: Bearer <SUPER_ADMIN_JWT>" \
  "https://api.kaaryamitra.com/api/v1/admin/queues/billing-meter/failed?limit=10"
```

### Via Health Check

```bash
curl https://api.kaaryamitra.com/health | jq .queues
```

### Via Redis CLI (direct access)

```bash
# Connect to Redis
redis-cli -u $REDIS_URL

# List all BullMQ keys
KEYS bull:*

# Count jobs in a queue state
LLEN bull:billing-meter:wait
ZCOUNT bull:billing-meter:active -inf +inf
ZCOUNT bull:billing-meter:failed -inf +inf
```

---

## Retry Failed Jobs

### Via Admin API

```bash
# Retry a specific failed job
curl -X POST \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT>" \
  https://api.kaaryamitra.com/api/v1/admin/queues/webhook-retry/failed/<JOB_ID>/retry

# Discard/remove a failed job
curl -X DELETE \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT>" \
  https://api.kaaryamitra.com/api/v1/admin/queues/webhook-retry/failed/<JOB_ID>
```

---

## Pause / Resume Queues

Useful during deployments or when a queue is flooding with errors.

```bash
# Pause queue (new jobs won't be processed)
curl -X POST \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT>" \
  https://api.kaaryamitra.com/api/v1/admin/queues/billing-meter/pause

# Resume queue
curl -X POST \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT>" \
  https://api.kaaryamitra.com/api/v1/admin/queues/billing-meter/resume
```

---

## Common Issues

### "Billing meter failed for all tenants"

1. Check Redis connectivity: `GET /health` → check `services.redis.status`
2. Check Prisma connectivity: `GET /health` → check `services.database.status`
3. Look at failed job details via the admin API
4. If it's a transient error (e.g., DB was briefly down), use the retry endpoint
5. If billing meter keeps failing, manually trigger by requeuing via admin API

### "Webhook retries keep failing for one endpoint"

1. Check if the customer endpoint is down: try `curl <endpoint_url>` manually
2. If endpoint is permanently down, notify the customer and deactivate via the DB
3. Discard the stuck delivery via the admin API

### "Queue depth growing out of control"

1. Pause the affected queue immediately
2. Inspect failed jobs for the root cause
3. Fix the underlying issue
4. Resume the queue — BullMQ will process backed-up jobs automatically

---

## Emergency: Reset a Queue

> ⚠️ **Last resort only — this discards all pending and failed jobs**

```bash
redis-cli -u $REDIS_URL

# Remove all job data for a queue (DESTRUCTIVE)
KEYS bull:webhook-retry:* | xargs redis-cli -u $REDIS_URL del
```
