# Database Recovery Procedure — Offers Tech

> **Scope:** Disaster recovery and restore validation for MongoDB (Atlas + manual dumps).  
> **Prerequisite:** [database-backup-procedure.md](database-backup-procedure.md) (Batch 11.2).  
> **Last verified:** 2026-07-04 (Batch 11.3)

---

## 1. When to use this runbook

| Scenario | Recovery method |
|----------|-----------------|
| Accidental data deletion / corruption | Atlas point-in-time restore **or** latest `mongodump` |
| Cluster failure | Atlas restore to new cluster; update `MONGO_URI` |
| Environment clone (staging ← prod) | `mongodump` + `mongorestore` with namespace remap |
| Pre-deploy rollback | Restore scratch DB, validate, swap `MONGO_URI` |
| Quarterly DR drill | Run `validate-restore-batch11.js` against non-production |

**Rules:** Validation and recovery documentation only — no schema changes during restore drills.

---

## 2. Decision tree

```
Data loss detected?
├── Production on Atlas with Cloud Backup enabled
│     └── Atlas UI → Backup → Restore (PITR or snapshot) → new cluster or overwrite
├── Manual dump available (< 7 days)
│     └── mongorestore to scratch DB → validate → promote or swap URI
└── No backup
      └── Contact Atlas support (if enabled); accept data loss scope
```

---

## 3. Prerequisites

1. **MongoDB Database Tools** — `mongorestore` (and `mongodump` for round-trip drills)
2. **`MONGO_URI`** — credentials with `readWrite` on target database (or `restore` role on Atlas)
3. **Backup artifact** — Atlas snapshot **or** local folder:
   ```
   backups/20260704-183000/<database_name>/*.bson.gz
   ```
4. **Maintenance window** — stop backend workers during in-place production restore
5. **Rollback plan** — document current `MONGO_URI` before any overwrite

---

## 4. Restore methods

### 4.1 Atlas Cloud Backup (production — primary)

1. Atlas → **Database** → **Backup**
2. Choose **Point-in-Time** or **Snapshot**
3. Select restore target:
   - **New cluster** (safest — validate before cutover)
   - **Same cluster** (destructive — requires maintenance window)
4. After restore completes:
   - Update `MONGO_URI` if cluster hostname changed
   - Run health check: `GET /api/v1/health`
   - Run restore validation (Section 6)

### 4.2 Manual restore from mongodump (staging / DR drill)

#### Windows

```powershell
cd backend
# Scratch restore (recommended for validation):
.\scripts\restore-mongodb.ps1 -BackupDir ".\backups\20260704-183000" -Scratch

# In-place restore (destructive — same DB name):
.\scripts\restore-mongodb.ps1 -BackupDir ".\backups\20260704-183000" -TargetDb "test"
```

#### Linux / macOS

```bash
cd backend
chmod +x scripts/restore-mongodb.sh
./scripts/restore-mongodb.sh ./backups/20260704-183000
# Optional explicit target:
./scripts/restore-mongodb.sh ./backups/20260704-183000 test_restore_verify
```

#### Direct command

```bash
SOURCE_DB="test"          # folder name inside backup
TARGET_DB="test_restore"  # scratch DB for validation
mongorestore --uri "$MONGO_URI" --gzip --drop \
  --nsFrom "${SOURCE_DB}.*" \
  --nsTo "${TARGET_DB}.*" \
  ./backups/20260704-183000/
```

> **`--drop`** removes collections in the target namespace before import. Never point at production DB name until validation passes.

---

## 5. Post-restore validation

### 5.1 Automated (recommended)

```bash
cd backend
node scripts/validate-restore-batch11.js
```

| Check | What it verifies |
|-------|------------------|
| Source connectivity | Live DB reachable |
| Restore process | Physical (`mongorestore`) or logical scratch copy |
| Collection counts | Every collection matches source |
| Critical fingerprints | `users`, `stores`, `orders`, `offers`, `products` — count, first/last `_id`, aggregates |
| Referential spot-check | Order → user reference intact |
| Indexes | Match on physical restore only |
| Cleanup | Scratch DB dropped after test |

**Flags:**

```bash
node scripts/validate-restore-batch11.js --physical-only   # fail if tools missing
node scripts/validate-restore-batch11.js --logical-only    # driver copy only (no index check)
```

Output: `backend/_batch11_restore_validation.json`

### 5.2 Manual smoke checks

After promoting a restored database:

1. **Health endpoint**
   ```bash
   curl http://127.0.0.1:5000/api/v1/health
   ```
   Expect `database.connection.status: connected`

2. **Critical counts** (mongosh)
   ```javascript
   db.users.countDocuments()
   db.stores.countDocuments()
   db.orders.countDocuments()
   ```

3. **Application login** — admin + one customer account

4. **Recent data spot-check** — latest order, offer, notification timestamps

---

## 6. Promoting a validated restore

### Option A — New Atlas cluster (zero-downtime cutover)

1. Restore backup to **new** cluster in Atlas
2. Run validation against new cluster URI (temp `.env`)
3. Update production `MONGO_URI` in secret manager
4. Restart backend (PM2/Docker)
5. Monitor logs for `mongodb_connected`, `server_started`

### Option B — Scratch DB validated, swap namespace

1. Validate restore in `test_restore_verify`
2. Schedule maintenance; stop backend
3. Drop or rename production DB; restore dump with `--nsTo` pointing at production name
4. Start backend; re-run health + smoke checks

### Option C — Staging clone (non-destructive)

Keep production untouched. Point staging `MONGO_URI` at scratch DB after validation.

---

## 7. Cleanup

Drop scratch databases after every drill:

```javascript
// mongosh
use test_restore_verify_20260704
db.dropDatabase()
```

Or:

```bash
mongosh "$MONGO_URI" --eval "db.getSiblingDB('test_restore_verify').dropDatabase()"
```

Never leave scratch DBs with production data on shared Atlas projects without IP/access review.

---

## 8. Recovery time objectives (guidance)

| Method | Typical RTO | Typical RPO |
|--------|-------------|-------------|
| Atlas PITR | 15–60 min (cluster size) | Minutes (continuous backup) |
| Atlas snapshot | 30–90 min | Last snapshot interval |
| Manual mongodump | 15–45 min (793 docs dev) | Last dump time |

Adjust for production data volume. Document actual times after first production drill.

---

## 9. Troubleshooting

| Issue | Action |
|-------|--------|
| `mongorestore not found` | Install MongoDB Database Tools |
| Namespace not found in backup | Confirm backup folder contains `<db_name>/` subfolder |
| Auth failure on restore | Atlas user needs `readWrite` on target DB |
| Count mismatch after restore | Re-run dump; check for writes during backup |
| Index missing after logical test | Expected — use physical `mongorestore` for index restore |
| App connects but 401/empty data | Wrong `MONGO_URI` database name; verify DB in connection string |
| `duplicate key` on restore | Add `--drop` or restore to empty scratch DB |

---

## 10. Related files

| File | Purpose |
|------|---------|
| `backend/scripts/restore-mongodb.ps1` | Windows restore script |
| `backend/scripts/restore-mongodb.sh` | Unix restore script |
| `backend/scripts/validate-restore-batch11.js` | Automated restore validation |
| `backend/scripts/validate-backup-batch11.js` | Backup validation (Batch 11.2) |
| `docs/batch-11.3-restore-validation-report.md` | Batch 11.3 report |
| `docs/database-backup-procedure.md` | Backup runbook |
| `docs/batch-11.2-database-backup-report.md` | Backup verification report |
