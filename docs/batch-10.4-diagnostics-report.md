# Batch 10.4 — Monitoring Diagnostics Report

> Completed: **2026-07-04**  
> Scope: verify monitoring diagnostics across Batches 10.1–10.3 — **no code changes**, no new features, no architecture changes.

---

## Executive Summary

| Diagnostic task | Verdict | Mechanism |
|-----------------|---------|-----------|
| Detect repeated errors | **Partial** | Security-domain repetition (failed logins, rate limits); general errors rely on log aggregation |
| Detect failed requests | **Pass** | Every `/api/*` response logged via `http_request` with status-based level |
| Detect server crashes | **Partial** | Startup failures logged before `exit(1)`; **no runtime crash hooks** |
| Verify log consistency | **Pass** | All diagnostics use `safeLog` JSON envelope `{ at, event, … }` |
| Verify monitoring coverage | **Pass** | Backend observability stack complete for Phase 10 scope; gaps documented below |

**Overall:** Diagnostics are **production-usable** with PM2/Docker + log shipper. In-process alert rules and crash hooks remain the main gaps.

---

## 1. Detect Repeated Errors

### What works today

| Pattern | Threshold | Output |
|---------|-----------|--------|
| Failed login attempts (same IP) | ≥ 5 in 24h | `ActivityLog` security entry: `نشاط مشبوه: محاولات دخول فاشلة متكررة` |
| Rate limit exceeded | 1 log per window per key | `ActivityLog` + stdout via security audit path; rate limit returns 429 |
| Slow MongoDB queries | Each occurrence ≥ 500ms | `mongodb_slow_query` warn log (not deduplicated) |
| Cron monitor failures | Each failure | `offer_monitor_failed`, `bazaar_monitor_failed`, etc. |

**Source:** `audit.service.js` (`checkSuspiciousLogin`, `SUSPICIOUS_THRESHOLD = 5`), `rateLimit.middleware.js`, `dbHealth.util.js`.

### What does not exist

- No in-process counter for repeated identical `server_error` / `cart_service_error` events
- No automatic escalation (email, Slack, webhook) on error bursts
- Repeated **4xx** client errors are logged per request but not aggregated in-app

### Operational detection (no code required)

Use log aggregator queries on stdout/stderr:

```
# Error burst (5+ server errors in 5 minutes)
event = "server_error" | count > 5 window 5m

# Same path failing repeatedly
event = "http_request" AND status >= 500 | group by path | count > 10 window 15m

# Auth attack pattern (already in MongoDB)
ActivityLog: category=security AND action contains "محاولات دخول فاشلة"
```

**Verdict:** **Partial** — security repetition is covered; generic error repetition requires external tooling.

---

## 2. Detect Failed Requests

### Request-level logging (`requestLog.middleware.js`)

Every `/api/*` request emits `http_request` on `res.finish`:

| HTTP status | Log level | Stream |
|-------------|-----------|--------|
| 2xx–3xx | `info` | stdout |
| 4xx | `warn` | stderr |
| 5xx | `error` | stderr |

**Payload:** `method`, `path` (no query string), `status`, `durationMs`, `ip`, `userId`, `role`.

**Verified:** JSON parse test — all diagnostic events include `at` + `event` fields consistently.

### Express error path (`server.js`)

| Event | When | Level |
|-------|------|-------|
| `server_error` | Uncaught Express error, status ≥ 500 | error |
| `request_error` | Express error with status 4xx (incl. CORS 403) | warn |

CORS rejections and oversized bodies also write security audit events.

### Controller-level failures

Most routes catch errors and return `res.status(4xx|5xx).json(...)` without calling `next(err)`. These appear **only** in `http_request` (not `server_error`). This is correct for failed-request detection — filter `http_request` where `status >= 400`.

**Examples with dedicated error logs (in addition to `http_request`):**

| Event | Trigger |
|-------|---------|
| `cart_service_error` | Cart/checkout failures |
| `chat_send_failed` | Message send failure |
| `auth_token_rejected` | Invalid JWT |
| `notification_*_failed` | Notification pipeline errors |
| OAuth failures | `google_auth_failed`, etc. |

### Gaps

- `userId` / `role` often **null** in `http_request` because middleware runs before route-level auth
- Non-`/api` paths (e.g. `GET /`) are **not** logged
- 404 on unknown `/api/*` routes → `http_request` warn with status 404 ✓

**Verdict:** **Pass** — failed requests are detectable via structured logs.

---

## 3. Detect Server Crashes

### Logged before process exit

| Event | Cause |
|-------|-------|
| `startup_config_error` | Missing `JWT_SECRET` → `exit(1)` |
| `mongodb_connection_failed` | DB connect failure → `exit(1)` |
| `server_start_failed` | Startup catch → `exit(1)` |

### Runtime crash detection

| Scenario | Current behavior |
|----------|------------------|
| `uncaughtException` | **Not handled** — process may exit without structured log |
| `unhandledRejection` | **Not handled** — may crash or warn depending on Node version |
| `SIGTERM` / `SIGINT` | **Not handled** — no graceful shutdown log |
| OOM kill | OS kills process — no application log |
| PM2 restart | PM2 logs exit code; app does not emit `process_crash` event |

### What works indirectly

- `server_health` / `mongodb_health` logs every 5 min — **absence** of these logs indicates process down (external watchdog)
- `GET /api/v1/health` failure → uptime monitor alert
- Event loop `critical` status → `server_health` at error level (degradation, not crash)

**Verdict:** **Partial** — startup failures covered; **runtime crash hooks missing**.

---

## 4. Log Consistency Verification

### Format contract (`logSanitize.util.js`)

All structured logs share:

```json
{
  "at": "2026-07-04T16:00:00.000Z",
  "event": "event_name",
  "...": "sanitized payload"
}
```

| Rule | Status |
|------|--------|
| ISO8601 `at` timestamp | ✓ Always present |
| String `event` identifier | ✓ Always present |
| Sensitive key redaction | ✓ `password`, `token`, `authorization`, etc. |
| Level → stream mapping | ✓ info→stdout, warn/error→stderr |
| Single-line JSON (parseable) | ✓ Verified programmatically |
| No raw `console.*` in runtime code | ✓ Only `logSanitize.util.js` sink + CLI scripts |

### Audit logs (separate sink)

`ActivityLog` in MongoDB uses a different schema (category, action, details, severity) — intentional; queryable via admin panel `/api/admin/audit/*`.

**Verdict:** **Pass**

---

## 5. Monitoring Coverage Matrix

| Domain | Covered | Mechanism | Batch |
|--------|---------|-----------|-------|
| HTTP requests | ✓ | `http_request` | 10.1 |
| HTTP errors (Express) | ✓ | `server_error`, `request_error` | 10.1 |
| Security events | ✓ | `ActivityLog` + security audit | 10.1 / 4.5 |
| Admin audit | ✓ | `ActivityLog` + `adminAuditMiddleware` | 10.1 |
| CPU / RAM / uptime | ✓ | `server_health`, `/api/v1/health` | 10.2 |
| Event loop health | ✓ | `server_health`, health endpoint | 10.2 |
| MongoDB connection | ✓ | `mongodb_*` logs, health endpoint | 10.3 |
| Connection pool | ✓ | Pool events in health endpoint | 10.3 |
| Query latency / slow queries | ✓ | Command monitoring, `mongodb_slow_query` | 10.3 |
| Failed login repetition | ✓ | `checkSuspiciousLogin` | 4.5 |
| Rate limit abuse | ✓ | Security audit + 429 response | 4.3 |
| Cron job health | ✓ | Monitor utils (offers, bazaar, wheel, competitions) | existing |
| Startup failure | ✓ | Structured log + exit | 10.1 |
| Runtime crash | ✗ | — | **gap** |
| Generic error repetition | ✗ | Needs log aggregator | **gap** |
| External alerting | ✗ | No webhook/email/Slack | **gap** |
| Frontend errors | ✗ | Console removed (5.2); no reporting | **gap** |
| Per-route latency metrics | ✗ | Only per-request in `http_request` | **gap** |
| Prometheus / metrics export | ✗ | — | **gap** |
| Multi-instance aggregation | ✗ | In-memory metrics per process | **gap** |

---

## 6. Diagnostic Alert Recipes (Operations)

Use these with PM2, Docker logs, or a log shipper — **no application changes needed**.

| Alert | Condition | Severity |
|-------|-----------|----------|
| API down | Health check fails 3× consecutive | Critical |
| 5xx spike | `event=http_request AND status>=500` count > 10 in 5m | Critical |
| Error burst | `event=server_error` count > 5 in 5m | High |
| Slow DB | `event=mongodb_slow_query` any in 5m | Warning |
| DB degraded | `event=mongodb_health AND status=degraded` | Warning |
| Event loop critical | `event=server_health AND eventLoop.status=critical` | Critical |
| Auth attack | ActivityLog suspicious login entries | High |
| Process silent | No logs for 10m (process likely dead) | Critical |
| PM2 restart loop | PM2 `restart count` > 3 in 10m | Critical |

---

## 7. Remaining Monitoring Gaps

Prioritized for post-Launch / Phase 16 (Post-Launch Monitoring):

### High

1. **Runtime crash hooks** — `uncaughtException`, `unhandledRejection`, `SIGTERM` structured logs before exit
2. **External alert delivery** — wire log shipper to email/Slack/PagerDuty (operational, not app code)
3. **Uptime monitor** — external poll of `GET /api/v1/health` (UptimeRobot, PM2, k8s probe)

### Medium

4. **Generic repeated-error counter** — in-process dedup window for identical `event` + `message` bursts
5. **Per-route latency dashboard** — aggregate `http_request.durationMs` by `path` in log platform
6. **Auth context in request logs** — move request logging after auth on protected routes (middleware order change)

### Low

7. **Prometheus `/metrics` endpoint** — optional metrics export
8. **Frontend error reporting** — e.g. Sentry for three frontends
9. **Legacy `/api/health` alias** — benchmark script references it; only `/api/v1/health` exists
10. **Multi-instance shared state** — Redis for rate limits + metrics if horizontally scaled

---

## 8. Test Plan (Verification Performed)

- [x] Code audit: all `safeLog` call sites catalogued (40+ events)
- [x] Confirmed no `uncaughtException` / `unhandledRejection` handlers
- [x] JSON parse test on `http_request`, `server_error`, `request_error` output
- [x] Traced failed-request path: controller 4xx/5xx → `http_request` warn/error
- [x] Traced repeated-error path: `checkSuspiciousLogin` threshold logic
- [x] Cross-referenced Batches 10.1–10.3 reports for coverage completeness
- [x] Documented operational alert recipes for gaps without in-app alerting

---

## 9. Conclusion

Monitoring diagnostics are **sufficient for beta/production** when combined with:

1. PM2 or Docker for process supervision and restart
2. Log aggregation with alert rules (Section 6)
3. External health polling on `/api/v1/health`

The application emits consistent, parseable signals for failed requests, errors, security repetition, and infrastructure health. **Runtime crash logging and push alerting** remain the primary gaps — deferred to post-Launch operational setup, not Phase 1 feature work.
