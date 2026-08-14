# Repository structure (production layout)

> **Last reviewed:** 2026-08-13. Read this before changing folders, git layout, or deploy targets.

---

## 1. Production applications

| Folder | Role | Deploy target (from backend CORS defaults) |
|--------|------|------------------------------------------|
| **`backend/`** | Express API + MongoDB | `https://winzor.onrender.com` (and similar) |
| **`customer/`** | Customer marketplace PWA | `winzor-customer.*`, `win-gold-shopping.*`, Netlify/Pages |
| **`adminstore/`** | Store & supplier dashboard | `win-gold-supplier.pages.dev` |
| **`admin/`** | **Canonical** admin panel | `adminwingold.pages.dev` |
| **`delivery/`** | Delivery company & driver PWA | `delivery-win-gold.pages.dev` |

Shared rule: **one backend**, **one MongoDB database**, **multiple independent frontends**.

Deprecated fork: see [`DEPRECATED_admin-panelFrontend.md`](./DEPRECATED_admin-panelFrontend.md).

---

## 2. Monorepo root vs nested Git repositories

The workspace root is a git repository (`offersTech`). **Five subfolders also contain their own `.git` directories:**

| Path | Nested remote (origin) | Notes |
|------|----------------------|--------|
| `admin/.git` | `winzor-admin0.git` | Separate history; pushes go to admin-only repo |
| `customer/.git` | `winzor-customer.git` | Separate history |
| `adminstore/.git` | `winzor-supplier.git` | Separate history |
| `delivery/.git` | `delivery-win-gold.git` | Separate history |
| `backend/.git` | `backend-To-WinGold.git` | Separate history |

### What this means (no action taken automatically)

- **`git` commands run inside a subfolder** use that nested repo, not necessarily the monorepo root.
- **Removing nested `.git` folders** would:
  - Stop independent push/pull per app
  - Require choosing a single remote for the monorepo
  - Risk losing per-app branch history unless merged carefully
  - Affect any CI that clones individual repos (`winzor-admin0`, etc.)
- **Recommended before any merge:** inventory open PRs, deploy hooks, and which remote each host (Pages/Render) builds from.

### Safe workflow today

- Develop in monorepo paths (`admin/`, `customer/`, …).
- When deploying from standalone repos, sync/copy from monorepo or push from nested repo intentionally — do not assume root and nested remotes stay in sync.

---

## 3. Build artifacts (`dist/`)

### Local state (typical after `npm run build`)

| App | `dist/` on disk | Ignored by app `.gitignore` |
|-----|-----------------|----------------------------|
| `admin/` | Often present | Yes (`dist/`) |
| `customer/` | Often present | Yes |
| `adminstore/` | Often present | Yes |
| `delivery/` | Often present | Yes |
| `backend/` | Usually absent | Yes |

Root `.gitignore` also lists `dist/` and `**/dist/`.

### Tracked `dist/` in nested repos (do not delete blindly)

Some **nested** git repositories still have **`dist/` files committed** from earlier deploy workflows (e.g. `admin/dist/_redirects`, `customer/dist/_headers`). These may be relied on by **Cloudflare Pages / static host** configs that deploy directly from the nested repo.

**Do not delete `dist/` folders** until you confirm how each host builds (build-on-CI vs commit `dist`).

To stop **new** build output from being committed (after confirming deploy does not need committed `dist`):

```bash
# Run inside the relevant nested repo, NOT at monorepo root
git rm -r --cached dist/
git commit -m "Stop tracking Vite dist output"
```

Only run after verifying the deployment pipeline runs `npm run build` on the host.

---

## 4. Documentation map

| Topic | File |
|-------|------|
| Project overview | `00_Project_Overview.md` |
| Folder tree | `02_Project_Structure.md` |
| Frontends | `05_Frontend.md` |
| Local run & deploy | `10_Deployment.md` |
| Deprecated admin fork | `DEPRECATED_admin-panelFrontend.md` |
