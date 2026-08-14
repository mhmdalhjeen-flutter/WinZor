# WinGold k6 Load Testing (Production-Safe)

Read-only smoke tests for the Offers Tech / WinGold backend. **No writes, no billing, no order creation.**

## Backend URL configuration

| Source | Value |
|--------|--------|
| Production API root | `https://winzor.onrender.com` |
| Delivery app fallback | `delivery/src/lib/apiUrl.js` → `FALLBACK_PRODUCTION_API_ROOT` |
| Local dev default | `http://localhost:5000` |
| Canonical versioned API | `/api/v1/*` |
| Legacy API (same handlers) | `/api/*` |

Set at run time (never commit secrets):

```powershell
$env:BASE_URL = "https://winzor.onrender.com"
# Optional Bearer tokens for authenticated read scenarios:
# $env:CUSTOMER_TOKEN = "..."
# $env:ADMIN_TOKEN = "..."
# $env:DELIVERY_TOKEN = "..."
```

## Files

| File | Purpose |
|------|---------|
| `smoke.js` | First production smoke test — ramp 1→2→3→5 VUs, GET only |

## Recommended first run (after approval)

```powershell
cd C:\Android\Flutter\offersTech
$env:BASE_URL = "https://winzor.onrender.com"
k6 run load-tests/smoke.js
```

With optional authenticated reads:

```powershell
$env:BASE_URL = "https://winzor.onrender.com"
$env:CUSTOMER_TOKEN = "<customer-jwt>"
$env:ADMIN_TOKEN = "<admin-jwt>"
$env:DELIVERY_TOKEN = "<delivery-company-jwt>"
k6 run load-tests/smoke.js
```

## Smoke test endpoints (selected)

| # | Method | Path | Auth | Safe? | Why |
|---|--------|------|------|-------|-----|
| 1 | GET | `/api/v1/health` | No | Yes | Official health probe; read-only; Mongo ping cached (~15s) |
| 2 | GET | `/api/v1/` | No | Yes | Static API meta; no DB |
| 3 | GET | `/api/settings/public` | No | Yes | Public platform settings; whitelisted during maintenance |
| 4 | GET | `/api/regions` | No | Yes | Small static catalog; no side effects |
| 5 | GET | `/api/delivery-companies` | No | Yes | Active companies list; public read |
| 6 | GET | `/api/users/me` | Customer JWT | Yes* | Cached profile read; *skip if no token — uses `/api/categories` instead |
| 7 | GET | `/api/admin/sensitive/status` | Admin JWT | Yes* | Lightweight status flag; skipped without `ADMIN_TOKEN` |
| 8 | GET | `/api/delivery/company/regions` | delivery_company JWT | Yes* | Read-only region config; skipped without `DELIVERY_TOKEN` |

## Expected load (smoke.js)

| Metric | Value |
|--------|-------|
| Max VUs | 5 |
| Duration | ~2 min 15 s (ramp + 15 s ramp-down) |
| Approx. HTTP requests | ~120–250 (depends on latency and sleep) |
| Methods | GET only |
| Rate limit budget | Well under default 600 req / 15 min per IP |

## Thresholds

| Threshold | Meaning |
|-----------|---------|
| `http_req_failed rate < 0.05` | Fewer than 5% of requests may fail (network/503/maintenance) |
| `http_req_duration p(95) < 5000` | 95th percentile under 5 s (Render cold starts) |
| `http_req_duration avg < 3000` | Average response under 3 s |
| `endpoint_checks_passed rate > 0.95` | Custom per-endpoint status/size checks |
| `checks rate > 0.95` | Overall k6 checks pass rate |

## Risks

1. **Maintenance mode** — Most customer/store paths return 503; whitelisted: `/api/v1/health`, `/api/settings/public`, `/api/admin/*`.
2. **Rate limiting** — Global 600 req/15 min/IP; admin 300; spike throttle on GET bursts per IP.
3. **Render cold start** — First requests after idle can exceed 5 s (health included).
4. **Health DB ping** — Cached 15 s; repeated health hits still add server work.
5. **Optional tokens** — Never log or commit JWTs; use env vars only.
6. **Do not use** endpoints that mutate on GET (e.g. `/api/products/:id` increments views).

## Endpoint inventory reference

Full Phase 1 discovery is documented in the project chat deliverable. Unsafe patterns to avoid in any future test:

- POST/PATCH/PUT/DELETE
- GET exports (`/export`, `/export-paper-codes`, audit export)
- Billing/subscription/payment verification routes
- `/api/products/:id` (increments views)
- `/api/offers/:id?countView=true`
- `/api/achievements/my` (may unlock achievements → DB write)
- `/api/auth/verify/email-link` (confirms email)
