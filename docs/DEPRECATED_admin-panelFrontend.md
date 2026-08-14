# Deprecated: `admin-panelFrontend/`

> **Status:** DEPRECATED — not used for production (verified 2026-08-13).

## Summary

The canonical production Admin application is **`admin/`** (Win Gold Admin PWA, full feature set).

The folder name **`admin-panelFrontend/`** refers to an older, incomplete fork (~5 pages) that duplicated part of the admin UI. It is **not** referenced by:

- Backend CORS production allowlist (`backend/server.js` → `https://adminwingold.pages.dev` maps to **`admin/`**)
- Any CI/deploy config in this repository
- Current workspace layout (the fork folder is absent; do not recreate it for production)

## Historical names (documentation only)

Older docs used these directory names. They map to current production folders as follows:

| Legacy name in docs | Current production folder | Production host (examples) |
|---------------------|---------------------------|----------------------------|
| `customerFrontend` | `customer/` | Cloudflare Workers / Pages |
| `store-supplier-frontend` | `adminstore/` | `win-gold-supplier.pages.dev` |
| `admin-panelFrontend` | **`admin/`** (canonical) | `adminwingold.pages.dev` |
| *(not in old docs)* | `delivery/` | `delivery-win-gold.pages.dev` |

## If you find `admin-panelFrontend/` locally

- **Do not deploy it** to production admin hosts.
- **Do not delete automatically** without team confirmation — it may exist only as an old local copy.
- Use **`admin/`** for all admin development, build, and deploy.
- Safe action: archive or ignore the folder; update any personal scripts that still `cd admin-panelFrontend`.

## Why it was deprecated

- Incomplete feature set vs `admin/` (missing subscriptions, delivery billing, PWA, most admin pages).
- Known build failure (Vite rolldown native binding) in audit.
- Login API mismatch (`email` vs backend `identifier`).
- No production URL registered in backend CORS defaults.
