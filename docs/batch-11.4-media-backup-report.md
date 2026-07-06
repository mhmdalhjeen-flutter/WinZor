# Batch 11.4 — Media Backup Report

> Completed: **2026-07-04**  
> Scope: Verify backup coverage for uploaded and referenced media assets.  
> Related: [Batch 11.2 database backup](batch-11.2-database-backup-report.md) · [Configuration backup report](batch-11.4-configuration-backup-report.md)

---

## Executive Summary

| Area | Result |
|------|--------|
| Media storage model identified | ✓ MongoDB-embedded (no filesystem uploads) |
| Live media inventory | ✓ 35 documents with media across 10 collections |
| Embedded images (data URLs) | ✓ 16 — covered by `mongodump` |
| External images (https URLs) | ✓ 20 — DB refs backed up; remote files need separate policy |
| Filesystem upload directory | ✓ None — no separate media folder to back up |
| Restore path | ✓ Restored with database (Batch 11.3) |

**Score (media checks): 5 PASS · 0 FAIL · 1 WARN**

**Verdict:** All **uploaded** media is stored inside MongoDB and is **fully covered** by database backup/restore procedures. External `https://` references are backed up as URL strings only — remote hosting is out of scope unless mirrored separately.

---

## 1. Media Storage Architecture

| Aspect | Finding |
|--------|---------|
| Upload mechanism | Client sends data URL → backend `imageProcess.util.js` → WebP data URL stored in MongoDB |
| Filesystem uploads | **None** — no `uploads/`, `storage/`, or `express.static` media directory |
| External URLs | Legacy/existing `https://` strings preserved as-is (not re-uploaded) |
| Max upload size | 3 MB JSON body limit (`server.js`); images validated ≤ ~1.2 MB data URL |

Images are **not** stored as separate files on disk. A successful `mongodump` / Atlas backup captures all embedded media bytes.

---

## 2. Media Field Inventory

| Collection | Fields | Documents with media |
|------------|--------|----------------------|
| users | `avatar` | 1 |
| stores | `logo`, `coverImage` | 1 |
| products | `image` | 8 |
| offers | `image` | 10 |
| bazaarlistings | `images[]` | 1 |
| competitions | `image` | 1 |
| messages | `image` | 4 |
| wheelprizes | `image` | 3 |
| achievementmilestones | `image` | 6 |
| storememberprizes | `image` | 0 |

**Total documents with at least one media value:** 35

---

## 3. Live Media Breakdown (2026-07-04)

| Type | Count | Backup method |
|------|-------|---------------|
| Embedded data URLs (`data:image/webp;base64,…`) | **16** | Included in MongoDB dump |
| External https URLs | **20** | URL string in dump; **remote file not copied** |
| Empty / no media | Remaining field slots | N/A |

### Per-collection detail

| Collection | Data URLs | https URLs | Empty |
|------------|-----------|------------|-------|
| users | 1 | 0 | 212 avatars empty |
| stores | 2 | 0 | 16 empty slots |
| products | 3 | 5 | 0 |
| offers | 3 | 7 | 3 |
| bazaarlistings | 1 | 0 | 0 |
| competitions | 0 | 1 | 1 (+ 2 non-URL placeholders) |
| messages | 4 | 0 | 22 |
| wheelprizes | 1 | 2 | 2 |
| achievementmilestones | 1 | 5 | 0 |

---

## 4. Backup & Restore Coverage

| Asset type | Backed up by | Restore verified |
|------------|--------------|------------------|
| Embedded WebP data URLs | `mongodump` / Atlas | ✓ via Batch 11.3 logical restore |
| https URL references | `mongodump` (string only) | ✓ |
| Remote https file content | **Not automatic** | WARN — depends on third-party host |
| Default SVG branding | In code (`defaultStoreBranding.util.js`) | ✓ Git |

### Recommended ops policy for https URLs

1. Inventory external URLs periodically (query or validation script).
2. Prefer migrating legacy https images to embedded WebP on next edit.
3. If critical assets use external CDN, mirror to durable storage or document CDN backup SLA.

---

## 5. Validation

```bash
cd backend
node scripts/validate-media-config-batch11.js
```

Media-specific checks in validation output:

- `media_filesystem_uploads` — confirms no orphan upload directory
- `media_inventory_live` — counts data URLs vs https URLs
- `media_backup_coverage` — confirms MongoDB backup path

Output: `backend/_batch11_media_config_validation.json`

---

## 6. Gaps & Recommendations

| Gap | Severity | Action |
|-----|----------|--------|
| 20 https URL references | Low | URLs restored with DB; verify remote hosts remain available |
| No dedicated media export | None | Not needed — embedded model |
| Large messages with chat images | Low | Already in `messages` collection; included in dump |

---

## 7. Production Readiness

| Area | Grade | Notes |
|------|-------|-------|
| Uploaded media backup | A | 100% in MongoDB |
| Restore with database | A | Verified Batch 11.3 |
| External URL resilience | B | Document CDN/host dependency |
| Filesystem media backup | A | N/A — no filesystem media |

**Ready for beta** — media backup is satisfied by database backup procedures (Batches 11.2 + 11.3).
