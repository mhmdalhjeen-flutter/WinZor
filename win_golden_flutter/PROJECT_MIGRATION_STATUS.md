# Project Migration Status: React to Flutter

## Project Overview
- **Project Name:** win_golden_flutter
- **Source of Truth:** `customerFrontend` (React + Vite)
- **Backend:** Node.js + Express (https://winzor.onrender.com)
- **Database:** MongoDB
- **Architecture:** Feature-First Layered Architecture (Flutter)
- **Status updated:** 2026-07-14

---

## 🛠 Development Strategy
We are converting the application page-by-page, ensuring 100% UI fidelity and backend compatibility.

| Step | Feature / Page | Status | Notes |
| :--- | :--- | :--- | :--- |
| 1–17 | Architecture → Chat | ✅ Completed | Approved. |
| 18 | Orders (was Cart & Orders) | ✅ Approved | **Cart UI removed permanently.** Orders-only. Do not modify unless bug. |
| 19 | Product Detail | ✅ Approved | Direct order + availability. Do not modify unless bug. |
| 20 | Favorites | ✅ Approved | Offer favorites only. Do not modify unless bug. |
| 21 | Change / Forgot Password + Verify Email | ✅ Approved | Do not modify unless bug. |
| 22 | Treasure Chests | ✅ Approved | Do not modify unless bug. |
| 23 | Honor Board / Leaderboard | ✅ Approved | Do not modify unless bug. |
| 24 | Points Program Stores / Store Search | ✅ Approved | Do not modify unless bug. |
| 25 | Verification Gate | ✅ Approved | Do not modify unless bug. |
| 26 | Brand Assets | ✅ Approved | Do not modify unless bug. |
| 27 | Final Migration Audit | ✅ Approved | Closure phase only. |
| 28 | Migration Closure (P0 + cleanup) | ✅ Completed | Production-ready closure. |

---

## Current position (as of 2026-07-14)

**Active milestone:** Migration closure complete — awaiting final approval / release

**Architecture decision:** Customer app has **no cart UI**. Ordering uses quantity → direct submit → My Orders.

---

## ⏸ Deferred items (approved — do later)

1. **Referral native share / cards**
2. **Google / social auth**
3. **Web audio effects**
4. **Notifications date / seen-id polish**
5. **Store Detail → Chat**
6. **Competitions navigation polish**
7. **FloatingCodeButton / promo redeem** (verify-gated when ported)
8. **Native app launcher / splash icons** (optional regenerate from brand mark)

---

## Orders-only notes (approved — do not modify unless bug)

### Locked decisions
- Cart UI removed permanently.
- Customer flow: Offer/Product → qty → Submit Order → My Orders.
- Cart APIs may remain internal (backend checkout depends on them).
- Cancel: status → cancelled + restore stock only; do **not** restore items to cart.

### Backend reality
- No public “create order without cart” endpoint.
- React `DirectOrderModal` already uses hidden cart APIs: `POST /cart/add` → `POST /cart/checkout`.
- Flutter mirrors that, plus `DELETE /cart/clear` first so checkout is single-item.

### Customer-facing APIs used
- Internal only: `DELETE /cart/clear`, `POST /cart/add`, `POST /cart/checkout`
- Visible: `GET /orders/my`, `PATCH /orders/:id/cancel`

---

## Product Detail notes (approved — do not modify unless bug)

### Locked decisions
- Orders-only flow remains the official customer ordering flow.
- Cart UI remains removed.
- No gallery / no favorites on Product Detail (React does not have them).
- Stock/availability UI is accepted; keep backend meaning documented below.

### Backend stock meaning
- `stock > 0` → managed inventory (qty capped at stock).
- `stock == 0` → unlimited / legacy (no stock cap beyond sheet max 99).
- `isActive == false` → unavailable (API may also 404 inactive products).

### Scope kept
- Single image, stars, store link, chat contact, **اطلب الآن** direct order.
- Entry points: `/product/:id`, store ProductCard, home category carousel, chat referenced items.

---

## Favorites notes (approved — do not modify unless bug)

### Locked decisions
- Favorite system is for **offers only** using existing backend activity APIs.
- Product favorites are **not** included.
- Marketplace/bazaar favorites remain inside Marketplace (`/bazaar/favorites`).
- Product Detail remains without a favorite button.
- Home reels favorite UI is **deferred**.

### APIs
- `GET /activity/favorites` (auth)
- `POST /activity/favorites/:offerId/toggle` (auth)

### Flutter surfaces
- `/favorites` page (auth gate → login)
- Offer Detail heart toggle
- Header heart icon → `/favorites`

### Card CTA
- Favorites cards use **اطلب الآن** (Orders-only) instead of React’s cart button.

---

## Auth password / verify notes (approved — do not modify unless bug)

### Locked decisions
- Existing OTP login/register flow remains unchanged.
- Verify Email is **only** email-link confirmation (`/verify-email?token=&uid=`).
- Verification Gate remains a **separate future task**.

### Scope kept
- Change Password, Forgot Password (OTP reset), Verify Email deep-link.

### APIs
- `POST /auth/password/change` (auth)
- `POST /auth/password/forgot` / `POST /auth/password/reset` (`appType: customer`)
- `GET /auth/verify/email-link`

---

## Treasure Chests notes (approved — do not modify unless bug)

### Locked decisions
- Chest rewards use `inventory.cards` from backend.
- Wheel inventory remains separate.
- Verification Gate remains a global future task.
- No changes to Treasure module unless bugs appear.

### APIs
- `GET /treasure/available` (auth)
- `POST /treasure/open/:boxId` (auth + verified middleware)

---

## Honor Board / Leaderboard notes (approved — do not modify unless bug)

### Locked decisions
- Ranking logic stays backend-controlled.
- Points leaderboard API remains unchanged.
- No filters added because React has none.

### APIs
- `GET /honor/active` (public)
- `GET /users/points-leaderboard` (auth)

---

## Points Program Stores / Store Search notes (awaiting approval)

### Scope
- `PointsProgramStores` → `/stores/points` (+ alias `/stores/points-program`)
- `StoreQuickSearch` → `/stores/search`
- Entry points: Explore “بحث سريع”, Home hero points CTA, Header “متاجر النقاط”

### Locked decisions
- Points eligibility remains backend (`GET /stores/points`); no client-side eligibility rules.
- Category filter on points page is client-side only (React `pointsProgramFilters.js` parity).
- Region filter sent as `regionId` (effective leaf); search as `q`.
- Quick search uses `GET /stores/by-regions` with `q`, `regionId`, `categoryId`.
- Navigation to existing Store Detail (`/store/:id`).
- Reuses Explore repository + hierarchy trees; does not duplicate Explore browse.

### APIs
- `GET /stores/points?q=&regionId=` (public)
- `GET /stores/by-regions?q=&regionId=&categoryId=` (public)
- `GET /regions?tree=true`, `GET /categories/tree?type=store` (filters)

---

## Verification Gate notes (awaiting approval)

### Scope
- Global `VerificationGateHost` (prompt + verify OTP modal + celebration)
- `runWithVerification` + `handleApiVerificationError` parity with React
- Soft snackbar-only paths replaced on treasure, draws, orders, wheel, competitions, marketplace, user-center suggestions/prefs

### Locked decisions
- Backend eligibility / `verifiedMiddleware` unchanged
- `VERIFICATION_FEATURE_FROZEN = true` mirrored (same as React + backend) — gate is inert until unfrozen
- Register / login / email-link / forgot-password flows unchanged
- Points Program Stores + shared Explore repository stay locked

### APIs
- `GET /settings/public` → `settings.verification`
- `POST /auth/verify/request` `{ channel }`
- `POST /auth/verify/confirm` `{ channel, code }`
- Protected actions still return `403` + `code: VERIFICATION_REQUIRED` when enforcement is on

---

## Brand Assets notes (awaiting approval)

### Scope
- Copied React logos into `assets/brand/`
- `AppBrandAssets` + `BrandLogo` widget
- Replaced icon placeholders in Header, HomeHero, PointsBadge, Intro, Login, Register

### Mapping
- Compact: `win-goldenstore-logo.png` → header / hero / points badge
- Full: `win-goldenstore-full.png` (from `win-goldenstore2222222.png`) → intro / login / register

### Fonts
- Cairo + Tajawal already via `google_fonts` in `AppTheme` (React CDN parity) — no local font files in React

### Out of scope
- Native launcher / splash regenerate
- Store logo fallbacks (`LucideIcons.store` for missing store images)
- Google Auth button remains a visual stub (separate module)

---

## 📝 Rules & Guidelines
1. **No Backend Changes**
2. **UI Fidelity** — React is source of truth (DirectOrderModal pattern)
3. **No Shortcuts** — business logic stays on backend
4. **Step-by-Step** — review and approve before next module
