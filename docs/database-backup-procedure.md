# Database Backup Procedure — Offers Tech

> **Scope:** MongoDB (Atlas or self-hosted) for the Offers Tech backend.  
> **Connection:** `MONGO_URI` in `backend/.env` (see `backend/src/config/db.js`).  
> **Last verified:** 2026-07-04 (Batch 11.2)

---

## 1. Overview

| Layer | Method | When to use |
|-------|--------|-------------|
| **Production (Atlas)** | Atlas Continuous Backup / Cloud Backup snapshots | Primary — automated, point-in-time restore |
| **Manual / staging / migration** | `mongodump` + `mongorestore` | Pre-deploy, data migration, local dev clone |
| **Verification** | `node scripts/validate-backup-batch11.js` | After procedure changes or quarterly audit |

**Rules for this project:** Backup verification only — no schema changes, no index optimization during backup runs.

---

## 2. Prerequisites

1. **MongoDB Database Tools** — [Install guide](https://www.mongodb.com/docs/database-tools/installation/installation/)
   - Windows: add `mongodump.exe` and `mongorestore.exe` to PATH, or use default path  
     `C:\Program Files\MongoDB\Tools\100\bin\`
   - Linux/macOS: package manager or tarball from MongoDB
2. **`MONGO_URI`** — full connection string with read access to all collections
3. **Disk space** — at least 2× current database size (gzip dumps are smaller but leave headroom)
4. **Atlas (production):** enable **Cloud Backup** on the cluster; confirm retention policy in Atlas UI

---

## 3. What gets backed up

### Application collections (34 Mongoose models)

All collections mapped from `backend/src/models/` must be included in every full backup:

`users`, `stores`, `products`, `offers`, `categories`, `regions`, `carts`, `orders`, `codeorders`, `cardtypes`, `activationcodes`, `promocodes`, `treasureboxes`, `dailyprizes`, `drawbatches`, `honorboards`, `systemsettings`, `activitylogs`, `messages`, `conversations`, `wheelprizes`, `wheelspins`, `wheelwins`, `ratings`, `notifications`, `bazaarlistings`, `competitions`, `admincodes`, `storememberships`, `storememberprizes`, `useractivities`, `referralbatchbuffers`, `usersuggestions`, `achievementmilestones`

### Legacy / orphan collections

The live database may contain additional collections from earlier versions. **Include them in full dumps** (do not exclude). As of Batch 11.2 verification:

`disclaimers`, `marketplaceitems`, `prizes`, `ranks`, `supports`, `wheels`

---

## 4. Manual backup (mongodump)

### Windows (PowerShell)

```powershell
cd backend
.\scripts\backup-mongodb.ps1
# Optional custom output directory:
.\scripts\backup-mongodb.ps1 -OutDir "D:\backups\offers-tech"
```

### Linux / macOS

```bash
cd backend
chmod +x scripts/backup-mongodb.sh
./scripts/backup-mongodb.sh
# Optional: ./scripts/backup-mongodb.sh /var/backups/offers-tech
```

### Direct command (any OS)

```bash
cd backend
# Load MONGO_URI from .env, then:
mongodump --uri "$MONGO_URI" --gzip --out "./backups/$(date +%Y%m%d-%H%M%S)"
```

**Output layout:**

```
backups/20260704-183000/
  └── <database_name>/
        users.bson.gz
        stores.bson.gz
        ...
        prelude.json
```

---

## 5. Restore procedure

> **Warning:** `--drop` removes existing data in the target namespace. Use a **scratch database** for verification, not production, unless performing a controlled disaster recovery.

### Full restore to same database name

```bash
mongorestore --uri "$MONGO_URI" --gzip --drop ./backups/20260704-183000/
```

### Restore to a scratch database (verification)

```bash
SOURCE_DB="test"   # from dump folder name
TARGET_DB="test_restore_verify"
mongorestore --uri "$MONGO_URI" \
  --gzip \
  --nsFrom "${SOURCE_DB}.*" \
  --nsTo "${TARGET_DB}.*" \
  --drop \
  ./backups/20260704-183000/
```

After verification, drop the scratch database:

```javascript
// mongosh
use test_restore_verify
db.dropDatabase()
```

---

## 6. Atlas Cloud Backup (production)

1. Atlas → **Project** → **Database** → **Backup**
2. Enable **Cloud Backup** (M10+ or serverless with backup tier)
3. Set **retention** (e.g. 7 daily, 4 weekly, 12 monthly — per business requirement)
4. Document restore runbook: Atlas UI → Backup → **Restore** → new cluster or download snapshot
5. Align IP allowlist with deploy hosts (`16_LAUNCH_MEMORY.md`)

Atlas backups are **independent** of application code; they do not replace pre-migration `mongodump` exports when moving data between environments.

---

## 7. Verification checklist

Run after any backup policy change or before beta launch:

```bash
cd backend
node scripts/validate-backup-batch11.js
```

| Check | Expected |
|-------|----------|
| `MONGO_URI` configured | PASS |
| Live DB connection | PASS |
| All 34 app model collections present | PASS |
| Document counts stable (double-read) | PASS |
| Sample read from each collection | PASS |
| Index metadata on critical collections | PASS |
| `mongodump` completes | PASS (requires Database Tools installed) |
| Restore round-trip counts match | PASS (requires `mongorestore`) |

**Re-run with dump skipped** (logical checks only):

```bash
node scripts/validate-backup-batch11.js --skip-dump
```

---

## 8. Recommended schedule

| Environment | Method | Frequency |
|-------------|--------|-----------|
| Production (Atlas) | Cloud Backup | Continuous (Atlas-managed) |
| Production | Manual `mongodump` to secure storage | Weekly (or pre-release) |
| Staging | `mongodump` before schema/data migrations | On demand |
| Development | Optional clone from staging dump | As needed |

Store backups **encrypted at rest** (S3 SSE, Azure Blob encryption, or encrypted volume). Never commit dumps or `.env` to git.

---

## 9. Troubleshooting

| Issue | Action |
|-------|--------|
| `mongodump not found` | Install MongoDB Database Tools; verify `mongodump --version` |
| Connection timeout | Check Atlas IP allowlist, VPN, and `MONGO_URI` credentials |
| Auth failed | Confirm user has `read` on all collections (or `readAnyDatabase` for ops user) |
| Partial dump | Re-run; compare collection file count to live inventory in validation JSON |
| Large `activitylogs` / `messages` | Expected; use `--gzip`; consider TTL-aware retention policy separately |

---

## 10. Related files

| File | Purpose |
|------|---------|
| `backend/scripts/backup-mongodb.ps1` | Windows backup script |
| `backend/scripts/backup-mongodb.sh` | Unix backup script |
| `backend/scripts/validate-backup-batch11.js` | Automated verification |
| `backend/scripts/validate-restore-batch11.js` | Restore validation (Batch 11.3) |
| `backend/scripts/restore-mongodb.ps1` | Windows restore script |
| `backend/scripts/restore-mongodb.sh` | Unix restore script |
| `docs/database-recovery-procedure.md` | Recovery runbook (Batch 11.3) |
| `docs/batch-11.2-database-backup-report.md` | Batch 11.2 verification report |
| `docs/batch-11.3-restore-validation-report.md` | Batch 11.3 restore report |
| `docs/batch-11.4-media-backup-report.md` | Batch 11.4 media backup report |
| `docs/batch-11.4-configuration-backup-report.md` | Batch 11.4 configuration backup report |
| `docs/batch-11-final-backup-report.md` | Phase 11 final report |
| `docs/batch-11-backup-recovery-readiness.md` | Backup & recovery readiness |
| `backend/scripts/validate-backup-strategy-batch11.js` | End-to-end strategy validation (Batch 11.5) |
| `docs/03_Database.md` | Schema / collection reference |
| `docs/10_Deployment.md` | Deploy checklist (Atlas backups) |
