# Project Migration Status: React to Flutter

## Project Overview
- **Project Name:** win_golden_flutter
- **Source of Truth:** `customerFrontend` (React + Vite)
- **Backend:** Node.js + Express (https://winzor.onrender.com)
- **Database:** MongoDB
- **Architecture:** Feature-First Layered Architecture (Flutter)

---

## 🛠 Development Strategy
We are converting the application page-by-page, ensuring 100% UI fidelity and backend compatibility.

| Step | Feature / Page | Status | Notes |
| :--- | :--- | :--- | :--- |
| 1 | Project Architecture | ✅ Completed | Feature-First structure established. |
| 2 | Global Theme & Typography | ✅ Completed | Tailwind colors, Cairo/Tajawal fonts, glass effects. |
| 3 | Intro Page | ✅ Completed | Hero logo, Video player, Persona cards. |
| 4 | Login Page | ✅ Completed | JWT, Device ID, phone-first auth. |
| 5 | Register Page | ✅ Completed | Registration flow + OTP Verification. |
| 6 | Home Page | ✅ Completed | Progressive Reels, Competitions, Search. |
| 7 | Stores (Explore) Page | ✅ Completed | Store browsing, search, and hierarchical filters. |
| 8 | Store Detail Page | ✅ Completed | Profile, active offers, product catalog, member prizes. |
| 9 | Offer Detail / Reel Viewer | ✅ Completed | Immersive vertical reels + static detail view. |
| 10 | API Contract Fixes (Priority 1A) | ✅ Completed | Regions, favorites, activity log, JWT refresh. |
| 11 | Points / User Center (Priority 1B) | ✅ Completed | Balance, level, achievements, prefs, profile actions. |
| 12 | Draws (Priority 1C) | ✅ Completed | Open draws list + join via existing `/draws` APIs. |
| 13 | Marketplace | ⏳ Pending | Next Priority 1 candidate. |
| 14 | Competitions (full module) | ⏳ Pending | Temp join sheet only in User Center. |
| 15 | Wheel | ⏳ Pending | Keep nav hooks; no fake logic. |
| 16 | Profile & Settings extras | ⏳ Pending | Change-password placeholder. |
| 17 | Notifications | ⏳ Pending | Point-sources feed uses notifications API. |
| 18 | Chat | ⏳ Pending | Admin-contact placeholder snackbar. |
| 19 | Cart & Orders | ⏳ Pending | |

---

## ⏸ Deferred items (approved — do later)

1. **Avatar upload** — Keep integration points (sheet + `PATCH /users/me/profile` avatar). File picker postponed until dependency resolve is fixed. Do not remove hooks.
2. **Referral native share** — Copy-link is temporary; native share later.
3. **Verification Gate** — Needs full React parity for protected actions (join draw, prefs, suggestions, etc.). Soft toast/error handling for now.
4. **Competitions module** — User Center join sheet is temporary only; full module converted separately.
5. **Wheel** — Keep navigation/integration points ready; do not implement fake logic.

---

## 🏗 Architecture Details

### Folder Structure
- `lib/core/`: Global infrastructure (API client, theme, router, shared models/widgets).
- `lib/features/`: Business modules (auth, home, stores, etc.).
- `lib/features/*/data/`: Repositories and models (JSON serialization).
- `lib/features/*/presentation/`: Pages, widgets, and Riverpod providers.

### Core Technologies
- **State Management:** Flutter Riverpod (`FutureProvider`, `StateNotifierProvider`).
- **Navigation:** GoRouter (with `StatefulShellRoute` for persistent BottomNav).
- **Network:** Dio (with JWT, refresh, and `x-device-id` interceptors).
- **Persistence:** Flutter Secure Storage (JWT) & Shared Preferences (Device ID).
- **UI:** Google Fonts (Cairo, Tajawal), Lucide Icons, AnimateDo.

---

## 📝 Rules & Guidelines
1. **No Backend Changes:** The Node.js API is the source of truth. No routes, request bodies, or responses are modified.
2. **UI Fidelity:** Every pixel, spacing, and animation must match the React app.
3. **No Shortcuts:** Business logic remains in the backend; Flutter serves as the presentation layer.
4. **Step-by-Step:** Each page is reviewed and approved before moving to the next.

---

## 🚀 Recently Completed: Priority 1C — Draws
- Replaced stub `DrawsPage` with full open-draws experience.
- APIs: `GET /draws/open`, `POST /draws/join` (`drawId`, `entriesToSpend: 1`).
- UI: rank badge, participant progress, join + invite, verification hint, auth gate.
- Updates `entriesWallet` on successful join (matches React `updateUser`).

### Differences / Assumptions
- No back chevron (shell tab root vs React nested stack).
- Verification Gate not ported — join errors/toasts only.
- Invite mirrors React toast (“شارك رابط المنصة…”), not deep-link share yet.
