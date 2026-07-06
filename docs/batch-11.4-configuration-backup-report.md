# Batch 11.4 — Configuration Backup Report

> Completed: **2026-07-04**  
> Scope: Verify backup coverage for runtime configuration, platform settings, and environment files.  
> Related: [Batch 11.2 database backup](batch-11.2-database-backup-report.md) · [Media backup report](batch-11.4-media-backup-report.md)

---

## Executive Summary

| Area | Result |
|------|--------|
| Platform settings (`SystemSetting`) | ✓ 11 documents in MongoDB — covered by dump |
| Runtime secrets (`.env`) | ✓ Excluded from git; backup via secret manager |
| `.env.example` templates | ✓ All 4 apps have templates |
| Gitignore env rules | ✓ `.env` blocked, `.env.example` allowed |
| Static UI assets | ✓ Tracked in Git |
| Backup tooling | ✓ Batch 11.2/11.3 scripts present |

**Score (configuration checks): 12 PASS · 0 FAIL · 3 WARN**

**Verdict:** **Database-backed configuration** is covered by mongodump. **Runtime secrets** must be backed up separately via encrypted secret manager — never git or database dump. Document and automate `.env` export at deploy time.

---

## 1. Configuration Sources

| Source | Location | Backup method |
|--------|----------|---------------|
| Platform toggles | MongoDB `systemsettings` | `mongodump` / Atlas |
| Feature defaults | `platformSettings.service.js` (code) | Git repository |
| Runtime secrets | `backend/.env`, frontend `.env` files | **Secret manager** (manual encrypted export) |
| Env templates | `**/.env.example` | Git repository |
| Rate limits / CORS | Environment variables | Secret manager |
| Static branding defaults | `defaultStoreBranding.util.js` | Git repository |

---

## 2. Platform Settings (MongoDB)

**Collection:** `systemsettings`  
**Documents (live):** 11

| Key | In code defaults | In DB |
|-----|------------------|-------|
| draws_enabled | ✓ | ✓ |
| maintenance_mode_enabled | ✓ | ✓ |
| marketplace_enabled | ✓ | ✓ |
| store_competitions_enabled | ✓ | ✓ |
| store_owner_cart_enabled | ✓ | ✓ |
| store_owner_competitions_enabled | ✓ | ✓ |
| store_owner_member_prizes_enabled | ✓ | ✓ |
| store_owner_warehouses_enabled | ✓ | ✓ |
| wheel_enabled | ✓ | ✓ |
| platform_sensitive_password_hash | — | ✓ (admin security) |
| referral_verification_gate_migrated | — | ✓ (migration flag) |

**Keys using code defaults only (no DB row yet):**

`referral_reward_points`, `referral_program_enabled`, `wheel_spin_cost`, `wheel_spin_interval_ms`, `wheel_placements`

These fall back to `DEFAULTS` in `platformSettings.service.js` — restored automatically when code is deployed; no separate backup needed.

---

## 3. Environment File Handling

### 3.1 Git exclusion (verified)

Root `.gitignore`:

```
.env
.env.*
!.env.example
**/.env
**/.env.*
```

| Check | Result |
|-------|--------|
| `.env` blocked from git | ✓ |
| `.env.example` allowed | ✓ |
| Local `.env` files exist on dev machine | ✓ (not committed) |

### 3.2 `.env.example` coverage (4 apps)

| App | Template | Key variables documented |
|-----|----------|--------------------------|
| backend | `backend/.env.example` | MONGO_URI, JWT_SECRET, SMTP, Twilio, OAuth, CORS, admin seed |
| customerFrontend | `customerFrontend/.env.example` | VITE_API_URL, Google/Facebook/TikTok OAuth |
| store-supplier-frontend | `store-supplier-frontend/.env.example` | VITE_API_URL |
| admin-panelFrontend | `admin-panelFrontend/.env.example` | VITE_API_URL |

### 3.3 Backend env vars — backup classification

| Variable | In `.env.example` | Backup method |
|----------|-------------------|---------------|
| MONGO_URI | ✓ | Secret manager |
| JWT_SECRET | ✓ | Secret manager |
| GOOGLE_CLIENT_ID | ✓ | Secret manager |
| SMTP_* | ✓ | Secret manager |
| TWILIO_* | ✓ | Secret manager |
| CORS_ORIGINS | ✓ | Secret manager |
| MASTER_KEY | **WARN — not in example** | Secret manager |
| TRUST_PROXY | **WARN — not in example** | Secret manager |
| API_RATE_LIMIT_MAX | **WARN — not in example** | Secret manager (optional) |
| MONGODB_SLOW_QUERY_MS | **WARN — not in example** | Secret manager (optional) |

**Policy:** Never commit `.env` or store secrets in MongoDB. Export production env to encrypted vault (1Password, AWS Secrets Manager, Render env, etc.) after each rotation.

---

## 4. Important Assets Coverage Matrix

| Asset | Backup | Restore path |
|-------|--------|--------------|
| Embedded media (16 data URLs) | MongoDB dump | Batch 11.3 restore |
| Platform settings (11 docs) | MongoDB dump | Batch 11.3 restore |
| JWT / API secrets | Secret manager export | Manual re-import to `.env` |
| OAuth client secrets | Secret manager | Manual re-import |
| Static SVG icons (4 files) | Git | `git clone` / deploy artifact |
| Backup/restore scripts | Git | Repository checkout |
| Documentation (`docs/`) | Git | Repository checkout |
| Activity logs / audit | MongoDB dump | Batch 11.3 restore |

---

## 5. Recommended Configuration Backup Procedure

### At deploy / weekly

1. **Database** — Atlas continuous backup or `backup-mongodb.ps1` / `.sh` (Batch 11.2)
2. **Secrets** — Export env vars from hosting secret manager to encrypted offline store
3. **Templates** — Ensure `.env.example` updated when new vars added (Git)
4. **Verify** — Run validation script

```bash
cd backend
node scripts/validate-media-config-batch11.js
node scripts/validate-backup-batch11.js
node scripts/validate-restore-batch11.js
```

### Disaster recovery order

1. Restore MongoDB (platform settings + data)
2. Re-import secrets from secret manager into hosting env
3. Redeploy application from Git (code defaults + static assets)
4. Smoke test `/api/v1/health` and admin settings panel

---

## 6. Validation Results

| Check | Result |
|-------|--------|
| `config_systemsettings_exists` | PASS — 11 documents |
| `config_platform_keys` | WARN — 5 keys use code defaults only |
| `config_backup_coverage` | PASS — in mongodump scope |
| `env_gitignore_blocks` | PASS |
| `env_example_exists` (×4) | PASS |
| `env_example_coverage` | PASS — required keys documented |
| `env_example_optional_gaps` | WARN — MASTER_KEY, rate limits not in example |
| `env_handling_policy` | PASS |
| `assets_static_files` | PASS |
| `assets_backup_tooling` | PASS |
| `assets_coverage_matrix` | PASS |

---

## 7. Gaps & Recommendations

| Gap | Severity | Action |
|-----|----------|--------|
| Secrets not in DB backup | Expected | Maintain secret manager export; document in runbook |
| MASTER_KEY not in `.env.example` | Low | Add to template when documenting admin recovery |
| Optional env vars undocumented | Low | Add TRUST_PROXY, rate limits to `.env.example` comments |
| No automated secret backup in repo | Expected | Configure host-level secret backup (Render/Railway/VPS) |

---

## 8. Production Readiness

| Area | Grade | Notes |
|------|-------|-------|
| DB-backed config backup | A | systemsettings in every dump |
| Env file security | A | Gitignored; templates committed |
| Secret backup process | B | Documented; needs ops automation |
| Static asset backup | A | Git + build artifacts |
| End-to-end config restore | B | Requires DB restore + secret re-import |

**Ready for beta** when production secrets are stored in a managed secret store with documented export/restore procedure.

---

## 9. Re-run

```bash
cd backend
node scripts/validate-media-config-batch11.js
```

Output: `backend/_batch11_media_config_validation.json`
