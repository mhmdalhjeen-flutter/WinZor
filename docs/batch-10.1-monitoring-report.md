# Batch 10.1 — Monitoring Foundation Report (Logging Infrastructure)

> Completed: **2026-07-04**  
> Scope: verify existing logging infrastructure only — no new features, API, schema, or UI changes.  
> Foundation implemented in **Security Batch 4.5** (2026-07-04).

---

## Summary

| Goal | Status | Notes |
|------|--------|-------|
| Structured application logging | **Pass** | Central `safeLog` — JSON lines, sanitization, levels |
| Request logging | **Pass** | All `/api/*` requests logged on response finish |
| Error logging | **Pass** | Global handler + service-level structured errors |
| Security event logging | **Pass** | Persisted to `ActivityLog` (`category: security`) |
| Audit logging | **Pass** | Admin + sensitive ops persisted to `ActivityLog` |
| Production-ready consistency | **Pass** | No raw `console.*` in runtime backend code |

**Verdict:** Logging infrastructure is **complete and production-ready** for Batch 10.1. No code changes required in this batch.

---

## Architecture Overview

```
HTTP Request
    │
    ▼
requestLog.middleware.js ──► safeLog("http_request", …)     [stdout JSON]
    │
    ▼
Route handlers / middleware
    │
    ├─ auth / role / ownership / rateLimit ──► auditService.logSecurityEvent ──► ActivityLog (MongoDB)
    ├─ login / password / sensitive gate ──► logAuthAttempt / logSecurityEvent ──► ActivityLog
    ├─ admin mutating routes ──► adminAuditMiddleware ──► logAdminAction ──► ActivityLog
    └─ checkout / redeem / orders ──► logSensitiveOperation ──► ActivityLog
    │
    ▼
Global error handler (server.js) ──► safeLog("server_error"|"request_error") + security audit on CORS/body reject
```

**Two log sinks:**

1. **Process stdout/stderr** — structured JSON via `safeLog` (for PM2/Docker/log aggregator ingestion).
2. **MongoDB `ActivityLog` collection** — durable audit/security trail queryable from admin panel (`/api/admin/audit/*`).

---

## 1. Structured Application Logging

**Source:** `backend/src/utils/logSanitize.util.js`

| Property | Value |
|----------|-------|
| Format | Single-line JSON: `{ "at": ISO8601, "event": "…", …payload }` |
| Levels | `info` → stdout, `warn` → stderr, `error` → stderr |
| Sanitization | Keys matching `password\|token\|secret\|authorization\|cookie\|otp\|code\|credential\|key\|image\|avatar\|logo\|cover\|base64` → `[redacted]` |
| String limits | Max 500 chars; data URLs → `[redacted:data-url]`; max depth 4; max array 20 |
| Identifiers | `maskIdentifier()` masks emails/phones in audit-facing logs |

**Verification:** Runtime backend code uses `safeLog` exclusively. The only direct `console.*` calls outside `logSanitize.util.js` are in `backend/scripts/benchmark-batch9.js` (CLI tool — acceptable).

---

## 2. Request Logging

**Source:** `backend/src/middleware/requestLog.middleware.js`  
**Wiring:** `server.js` line 94 — global, before route mounting.

| Field | Included |
|-------|----------|
| `event` | `http_request` |
| `method` | Yes |
| `path` | Yes (query string stripped) |
| `status` | Yes |
| `durationMs` | Yes (hrtime precision) |
| `ip` | Yes (`getClientIp`) |
| `userId` / `role` | Yes when `req.user` is set |
| Request body / headers | **No** (by design — security) |

**Level mapping:**

| Status range | Level |
|--------------|-------|
| 2xx–3xx | `info` |
| 4xx | `warn` |
| 5xx | `error` |

**Scope:** Only paths starting with `/api`. Root `/` and static responses are excluded.

**Observation (informational):** Middleware runs globally before per-route `authMiddleware`, so `userId`/`role` are typically **null** in request logs unless auth ran earlier on that path. Identity correlation for authenticated traffic is available via `ActivityLog` security/audit entries. Moving request logging after auth would be a middleware-order change — out of scope for this batch.

---

## 3. Error Logging

### Global error handler (`server.js`)

| Event | Level | When |
|-------|-------|------|
| `server_error` | error | HTTP ≥ 500 |
| `request_error` | warn | HTTP 4xx (incl. CORS 403) |

Payload: `message`, `status`, `method`, `path`, `stack` (development only).

CORS rejections and oversized bodies additionally trigger `logSecurityEvent`.

### Service / infrastructure errors (`safeLog`)

| Event | Level | Source |
|-------|-------|--------|
| `startup_config_error` | error | Missing `JWT_SECRET` |
| `startup_config_warning` | warn | Missing `CORS_ORIGINS` |
| `seed_admin_skipped` / `seed_admin_error` / `seed_admin_created` | warn/error/info | Admin seed |
| `server_start_failed` | error | Startup catch |
| `mongodb_connection_failed` / `mongodb_connected` | error/info | `config/db.js` |
| `auth_token_rejected` | warn | `auth.middleware.js` |
| `cart_service_error` | error | `cart.routes.js` |
| `chat_send_failed` | error | `chat.controller.js` |
| `notification_*_failed` | error | `notification.service.js` (4 events) |
| `google_auth_failed` / `facebook_auth_failed` / `tiktok_auth_failed` | error | `auth.controller.js` |
| `audit_write_failed` / `admin_audit_failed` | error | `audit.service.js`, `adminAudit.middleware.js` |
| `user_activity_log_failed` | error | `activity.service.js` |
| `code_order_export_failed` | error | `codeOrder.controller.js` |
| `offer_monitor_failed` / `bazaar_monitor_failed` / `competition_monitor_failed` / `wheel_monitor_failed` | error | Cron monitors |
| `offer_monitor_expired` / `offer_monitor_warning_sent` / etc. | info | Cron monitors (success paths) |
| `store_prefix_backfill_completed` / `referral_backfill_completed` | info | Startup backfills |
| `sms_dev_simulated` / `email_dev_simulated` | info | Dev-only comms (masked recipient) |

**Production safety:** Client responses for 500 errors return generic Arabic message; stack traces omitted from logs in production (`NODE_ENV=production`).

---

## 4. Security Event Logging

**Source:** `auditService.logSecurityEvent` → `ActivityLog` with `category: "security"`.

| Trigger | Action (sample) | Source file |
|---------|-----------------|-------------|
| Blocked account login attempt | `فشل المصادقة — حساب محظور` | `auth.middleware.js` |
| Invalid/expired/revoked JWT | `فشل المصادقة` | `auth.middleware.js` |
| Non-admin on admin route | `محاولة وصول إداري غير مصرح` | `admin.middleware.js` |
| Wrong role for route | `انتهاك صلاحيات الدور` | `role.middleware.js` |
| Cross-store / cross-user access | `انتهاك ملكية المورد` | `ownership.middleware.js` |
| Rate limit exceeded | `Rate limit exceeded` | `rateLimit.middleware.js` |
| CORS origin rejected | `CORS origin rejected` | `server.js` |
| Oversized request body | `Request body rejected` | `server.js` |
| Failed admin password change | `محاولة فاشلة لتغيير كلمة مرور الأدمن` | `password.controller.js` |
| Failed sensitive gate password | `محاولة فاشلة للوصول لصفحة محمية` / sensitive change | `admin-sensitive.controller.js` |
| Repeated failed logins (≥5 / 24h) | `نشاط مشبوه: محاولات دخول فاشلة متكررة` | `audit.service.js` |

**Auth attempts** (`logAuthAttempt`): stored as `category: "admin_login"` for admin app type, otherwise `category: "security"`. Includes IP, user-agent, device/browser/OS, masked identifier, success/failure.

**Admin query endpoints:** `GET /api/admin/audit/security`, `/audit/login`, `/audit/activity`, `/audit/export`.

---

## 5. Audit Logging

**Model:** `backend/src/models/ActivityLog.js`  
**Immutability:** Pre-hooks block update/delete on audit records.

### Categories

| Category | Purpose | Writer |
|----------|---------|--------|
| `platform` | General platform activity | `logActivity` (deprecated alias in `logger.js`) |
| `admin_login` | Admin authentication events | `logAuthAttempt` / `logAdminLogin` |
| `admin_audit` | Admin panel mutations | `logAdminAction`, `adminAuditMiddleware` |
| `security` | Security alerts + auth failures + sensitive ops | `logSecurityEvent`, `logSensitiveOperation`, `logAuthAttempt` |

### Admin audit pipeline

- `adminAuditMiddleware` mounted on all `/api/admin/*` mutating routes (`POST`/`PUT`/`PATCH`/`DELETE`).
- Controllers may set `req.auditContext` for rich entries (e.g. `admin.controller.js`, `admin-sensitive.controller.js`, `password.controller.js`).
- Fallback: generic `{ method, path }` audit when no context provided.

### Sensitive operations (`logSensitiveOperation`)

| Operation | Source |
|-----------|--------|
| Cart checkout / duplicate checkout | `cart.routes.js` |
| Promo / admin / registration code redeem | `promo-code.controller.js` |
| Order status change (confirmed/rejected/cancelled) | `order.routes.js` |
| Customer order cancel | `order.routes.js` |
| User profile sensitive changes | `user.controller.js` |

### Platform activity (`logActivity` → `category: platform`)

Used in: `offer.controller.js`, `store.controller.js`, `promo-code.controller.js`, `user.controller.js`, `admin.controller.js`, `treasure.controller.js`, `draw.controller.js`, `chest.controller.js`.

**Separate from audit:** `UserActivity` collection via `activity.service.js` — user engagement tracking (AD-007), not security audit. Failures logged as `user_activity_log_failed`.

---

## 6. Production Readiness Checklist

| Check | Result |
|-------|--------|
| JSON parseable log lines | Yes |
| Sensitive data redacted in stdout logs | Yes |
| No verification/reset codes in logs | Yes (removed in Batch 4.5) |
| Audit records sanitized before DB write | Yes |
| Audit write failures surfaced in stdout | Yes (`audit_write_failed`) |
| Request logs exclude body/Authorization | Yes |
| Error responses don't leak internals (prod) | Yes |
| Admin can query/export audit logs | Yes |
| Immutable audit trail | Yes (Mongoose pre-hooks) |
| Frontend console cleanup | Done (Batch 5.2) — backend-only logging |

### Recommended production setup (operational — not code)

- Capture stdout/stderr with PM2, Docker logging driver, or systemd journal.
- Optional: ship JSON logs to aggregator (ELK, Loki, CloudWatch) via log shipper.
- MongoDB `ActivityLog` indexes already on `category`, `createdAt`, `user`, `ipAddress`, `severity`.
- Set `NODE_ENV=production` and configure `CORS_ORIGINS`.

---

## 7. Implemented Log Types — Quick Reference

### Stdout structured events (`safeLog`)

`http_request`, `server_error`, `request_error`, `server_started`, `server_start_failed`, `startup_config_error`, `startup_config_warning`, `seed_admin_*`, `mongodb_connected`, `mongodb_connection_failed`, `auth_token_rejected`, `cart_service_error`, `chat_send_failed`, `notification_*_failed`, `google_auth_failed`, `facebook_auth_failed`, `tiktok_auth_failed`, `audit_write_failed`, `admin_audit_failed`, `user_activity_log_failed`, `code_order_export_failed`, `offer_monitor_*`, `bazaar_monitor_*`, `competition_monitor_*`, `wheel_monitor_*`, `store_prefix_backfill_completed`, `referral_backfill_completed`, `sms_dev_simulated`, `email_dev_simulated`

### MongoDB audit categories (`ActivityLog`)

| Type | Functions | Storage |
|------|-----------|---------|
| **Security events** | `logSecurityEvent` | `category: security` |
| **Auth / login audit** | `logAuthAttempt`, `logAdminLogin` | `category: admin_login` or `security` |
| **Admin audit** | `logAdminAction`, `adminAuditMiddleware` | `category: admin_audit` |
| **Sensitive operations** | `logSensitiveOperation` | `category: security`, `operationType: sensitive` |
| **Platform activity** | `logActivity` | `category: platform` |

---

## 8. Out of Scope (future batches)

Per Phase 10 roadmap and project rules — **not part of 10.1:**

- Metrics / APM (CPU, RAM, response-time dashboards)
- External error tracking (Sentry, etc.)
- Centralized log aggregation wiring
- Alerting rules / on-call notifications
- Database performance monitoring
- Post-launch stability soak tests (Phase 9)

These remain in `TODO.md` / later Phase 10 sub-batches.

---

## Test Plan (verification performed)

- [x] Code review: all logging paths traced to `safeLog` or `auditService`
- [x] Grep audit: no stray `console.log/error/warn` in `backend/src`
- [x] Middleware wiring confirmed in `server.js` and `admin.routes.js`
- [x] `ActivityLog` schema categories and immutability hooks verified
- [x] Sanitization rules verified in `logSanitize.util.js`
- [x] Admin audit API routes present for log retrieval/export
