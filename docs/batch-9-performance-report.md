# Batch 9 — Performance Report (Caching + API Optimization)

> Completed: caching layer, endpoint optimizations, request deduplication.  
> Scope: backend only — no UI, schema, or API contract changes.

---

## Summary

| Goal | Status |
|------|--------|
| Short TTL cache (30–60s) on polling endpoints | Done |
| Remove duplicate DB work on `/api/users/me` | Done |
| Aggregation pipeline for `/api/chats/unread-count` | Done |
| Request deduplication (5–10s window) | Done (8s) |
| Cache invalidation on writes | Done |

---

## 1. Caching Layer

**New files**

- `backend/src/utils/responseCache.util.js` — in-memory TTL store, prefix invalidation, in-flight dedupe tracking
- `backend/src/middleware/responseCache.middleware.js` — GET middleware (runs after auth)

**TTL configuration**

| Endpoint | Cache key | TTL |
|----------|-----------|-----|
| `GET /api/users/me` | `user:me:{userId}` | 60s |
| `GET /api/notifications` | `notif:list:{userId}:{unread}:{limit}` | 45s |
| `GET /api/notifications/unread-count` | `notif:unread:{userId}` | 30s |
| `GET /api/chats/unread-count` | `chat:unread:{userId}` | 30s |
| `GET /api/cart` | `cart:{userId}` | 45s |

**Invalidation triggers**

| Event | Keys cleared |
|-------|--------------|
| Notification create / mark read | `notif:unread:*`, `notif:list:*` for user |
| Chat send / open messages | `chat:unread:*` for all participants |
| Cart add / update / remove / clear / checkout | `cart:{userId}` |
| Profile update / redeem card | `user:me:{userId}` |

Pattern matches existing `platformSettings.service.js` (per-process memory cache). For multi-instance deploys, swap to Redis with the same key scheme.

---

## 2. Endpoint Optimizations

### `/api/users/me`

**Before:** `authMiddleware` loaded user → `getMe` ran a second `User.findById` + populate.

**After:** Reuses `req._authUserDoc` from auth; only runs `populate("inventory.cards.cardType")` on the existing document.

**DB queries per request:** 2 → 1 (+ populate join)

### `/api/chats/unread-count`

**Before:** `Conversation.find()` fetched every conversation document, then summed `unreadCount` in Node.js.

**After:** Single MongoDB aggregation pipeline:

1. `$match` by participant
2. `$objectToArray` + `$filter` to extract user’s unread entry
3. `$group` with `$sum`

**Data transferred:** O(conversations) full docs → O(1) scalar result

---

## 3. Request Deduplication

Concurrent identical GETs within **8 seconds** share one in-flight handler result instead of hitting the DB repeatedly.

Typical scenario: header badge polling fires 3–5 parallel requests on page load → 1 DB round-trip + 2–4 instant responses.

---

## 4. Before / After Latency (Estimated)

Based on optimization mechanics and typical polling patterns (100–400 concurrent users, header refresh every few seconds). Run `backend/scripts/benchmark-batch9.js` against your environment for measured numbers.

| Endpoint | Before (cold / under load) | After (cached / deduped) | DB load reduction |
|----------|---------------------------|--------------------------|-------------------|
| `/api/users/me` | 800–3500 ms (2× user query + populate) | **15–80 ms** cache hit | ~50% per uncached hit; ~95% when cached |
| `/api/notifications` | 400–2000 ms | **10–50 ms** cache hit | ~70–85% |
| `/api/notifications/unread-count` | 200–1500 ms | **5–30 ms** cache hit | ~80–90% |
| `/api/chats/unread-count` | 500–3000 ms (full scan) | **10–60 ms** cache hit; **80–400 ms** uncached (aggregation) | ~75–90% |
| `/api/cart` | 1000–6000 ms (N+1 populate) | **20–80 ms** cache hit | ~70–85% |

**Aggregate polling load (header + layout):**

| Metric | Before | After |
|--------|--------|-------|
| DB queries / user / minute (5 endpoints × ~12 polls) | ~60 | **~6–12** (cache miss only) |
| P95 latency (cached endpoints) | 3–6 s | **<500 ms** |
| Stability at 100–400 concurrent users | Weak / unstable | Expected stable (60–80% less DB pressure) |

---

## 5. Benchmark Script

```bash
cd backend
TOKEN=<your-jwt> BASE=http://localhost:5000 node scripts/benchmark-batch9.js
```

Output: cold vs warm vs burst (10 parallel) latency table per endpoint.

---

## 6. Cache Observability

```javascript
const { getStats } = require("./src/utils/responseCache.util");
console.log(getStats()); // { hits, misses, deduped, invalidations, size, inFlight }
```

---

## 7. Constraints Verified

- No new features
- No API response shape changes
- No schema migrations
- No frontend changes
- No architectural changes (in-memory cache, same Express stack)

---

## 8. Known Limits

1. **Per-process cache** — not shared across PM2/cluster workers; each worker has its own cache (still reduces load per worker).
2. **Stale window** — badge counts may lag up to TTL (30–60s) unless a write invalidates the key sooner.
3. **`/api/users/me` staleness** — points/inventory changes from wheel, chest, orders, etc. may not invalidate `user:me` until TTL; extend invalidation hooks in future batches if needed.
4. **`/api/cart`** — prices/stock can change within TTL; invalidation on cart mutations covers user actions; external catalog changes rely on 45s TTL.

---

## 9. Files Changed

| File | Change |
|------|--------|
| `backend/src/utils/responseCache.util.js` | **New** |
| `backend/src/middleware/responseCache.middleware.js` | **New** |
| `backend/scripts/benchmark-batch9.js` | **New** |
| `backend/src/middleware/auth.middleware.js` | Attach `_authUserDoc` |
| `backend/src/controllers/user.controller.js` | Reuse auth user; cache invalidation |
| `backend/src/controllers/chat.controller.js` | Aggregation + invalidation |
| `backend/src/controllers/notification.controller.js` | Invalidation on writes |
| `backend/src/services/notification.service.js` | Invalidation on create |
| `backend/src/services/cart.service.js` | Invalidation on mutations |
| `backend/src/routes/user.routes.js` | `userMeCache` middleware |
| `backend/src/routes/notification.routes.js` | List + unread cache |
| `backend/src/routes/chat.routes.js` | Unread cache |
| `backend/src/routes/cart.routes.js` | Cart cache |
