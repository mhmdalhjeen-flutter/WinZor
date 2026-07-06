# Batch 10.2 — Server Health Monitoring Report

> Completed: **2026-07-04**  
> Scope: server health metrics only — no feature, API contract, schema, or UI changes beyond enriching the existing health endpoint.

---

## Summary

| Goal | Status | Implementation |
|------|--------|----------------|
| CPU monitoring | **Done** | Process CPU %, load average, core count |
| RAM monitoring | **Done** | Process heap/RSS + system used/free |
| Process uptime | **Done** | Seconds + human-readable |
| Event loop health | **Done** | `perf_hooks.monitorEventLoopDelay` with status thresholds |
| Health endpoint verification | **Pass** | `GET /api/v1/health` → 200 with full metrics |

**Verdict:** Server health monitoring is **operational** for production observability.

---

## Architecture

```
server.js (startup)
    └── startServerHealthMonitoring()
            ├── monitorEventLoopDelay (enabled at boot)
            └── setInterval 5min → safeLog("server_health", …)

GET /api/v1/health
    └── getHealthCheckResponse()
            ├── collectServerHealth()
            └── resolveOverallStatus() → healthy | degraded | unhealthy
```

**New file:** `backend/src/utils/serverHealth.util.js`  
**Modified:** `backend/src/routes/v1/meta.routes.js`, `backend/server.js`

---

## 1. CPU Monitoring

| Metric | Source | Description |
|--------|--------|-------------|
| `processPercent` | `process.cpuUsage()` delta | Approximate Node process CPU % since last sample |
| `cores` | `os.cpus().length` | Logical CPU count |
| `loadAvg` | `os.loadavg()` | 1 / 5 / 15 minute system load averages |
| `userMicros` / `systemMicros` | `process.cpuUsage()` | Cumulative CPU time (µs) |

**Note:** First sample after cold start may return `processPercent: null` until a second reading exists.

---

## 2. RAM Monitoring

### Process memory (`process.memoryUsage()`)

| Field | Unit | Meaning |
|-------|------|---------|
| `rssMb` | MB | Resident set size |
| `heapUsedMb` | MB | V8 heap in use |
| `heapTotalMb` | MB | V8 heap allocated |
| `externalMb` | MB | C++ objects bound to JS |

### System memory (`os.totalmem()` / `os.freemem()`)

| Field | Unit | Meaning |
|-------|------|---------|
| `totalMb` | MB | Host total RAM |
| `freeMb` | MB | Host free RAM |
| `usedMb` | MB | Host used RAM |
| `usedPercent` | % | System memory utilization |

---

## 3. Process Uptime

| Field | Example | Source |
|-------|---------|--------|
| `uptimeSeconds` | `86400` | `process.uptime()` |
| `uptimeHuman` | `1d 0h 0m 0s` | Formatted for operators |
| `pid` | `26476` | `process.pid` |
| `nodeVersion` | `v20.19.0` | `process.version` |

---

## 4. Event Loop Health

Uses Node.js `monitorEventLoopDelay({ resolution: 20 })`, enabled at server startup.

| Field | Unit | Meaning |
|-------|------|---------|
| `meanMs` | ms | Mean event loop delay since last read |
| `maxMs` | ms | Max delay observed |
| `p99Ms` | ms | 99th percentile delay |
| `status` | enum | `healthy` / `degraded` / `critical` |

**Thresholds:**

| Status | Condition |
|--------|-----------|
| `healthy` | mean < 100ms AND max < 500ms |
| `degraded` | mean ≥ 100ms OR max ≥ 500ms |
| `critical` | mean ≥ 500ms OR max ≥ 2000ms |

Counter resets after each health read to provide a fresh window per request/log cycle.

---

## 5. Database Health

| Field | Values |
|-------|--------|
| `database.status` | `connected`, `disconnected`, `connecting`, `disconnecting` |
| `database.readyState` | Mongoose readyState (1 = connected) |

---

## 6. Overall Status Logic

| `data.status` | When |
|---------------|------|
| `healthy` | DB connected + event loop not degraded/critical |
| `degraded` | Event loop degraded or critical (DB still connected) |
| `unhealthy` | MongoDB not connected |

**HTTP status:** Always **200** when the server responds (liveness probe). Degraded state is expressed in the JSON body so existing smoke tests (`GET /api/v1/health` → 200) remain valid.

---

## 7. Periodic Structured Logging

Every **5 minutes**, the server emits a structured log:

```json
{
  "at": "2026-07-04T16:20:00.000Z",
  "event": "server_health",
  "uptimeSeconds": 300,
  "cpu": { "processPercent": 1.2, "cores": 12, "loadAvg": [0.5, 0.4, 0.3] },
  "memory": { "process": { "rssMb": 93 }, "system": { "usedPercent": 83 } },
  "eventLoop": { "status": "healthy", "meanMs": 2.1, "maxMs": 15 },
  "database": { "status": "connected", "readyState": 1 }
}
```

Log level: `info` (healthy), `warn` (degraded), `error` (critical event loop).

---

## 8. Health Endpoint Verification

**Request:** `GET /api/v1/health`

**Verified:** 2026-07-04 — HTTP **200**

**Sample response (truncated):**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-07-04T16:15:25.027Z",
    "server": {
      "uptimeSeconds": 24,
      "uptimeHuman": "24s",
      "pid": 26476,
      "nodeVersion": "v20.19.0",
      "cpu": { "processPercent": 0.24, "cores": 12, "loadAvg": [0, 0, 0] },
      "memory": {
        "process": { "rssMb": 92.86, "heapUsedMb": 36.22, "heapTotalMb": 41.46 },
        "system": { "totalMb": 15713.97, "freeMb": 2675.55, "usedPercent": 82.97 }
      },
      "eventLoop": { "status": "healthy", "meanMs": 30.08, "maxMs": 35.82, "p99Ms": 32.85 },
      "database": { "status": "connected", "readyState": 1 }
    }
  },
  "error": null
}
```

**Operational notes:**

- Whitelisted during maintenance mode (`maintenance.middleware.js`).
- No authentication required (intended for load balancers / uptime monitors).
- Legacy `/api/health` does not exist — use `/api/v1/health`.

---

## 9. Production Usage

| Use case | How |
|----------|-----|
| Uptime probe | Poll `GET /api/v1/health` — expect HTTP 200 |
| Capacity alert | Watch `data.server.memory.system.usedPercent` or `data.server.eventLoop.status` |
| Log aggregation | Filter stdout for `event: "server_health"` every 5 min |
| PM2 / Docker | Healthcheck command: `curl -f http://localhost:5000/api/v1/health` |

---

## 10. Out of Scope (later batches)

- MongoDB query performance metrics
- API response-time percentiles
- External APM (Datadog, New Relic)
- Alerting webhooks
- Historical metrics storage
