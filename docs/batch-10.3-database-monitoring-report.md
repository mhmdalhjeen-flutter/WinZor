# Batch 10.3 — Database Monitoring Report

> Completed: **2026-07-04**  
> Scope: MongoDB performance monitoring only — no schema changes, query optimization, or feature work.

---

## Summary

| Goal | Status | Implementation |
|------|--------|----------------|
| Connection status | **Done** | Mongoose readyState, host, database name, reconnect/disconnect logs |
| Connection pool | **Done** | Driver pool events — checked out, available, max/min pool size |
| Query latency | **Done** | Command monitoring — count, avg, p95, max |
| Slow query detection | **Done** | Threshold 500ms (configurable) → `mongodb_slow_query` warn log |
| Database health verification | **Pass** | Live ping + metrics on `GET /api/v1/health` |

**Verdict:** MongoDB monitoring is **operational** and integrated with the existing health endpoint.

---

## Architecture

```
db.js (connect)
    ├── monitorCommands: true
    └── setupDbMonitoring(connection)
            ├── connection pool events (checkedOut/In, created/closed)
            ├── commandStarted / commandSucceeded / commandFailed
            ├── mongoose disconnected / reconnected / error
            └── setInterval 5min → safeLog("mongodb_health", …)

GET /api/v1/health
    └── collectDbHealthAsync()
            ├── pingDatabase()  → { ping: 1 }
            └── collectDbHealth() → connection + pool + queries
```

**New file:** `backend/src/utils/dbHealth.util.js`  
**Modified:** `backend/src/config/db.js`, `backend/src/utils/serverHealth.util.js`, `backend/src/routes/v1/meta.routes.js`

---

## 1. Connection Status

| Field | Source | Description |
|-------|--------|-------------|
| `connection.status` | `mongoose.connection.readyState` | `connected` / `disconnected` / `connecting` / `disconnecting` |
| `connection.readyState` | Mongoose | 0–3 numeric state |
| `connection.host` | Mongoose connection | MongoDB host |
| `connection.name` | Mongoose connection | Database name |
| `connection.lastPingMs` | `{ ping: 1 }` command | Round-trip latency at last health check |
| `connection.lastPingAt` | ISO timestamp | When ping was last measured |

**Lifecycle logs:**

| Event | Level |
|-------|-------|
| `mongodb_monitoring_started` | info |
| `mongodb_disconnected` | warn |
| `mongodb_reconnected` | info |
| `mongodb_connection_error` | error |

---

## 2. Connection Pool

Tracked via MongoDB Node.js driver pool events (no admin privileges required).

| Field | Description |
|-------|-------------|
| `pool.maxPoolSize` | Configured max (default 20 from `db.js`) |
| `pool.minPoolSize` | Configured min |
| `pool.checkedOut` | Connections currently in use |
| `pool.available` | `maxPoolSize - checkedOut` |
| `pool.connectionsCreated` | Total connections opened since boot |
| `pool.connectionsClosed` | Total connections closed since boot |
| `pool.checkoutFailed` | Failed checkouts (logged as `mongodb_pool_checkout_failed`) |

---

## 3. Query Latency

All MongoDB commands are tracked via `monitorCommands: true` and driver event listeners.

| Field | Description |
|-------|-------------|
| `queries.count` | Total commands since boot |
| `queries.avgMs` | Mean command duration |
| `queries.p95Ms` | 95th percentile (rolling window of last 200 samples) |
| `queries.maxMs` | Slowest command observed |
| `queries.failedCount` | Failed commands |
| `queries.slowThresholdMs` | Slow query threshold (default 500) |

**Privacy:** Slow query logs include command name and collection only — not full query payloads.

---

## 4. Slow Query Detection

When any command duration ≥ **500ms** (override via `MONGODB_SLOW_QUERY_MS`):

1. Increments `queries.slowCount`
2. Appends to `queries.recentSlowQueries` (last 10)
3. Emits structured warn log:

```json
{
  "event": "mongodb_slow_query",
  "durationMs": 650,
  "command": "find",
  "collection": "offers",
  "database": "test",
  "outcome": "success"
}
```

**Overall DB status `degraded` when:**
- p95 latency ≥ slow threshold (with at least one slow query recorded), OR
- Last ping ≥ slow threshold

**Overall DB status `unhealthy` when:** MongoDB not connected.

---

## 5. Database Health Verification

**Integration test:** 2026-07-04 — connect + ping + metrics collection succeeded.

**Sample `collectDbHealth()` output:**

```json
{
  "status": "healthy",
  "connection": {
    "status": "connected",
    "readyState": 1,
    "host": "ac-9pixzyl-shard-00-01.sehsr3k.mongodb.net",
    "name": "test",
    "lastPingMs": 316.48,
    "lastPingAt": "2026-07-04T16:17:19.177Z"
  },
  "pool": {
    "maxPoolSize": 20,
    "checkedOut": 0,
    "available": 20,
    "connectionsCreated": 0,
    "checkoutFailed": 0
  },
  "queries": {
    "count": 1,
    "avgMs": 314,
    "p95Ms": 314,
    "maxMs": 314,
    "slowCount": 0,
    "slowThresholdMs": 500,
    "recentSlowQueries": []
  }
}
```

**Health endpoint:** `GET /api/v1/health` now returns full MongoDB metrics under `data.server.database` (async ping on each request).

---

## 6. Periodic Structured Logging

Every **5 minutes**, independent of server health log:

```json
{
  "event": "mongodb_health",
  "status": "healthy",
  "connection": { "status": "connected", "lastPingMs": 12 },
  "pool": { "checkedOut": 2, "available": 18 },
  "queries": { "count": 4521, "avgMs": 3.2, "p95Ms": 18, "slowCount": 0 }
}
```

Level: `info` (healthy), `warn` (degraded), `error` (unhealthy).

The combined `server_health` log (Batch 10.2) also includes the full `database` object.

---

## 7. Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `MONGODB_SLOW_QUERY_MS` | `500` | Slow query / ping degradation threshold (ms) |
| `maxPoolSize` in `db.js` | `20` | Connection pool cap (unchanged) |

No new required environment variables.

---

## 8. Production Usage

| Use case | How |
|----------|-----|
| DB liveness | `data.server.database.connection.status === "connected"` |
| Pool pressure | Alert when `pool.checkedOut / pool.maxPoolSize > 0.8` |
| Slow queries | Filter logs for `event: "mongodb_slow_query"` |
| Latency trend | Track `mongodb_health` log `queries.p95Ms` over time |
| Ping latency | Watch `connection.lastPingMs` on health polls |

---

## 9. Out of Scope (later batches)

- MongoDB Atlas Performance Advisor integration
- Query plan analysis / index recommendations
- Per-route API latency correlation
- Historical metrics storage
- Query optimization or index changes
