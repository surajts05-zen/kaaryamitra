# KaaryaMitra — OWASP Top 10 Security Checklist

> **Last reviewed:** September 2026  
> **Reviewed by:** Engineering Team  
> **Next review:** March 2027

---

## A01 — Broken Access Control

| Control | Status | Implementation |
|---|---|---|
| Row-level tenant isolation (every query scoped by `tenantId`) | ✅ Pass | All Prisma queries include `where: { tenantId }` enforced server-side |
| Tenant cross-access prevention | ✅ Pass | `resolveTenant` middleware cross-checks JWT `tenantId` vs path slug |
| Super Admin access requires explicit `isSuperAdmin` flag | ✅ Pass | `requireSuperAdmin` middleware in `auth.ts` |
| RBAC permission enforcement | ✅ Pass | `requirePermission` middleware with action-based permission checks |
| Integration tests for tenant isolation | ✅ Pass | `src/__tests__/tenant-isolation.test.ts` |
| Frontend never trusted for `tenantId` | ✅ Pass | `tenantId` derived server-side only from JWT or path slug |

---

## A02 — Cryptographic Failures

| Control | Status | Implementation |
|---|---|---|
| Passwords hashed with bcrypt (cost factor 10+) | ✅ Pass | `bcryptjs` in auth service |
| API keys hashed with bcrypt before storage | ✅ Pass | API key prefix lookup + bcrypt compare |
| JWTs signed with strong secrets (min 32 chars) | ✅ Pass | `JWT_ACCESS_SECRET` min 32 chars enforced by Zod in `env.ts` |
| Refresh tokens stored as one-way hash | ✅ Pass | Session model stores hashed refresh token |
| No plaintext secrets in code | ✅ Pass | All secrets via environment variables |
| HTTPS enforced in production (HSTS) | ✅ Pass | Helmet HSTS header enabled for production |
| Webhook payloads signed with HMAC-SHA256 | ✅ Pass | `X-KM-Signature: sha256=<hmac>` on all webhook deliveries |

---

## A03 — Injection

| Control | Status | Implementation |
|---|---|---|
| SQL injection — all queries via Prisma ORM (parameterized) | ✅ Pass | No raw SQL except `prisma.$queryRaw\`SELECT 1\`` health probe |
| Input validation with Zod on all request bodies | ✅ Pass | Every route handler has a Zod schema |
| NoSQL injection (N/A — using PostgreSQL) | ✅ N/A | — |
| XSS — Content-Type JSON for all API responses | ✅ Pass | Express JSON response only |
| File upload validation (type + size limits) | ✅ Pass | Multer with file type filtering and `10mb` body limit |

---

## A04 — Insecure Design

| Control | Status | Implementation |
|---|---|---|
| Principle of least privilege enforced | ✅ Pass | RBAC with granular action permissions |
| Separation of Super Admin vs Company Admin vs Employee | ✅ Pass | Separate role levels, enforced at middleware |
| AI outputs require human approval before publish | ✅ Pass | AI never auto-publishes; all outputs are Draft |
| Payroll finalization is irreversible (immutable once FINALIZED) | ✅ Pass | Status guard prevents modification after FINALIZED |
| No business logic in frontend | ✅ Pass | All calculations server-side |

---

## A05 — Security Misconfiguration

| Control | Status | Implementation |
|---|---|---|
| Helmet security headers | ✅ Pass | `helmet()` with full CSP in production |
| CORS whitelist | ✅ Pass | `CORS_ORIGIN` env, explicit methods and headers |
| Error details hidden in production | ✅ Pass | `errorHandler.ts` strips `details` when `isProd` |
| Default credentials changed | ✅ Pass | No default passwords; secrets in `.env` only |
| `trust proxy` set for accurate IP behind reverse proxy | ✅ Pass | `app.set('trust proxy', 1)` |
| No debug routes in production | ✅ Pass | OpenAPI docs accessible; no dump/debug routes |
| Environment variable validation at startup | ✅ Pass | Zod schema in `env.ts`; exits on invalid config |

---

## A06 — Vulnerable and Outdated Components

| Control | Status | Implementation |
|---|---|---|
| Dependency vulnerability scanning | ⚠️ Ongoing | Run `npm audit --workspaces` regularly; 11 current moderate-level issues |
| Action required | 🔧 Needed | `npm audit fix` to address non-breaking issues |
| Dependabot / automated updates | 📋 Planned | Enable GitHub Dependabot alerts |

---

## A07 — Identification and Authentication Failures

| Control | Status | Implementation |
|---|---|---|
| Auth endpoint rate limiting (10 req/15min per IP) | ✅ Pass | `authRateLimiter` on all `/api/v1/auth/*` routes |
| Password reset rate limiting (3 req/hour per IP) | ✅ Pass | `passwordResetRateLimiter` |
| JWT expiry enforced (7 days default) | ✅ Pass | `JWT_ACCESS_EXPIRES_IN` in env |
| Refresh token rotation | ✅ Pass | Existing session revocation on refresh |
| Session revocation on logout | ✅ Pass | `revokedAt` set on logout |
| Google OAuth for secure SSO | ✅ Pass | `google-auth-library` integration |

---

## A08 — Software and Data Integrity Failures

| Control | Status | Implementation |
|---|---|---|
| `package-lock.json` committed and enforced | ✅ Pass | Lock file in repository |
| Webhook signatures verified before processing | ✅ Pass | Razorpay webhook signature verification |
| Prisma migration integrity (migration lock file) | ✅ Pass | `migration_lock.toml` committed |

---

## A09 — Security Logging and Monitoring Failures

| Control | Status | Implementation |
|---|---|---|
| Structured JSON logging with pino | ✅ Pass | `pino` with JSON output in production |
| Sensitive fields redacted from HTTP logs | ✅ Pass | `Authorization`, `cookie`, `x-api-key` redacted in `pinoHttp` |
| Audit log for all state-changing operations | ✅ Pass | `AuditLog` model with immutable records |
| Error logging with context | ✅ Pass | `errorHandler.ts` logs non-operational errors |
| Slow query logging | ✅ Pass | Prisma `$on('query')` event with threshold alerting |
| Alert on repeated auth failures | 📋 Planned | Add alerting for sustained 401 bursts (via log aggregator) |

---

## A10 — Server-Side Request Forgery (SSRF)

| Control | Status | Implementation |
|---|---|---|
| User-supplied URLs only via webhook endpoints | ✅ Pass | Webhook endpoints are admin-configured, not user-provided |
| Webhook URLs not validated against internal ranges | ⚠️ Gap | Consider blocking `127.0.0.1`, `169.254.*`, `10.*`, `192.168.*` |
| Action required | 🔧 Needed | Add URL validation in webhook endpoint creation to block private IP ranges |

---

## Summary

| Category | Status |
|---|---|
| A01 Broken Access Control | ✅ Pass |
| A02 Cryptographic Failures | ✅ Pass |
| A03 Injection | ✅ Pass |
| A04 Insecure Design | ✅ Pass |
| A05 Security Misconfiguration | ✅ Pass |
| A06 Vulnerable Components | ⚠️ Needs `npm audit fix` |
| A07 Auth Failures | ✅ Pass |
| A08 Integrity Failures | ✅ Pass |
| A09 Security Logging | ✅ Pass |
| A10 SSRF | ⚠️ Webhook URL validation gap |

**Next actions:**
1. Run `npm audit fix --workspaces`
2. Add private IP range validation on webhook endpoint creation
3. Enable GitHub Dependabot
