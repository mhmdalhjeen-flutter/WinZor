# CHANGE LOG — سجل التغييرات التنفيذية

> **كل تعديل فعلي على الكود** يُسجَّل هنا (bug fix، perf، إكمال feature موجود).
> **لا أفكار مستقبلية** — تلك في `TODO.md`.
> **لا حالة مشروع** — تلك في `16_LAUNCH_MEMORY.md`.
>
> أرشيف v0.1–0.16: `13_CHANGE_LOG.md`

---

## قالب إدخال سريع

```
## YYYY-MM-DD — عنوان مختصر
**نوع:** bug | perf | fix | completion
**Backend:** ...
**Frontend (customer/store/admin):** ...
**DB:** نعم/لا — تفاصيل
**Breaking:** لا
```

---

> ⬆️ الأحدث في الأعلى.

---

## 2026-07-04 — Backup Batch 11.5 (strategy validation — Phase 11 complete)

**نوع:** completion (backup — validation only)

**Strategy validation performed:**
- Component inventory: 8 docs + 8 scripts — all present
- Sub-batch aggregation: 11.2 (10/0/2), 11.3 (13/0/2), 11.4 (24/0/2) — all pass with expected WARNs
- Restore readiness: live DB 40 collections / 793 docs; health endpoint for smoke test
- Risk registry: 8 open risks (3 medium, 5 low) documented
- Readiness grade: **Overall B** — beta-ready with ops layer

**Score:** 20 pass · 0 fail · 3 warn

**Deliverables:**
- Final report: `docs/batch-11-final-backup-report.md`
- Readiness: `docs/batch-11-backup-recovery-readiness.md`
- Validation: `backend/scripts/validate-backup-strategy-batch11.js`

**Backend:** validation script only — no production code changes

**DB:** read-only + sub-validators (scratch DB create/drop in 11.3)

**Breaking:** لا

---

## 2026-07-04 — Backup Batch 11.4 (media & configuration backup verification)

**نوع:** completion (backup — verification + documentation only)

**Media verification:**
- Storage model: images embedded in MongoDB (WebP data URLs) — no filesystem upload directory
- Live inventory: 16 embedded data URLs, 20 external https references, 35 documents with media
- Backup coverage: all uploaded media included in mongodump (Batch 11.2) — pass

**Configuration verification:**
- Platform settings: 11 `SystemSetting` documents in MongoDB — covered by dump
- Environment: `.env` gitignored; 4× `.env.example` templates present
- Secrets policy: runtime env backed up via secret manager, not git/DB
- Static assets + backup scripts: present in repository

**Score:** 24 pass · 0 fail · 2 warn

**Deliverables:**
- Media report: `docs/batch-11.4-media-backup-report.md`
- Configuration report: `docs/batch-11.4-configuration-backup-report.md`
- Validation: `backend/scripts/validate-media-config-batch11.js`

**Backend:** validation script only — no production code changes

**DB:** read-only inventory queries

**Breaking:** لا

---

## 2026-07-04 — Backup Batch 11.3 (restore validation)

**نوع:** completion (recovery — verification + documentation only)

**Verification performed:**
- Recovery procedure + restore scripts (PS1/SH) documented
- Restore to scratch DB `test_restore_verify_*` — logical copy (793 documents, 40 collections)
- Post-restore consistency: all collection counts match source — pass
- Critical fingerprints (users, stores, orders, offers, products) — pass
- Referential spot-check (order → user) — pass
- Physical `mongorestore` + index restore — WARN (MongoDB Database Tools not on validation host)
- Scratch DB dropped after validation — pass

**Score:** 13 pass · 0 fail · 2 warn

**Deliverables:**
- Recovery runbook: `docs/database-recovery-procedure.md`
- Report: `docs/batch-11.3-restore-validation-report.md`
- Scripts: `backend/scripts/restore-mongodb.ps1`, `backend/scripts/restore-mongodb.sh`
- Validation: `backend/scripts/validate-restore-batch11.js`

**Backend:** restore scripts + validation tooling only — no production code changes

**DB:** scratch DB only (created and dropped during validation)

**Breaking:** لا

---

## 2026-07-04 — Backup Batch 11.2 (database backup verification)

**نوع:** completion (backup — verification + documentation only)

**Verification performed:**
- Live DB connection to Atlas database `test` — 40 collections, 793 documents
- All 34 app model collections present; 6 legacy collections flagged for inclusion in dumps
- Consistency: document counts stable across double-read — pass
- Integrity: sample read from all non-empty collections + index metadata on critical collections — pass
- Physical `mongodump` / restore round-trip — WARN (MongoDB Database Tools not installed on validation host)

**Score:** 10 pass · 0 fail · 2 warn

**Deliverables:**
- Procedure: `docs/database-backup-procedure.md`
- Report: `docs/batch-11.2-database-backup-report.md`
- Scripts: `backend/scripts/backup-mongodb.ps1`, `backend/scripts/backup-mongodb.sh`
- Validation: `backend/scripts/validate-backup-batch11.js`

**Backend:** backup scripts + validation tooling only — no schema or production code changes

**DB:** لا — read-only verification

**Breaking:** لا

---

## 2026-07-04 — Monitoring Batch 10.5 (validation — Phase 10 complete)

**نوع:** completion (monitoring — validation only)

**Validation performed:**
- Component inventory: 6 monitoring modules + server/db wiring — all present
- Log tests: JSON envelope, sanitization — pass
- Live simulations: 404, 401 (missing + bad JWT), health 200 — pass
- Live log verification: `http_request` for 200/401/404; `mongodb_slow_query` during startup; `server_started`, `mongodb_connected`
- Health schema: server + database metrics + ping — pass
- CORS simulation: WARN in dev (open CORS until `CORS_ORIGINS` set in production)

**Score:** 16 pass · 0 fail · 1 warn

**Validation script:** `backend/scripts/validate-monitoring-batch10.js`

**Final report:** `docs/batch-10-final-monitoring-report.md`

**Production readiness:** READY for beta with PM2/Docker + log shipper + health polling (ops layer)

**Backend:** validation script only — no production code changes

**DB:** لا

**Breaking:** لا

---

## 2026-07-04 — Monitoring Batch 10.4 (diagnostics verification)

**نوع:** completion (monitoring — verification only)

**Verified diagnostics (Batches 10.1–10.3):**
- **Repeated errors:** Partial — failed-login suspicious activity (≥5/24h), rate-limit security audit; generic error bursts require log-aggregator rules
- **Failed requests:** Pass — all `/api/*` responses logged as `http_request` (warn ≥400, error ≥500) + `server_error`/`request_error` on Express errors
- **Server crashes:** Partial — startup failures logged before `exit(1)`; no `uncaughtException`/`unhandledRejection`/signal handlers
- **Log consistency:** Pass — all events use `safeLog` JSON `{ at, event, … }`; JSON parse verified
- **Monitoring coverage:** Pass for backend Phase 10 scope; gaps documented (crash hooks, push alerts, frontend, Prometheus)

**Operational alert recipes documented** for PM2/log-shipper use (no app code changes).

**Report:** `docs/batch-10.4-diagnostics-report.md`

**Backend:** لا تغيير كود — تحقق وتشخيص فقط

**DB:** لا

**Breaking:** لا

---

## 2026-07-04 — Monitoring Batch 10.3 (database monitoring)

**نوع:** completion (monitoring)

**Backend — MongoDB performance monitoring:**
- `dbHealth.util.js` — connection status, pool metrics (driver pool events), query latency (command monitoring), slow query detection (default ≥500ms → `mongodb_slow_query`), periodic `mongodb_health` log every 5 min
- `db.js` — `monitorCommands: true` + `setupDbMonitoring()` after connect
- `GET /api/v1/health` — `data.server.database` now includes connection, pool, queries, and live ping; endpoint async for ping verification
- Optional env: `MONGODB_SLOW_QUERY_MS` (default 500)

**Database health verified:** connect + ping + metrics collection (2026-07-04)

**Report:** `docs/batch-10.3-database-monitoring-report.md`

**DB:** لا — monitoring hooks only; no schema/index/query changes

**Breaking:** لا — additive fields under `data.server.database`; HTTP 200 preserved

---

## 2026-07-04 — Monitoring Batch 10.2 (server health monitoring)

**نوع:** completion (monitoring)

**Backend — Server health metrics:**
- `serverHealth.util.js` — CPU (process % + load avg), RAM (process + system), process uptime, event loop delay (`perf_hooks.monitorEventLoopDelay`), MongoDB connection state
- `GET /api/v1/health` — enriched response: `data.status` (healthy/degraded/unhealthy) + `data.server` metrics object
- Periodic structured log `server_health` every 5 minutes via `safeLog` (info/warn/error by event loop status)
- `startServerHealthMonitoring()` wired in `server.js` at boot

**Health endpoint verified:** `GET /api/v1/health` → HTTP 200 with full metrics (2026-07-04)

**Report:** `docs/batch-10.2-health-monitoring-report.md`

**DB:** لا

**Breaking:** لا — HTTP 200 preserved; existing `data.status` field retained; new fields additive under `data.server`

---

## 2026-07-04 — Monitoring Batch 10.1 (logging foundation verification)

**نوع:** completion (monitoring — verification only)

**Backend — Logging infrastructure verified (implemented in Security Batch 4.5):**
- Structured application logging: `logSanitize.util.js` → `safeLog` (JSON lines, sanitization, info/warn/error levels)
- Request logging: `requestLog.middleware.js` on all `/api/*` (method, path, status, duration, ip — no body/headers)
- Error logging: global handler + service-level `safeLog` events; stack omitted in production
- Security event logging: `auditService.logSecurityEvent` → `ActivityLog` (auth, role, ownership, rate limit, CORS, suspicious login)
- Audit logging: `logAdminAction` + `adminAuditMiddleware` + `logSensitiveOperation` + `logAuthAttempt` → immutable `ActivityLog`

**Verification results:**
- No raw `console.*` in runtime backend code (except `safeLog` sink + CLI benchmark script)
- Admin audit query/export routes operational (`/api/admin/audit/*`)
- All five log types consistent and production-ready

**Report:** `docs/batch-10.1-monitoring-report.md`

**Backend:** لا تغيير كود — تحقق فقط

**DB:** لا

**Breaking:** لا

---

## 2026-07-04 — Authorization Testing Batch 6.5 (role security validation)

**نوع:** bug fix (authorization testing)

**Backend — AuthZ hardening:**
- `product.controller.js` `updateProduct`: زبون بدون متجر كان يسبب 500 (`store._id` على null) عند `PUT /products/:id` — أصبح 403 `غير مسموح`.
- `offer.controller.js` `createOffer`: أُضيف فحص دور (`store`/`supplier`/`admin`) قبل إنشاء عرض؛ الزبون يحصل 403 بدل 404 مضلل.
- `offer.service.js` `getMyOffers` + `offer.routes.js`: الزبون على `GET /offers/my` أصبح 403 بدل 404.

**تم التحقق (direct API — bypass frontend):**

| Check | Result |
|-------|--------|
| Customer → `/admin/*` | 403 |
| Store → `/admin/*` | 403 |
| Customer → `/products/my`, `/orders/store`, `/offers/dashboard` | 403/404 — لا بيانات متجر |
| Store → delete/renew foreign offer | 403 |
| Store → delete foreign product | 403 |
| Customer → profile with `role`/`points` in body | ignored — role/points unchanged |
| Missing/invalid JWT | 401 |
| Store creds + `appType: customer` | 403 |
| Banned / suspended user | 403 `ACCOUNT_BLOCKED` |
| Ban/suspend bumps `tokenVersion` | old JWT rejected on next request |
| Admin → admin routes | 200 |
| Customer register | stays `customer` role |

**Frontend guards (spot-check):** admin `ProtectedRoute` requires `adminToken` + `role === admin`؛ store/customer apps use role-based `ProtectedRoute` — **الحماية الفعلية على API middleware**.

**DB:** لا

**Breaking:** لا

---

## 2026-07-04 — Functional Testing Batch 6.4 (light full-system sweep)

**نوع:** bug fix (functional testing)

**Backend — Cart / checkout:**
- `cart.service.js`: checkout كان يفلتر عناصر المستودعات (supplier) حتى لصاحب المحل الذي أضافها للسلة بنجاح — 400 بعد add-to-cart. فلتر checkout أصبح يسمح بعناصر `store` و`supplier` لأدوار `store`/`supplier`، ويبقي قيد الزبون (`customer`) على عروض أصحاب المحلات فقط.

**Frontend (store):**
- `Cart.jsx`: عرض سعر عناصر العروض كان يقرأ `item.price` فقط → 0 ₪ للعروض. يستخدم الآن `unitPrice` من استجابة السلة ثم حقول التسعير الاحتياطية (مثل customer cart).

**تم فحصه (API):**
- **Customer:** register 201، login 200، feed/regions/categories/stores 200، cart/orders/notifications/chats/wheel/achievements 200، add-to-cart غير موثق → 403 `VERIFICATION_REQUIRED`، competitions 200.
- **Store:** products/offers/orders/chats/notifications/stores/my 200؛ cart/warehouses → 403 `STORE_PAGE_DISABLED` (إعداد منصة — متوقع).
- **Admin:** dashboard/stats/analytics/users/stores/activation-keys/admin-codes 200.
- **Auth guards:** `/users/me` و`/admin/*` بدون token → 401.

**تم فحصه (UI):**
- Customer home (`:5173`): عروض ومناطق وتصنيفات حقيقية من backend؛ لا crash.
- Store login (`:5174`) و Admin login (`:5175`): render صحيح.

**مؤجل (لا bug fix في هذا batch):**
- صور base64 مخفية في list APIs (thumbnails فارغة بعد الرفع).
- تسعير العروض على store detail / favorites بدون `pricing` DTO.
- `OfferCard` contrast على خلفية store detail بيضاء.

**DB:** لا

**Breaking:** لا

---

## 2026-07-04 — Functional Testing Batch 6.3 (store / merchant flow)

**نوع:** bug fix (functional testing)

**Frontend (store):**
- `Orders.jsx`: عند تسليم الطلب يرجع backend `{ deleted: true }` ويحذف السجل؛ الواجهة كانت تُبقي الطلب في القائمة بحالة `delivered`. الآن تُزال من cache React Query مباشرة.
- `WarehouseDetail.jsx`: تبويب عروض المستودع كان يقرأ `name/price/endDate` بينما API يعيد `title/finalPrice|pricing/expiresAt` — أُضيفت دوال عرض متوافقة مع شكل الاستجابة الحالي.

**Backend:**
- `server.js`: `uploadLimiter` كان يُطبَّق على كل طلبات مسارات مثل `/api/chats` بما فيها GET، فكان `/chats/unread-count` وقوائم القراءة تصل أحياناً إلى `429`. أُضيف `uploadWriteLimiter` لتطبيق الحد على POST/PUT/PATCH/DELETE فقط.

**تم فحصه (API + UI حيث أمكن):**
- Dashboard: `/products/my`, `/orders/store`, `/offers/dashboard`, badges (`/orders/store/pending-count`, `/notifications/unread-count`, `/chats/unread-count`).
- Add/Edit/Delete offers: POST/PATCH renew/DELETE على `/offers` — استجابات `{ offer|message }` مستقرة؛ صفحة إدارة العروض تعرض العناصر وأزرار التجديد/الإيقاف.
- Products: POST/PUT/DELETE على `/products` — `{ product, message }`؛ تعديل من `MyStore` يعمل.
- Orders management: `/orders/store` → `{ orders, cards, bypassCards }`؛ تحديث الحالة عبر PATCH `/orders/:id/status`.
- Chat (store side): GET `/chats`, POST إنشاء محادثة، POST إرسال رسالة — `{ conversations }` / `{ message }`.
- Notifications: GET `/notifications`, PATCH read / read-all — `{ notifications }`, `{ count }`.
- Inventory / warehouse: `/stores/warehouses` و`/store-owner/cart` يرجعان `403 STORE_PAGE_DISABLED` عندما تكون الصفحات معطّلة في إعدادات المنصة؛ الواجهة تخفي روابط السلة/المستودعات عبر `StoreFeatureRoute` و`useStoreOwnerPermissions` (سلوك متوقع، ليس mismatch).
- `store-supplier-frontend/.env`: `VITE_API_URL=http://localhost:5000/api` مضبوط — الطلبات تذهب إلى backend.

**DB:** لا

**Breaking:** لا

---

## 2026-07-04 — Functional Testing Batch 6.2 (customer features)

**نوع:** bug fix (functional testing)

**Frontend (customer):**
- إصلاح إعداد التشغيل المحلي في `customerFrontend/.env` بإضافة `VITE_API_URL=http://localhost:5000/api`.
- كان غياب `VITE_API_URL` يجعل طلبات الواجهة النسبية تذهب إلى Vite frontend بدل backend، فتظهر Home بدون عروض/مناطق/تصنيفات رغم أن API يعمل.

**تم فحصه:**
- Home / feed loading: العروض، المناطق، التصنيفات، والمسابقة تظهر من backend.
- Offers browsing + offer details: `/offers/feed` و`/offers/:id` متوافقان مع الواجهة.
- Store browsing + store details: `/stores/browse` و`/stores/:id` متوافقان مع الواجهة.
- Product detail: `/products/:id` يعرض الاسم، السعر، المتجر، وزر الإضافة.
- Cart / orders: السلة الفارغة و`/orders/my` يعرضان الحالة المتوقعة للحساب الجديد.
- Add to cart للزبون غير الموثق: يظهر prompt التوثيق بدل bypass أو فشل صامت.
- Points/user center: النقاط، المستوى، الإحصائيات، وكود الدعوة تظهر بشكل صحيح.

**Backend:** لا تغيير

**DB:** لا

**Breaking:** لا

---

## 2026-07-04 — Functional Testing Batch 6.1 (authentication flow)

**نوع:** bug fix (functional testing)

**Backend — Auth / registration:**
- `register-business` يرفض أكواد التفعيل المنتهية عبر `expiresAt`.
- تأخير إنشاء مستخدم المتجر/المورد إلى ما بعد تحقق بيانات اسم النشاط/المنطقة/التصنيف؛ فشل validation لم يعد يترك حساباً يتيماً يمنع إعادة التسجيل بنفس الهاتف.

**Frontend (admin):**
- `ProtectedRoute` في لوحة الأدمن أصبح يتعامل مع `adminUser` تالف في `localStorage` بدون crash، ويمسح جلسة الأدمن المحلية قبل التوجيه إلى login.

**Refresh Token:** غير منفذ في المشروع — لا endpoint للاختبار.

**DB:** لا — استخدام الحقول الموجودة فقط.

**Breaking:** لا

---

## 2026-07-04 — Code Quality Batch 5.4 (imports + dependency cleanup)

**نوع:** fix (code quality)

**Frontend (admin/store):**
- إزالة dependency غير مستخدمة من admin: `react-qr-code` مع transitive packages الخاصة بها من `package-lock.json`.
- إزالة dependency غير مستخدمة من store-supplier: `framer-motion` مع `motion-dom` و`motion-utils` من `package-lock.json`.
- تنظيف import formatting في `PromoCodes.jsx`, `Chats.jsx`, و`WarehouseDetail.jsx`.

**Backend:** لا

**DB:** لا

**Breaking:** لا

---

## 2026-07-04 — Code Quality Batch 5.3 (naming consistency)

**نوع:** fix (code quality)

**Frontend (store):**
- توضيح أسماء محلية مختصرة في `WarehouseDetail.jsx`: `prods`/`offs`/`following` → أسماء صريحة للمنتجات، العروض، وحالة المتابعة.
- توضيح أسماء نشاطات Dashboard في `DashboardHome.jsx`: `acts`/`convs`/`st` → `recentActivities`/`conversations`/`statusMeta`.
- توحيد أسماء عناصر السلة وحالة الطلب في `Cart.jsx` و`Orders.jsx` بدل الاختصارات `ci` و`st`.

**Backend:** لا

**DB:** لا

**Breaking:** لا

---

## 2026-07-04 — Code Quality Batch 5.2 (console + debug cleanup)

**نوع:** fix (code quality)

**Frontend (customer/store/admin):**
- إزالة `console.error` من catch blocks في صفحات الدردشة، السلة، Dashboard، المستخدمين، الأكواد، سجلات الأمان، الفائزين، المستودع، تفاصيل المنتج، ولوحة الشرف.
- إزالة `console.log` debug مؤقت من `store-supplier-frontend/src/pages/ItemDetails.jsx`.
- إبقاء رسائل المستخدم، loading/fallback state، وerror handling كما هي بدون تغيير منطق.

**Backend:**
- لا تغيير — `logSanitize.util.js` بقي كما هو لأنه logger الإنتاج المنظّم.

**DB:** لا

**Breaking:** لا

---

## 2026-07-04 — Code Quality Batch 5.1 (dead code cleanup)

**نوع:** fix (code quality)

**Frontend (admin/store):**
- حذف `admin-panelFrontend/src/adminE.rotres.jsx` لأنه ملف Express backend قديم داخل frontend وغير مستورد.
- إزالة تعليق `eslint-disable no-unused-vars` غير لازم من `store-supplier-frontend/src/pages/Orders.jsx`؛ الدالة مستخدمة فعلياً.

**Backend:** لا

**DB:** لا

**Breaking:** لا

---

## 2026-07-04 — Security Batch 4.5 (logging + audit)

**نوع:** fix (security hardening)

**Backend — Production logging:**
- `logSanitize.util.js` — safe structured logger + sanitization للـ logs:
  - redaction لمفاتيح حساسة: password/token/authorization/cookie/secret/code/image/avatar/base64
  - تقصير strings الطويلة ومنع حفظ data URLs أو payloads كبيرة في logs
  - إخفاء identifiers في admin login failure / suspicious login logs
- `requestLog.middleware.js` — request logging آمن لمسارات `/api/*` بدون body أو headers حساسة:
  - method/path/status/duration/ip/userId/role
  - levels حسب status: info/warn/error

**Backend — Error / Security logging:**
- `server.js` — structured startup/error logs عبر `safeLog`
- أخطاء 500 لا تُرجع تفاصيل داخلية للعميل في production response path
- CORS rejections وطلبات body كبيرة تُسجّل كـ security audit events
- `rateLimit.middleware.js` — تسجيل security event مرة واحدة لكل window عند تجاوز rate limit
- إزالة logs التي كانت تطبع verification/reset codes أو SMS body في dev simulation

**Backend — Audit logging:**
- `audit.service.js` — sanitization قبل حفظ `ActivityLog` بما يشمل `metadata`, `oldValues`, `newValues`, `details`
- failures في كتابة audit/admin audit أصبحت تظهر كـ structured safe logs بدل silent catch
- إزالة raw `console.*` من controllers/services/monitors واستبدالها بـ safe structured logs

**DB:** لا — نفس collection الحالية `ActivityLog`

**Breaking:** لا — تغيّر شكل server logs فقط؛ responses للأخطاء الداخلية أصبحت أكثر تحفظاً

---

## 2026-07-04 — Security Batch 4.4 (file upload security)

**نوع:** fix (security hardening)

**Backend — Image / upload validation:**
- `imageProcess.util.js` — validation مركزي للصور قبل التخزين:
  - MIME allowlist: `image/jpeg`, `image/png`, `image/webp`
  - رفض SVG/GIF/أنواع غير الصور وdata URLs غير base64
  - مطابقة MIME المعلن مع محتوى الصورة عبر `sharp().metadata()`
  - حد حجم افتراضي 1.2MB + حد pixels لمنع decompression bombs
  - رفض روابط `http://` غير الآمنة
  - إعادة ترميز الصور المقبولة إلى WebP قبل التخزين لتطبيع المحتوى وإزالة payloads/metadata الخطرة

**Backend — Upload surfaces:**
- تطبيق validation/processing على: products، offers، stores logo/cover، bazaar images، chat images، user avatars، achievements، honor board، wheel prizes
- marketplace multi-image uploads تبقى max 3 صور + 800KB لكل صورة
- profile/admin image fields التي كانت length-check فقط أصبحت تمر عبر `imageProcess.util`

**Backend — Abuse protection:**
- `UPLOAD_RATE_LIMIT_MAX` اختياري؛ افتراضي 60 طلب/15 دقيقة على route groups التي تستقبل صوراً (`products/offers/stores/bazaar/chats/users/honor/admin achievements/wheel prizes`) للـ legacy و`/api/v1`

**Storage / filenames:** لا يوجد تخزين ملفات على filesystem ولا أسماء ملفات واردة من العميل؛ التخزين الحالي data URL داخل DB مع validation قبل الحفظ

**DB:** لا

**Breaking:** رفع SVG/GIF أو صور malformed أو روابط `http://` في حقول الصور يُرفض بـ 400

---

## 2026-07-04 — Security Batch 4.3 (HTTP + transport security)

**نوع:** fix (security hardening)

**Backend — Helmet / Security Headers:**
- إضافة `helmet` middleware
- تعطيل `X-Powered-By`
- تفعيل headers: frameguard deny، referrer-policy `no-referrer`، CORP cross-origin
- HSTS في production فقط لتجنب تأثير localhost/dev

**Backend — CORS:**
- `CORS_ORIGINS` allowlist يبقى المصدر الرسمي
- في production: عند غياب `CORS_ORIGINS` تُرفض طلبات المتصفح ذات `Origin` بدل فتح CORS للجميع
- في development فقط: السماح المفتوح يبقى للتشغيل المحلي
- تحديد methods/allowed headers/exposed rate-limit headers/maxAge

**Backend — Rate Limiting:**
- rate limit عام لكل `/api/*`
- rate limit أضيق لمسارات `/api/admin/*`
- إضافة headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`, و`Retry-After`

**Backend — Trusted Proxy:**
- دعم اختياري عبر `TRUST_PROXY` فقط عند الضبط، بدون تفعيل افتراضي

**DB:** لا

**Breaking:** لا في التطوير؛ في production يجب ضبط `CORS_ORIGINS` لواجهات الإنتاج

---

## 2026-07-04 — Security Batch 4.2 (API + input security)

**نوع:** fix (security hardening)

**Backend — Input validation / NoSQL injection:**
- `utils/inputSecurity.util.js` — helpers خفيفة بنفس نمط المشروع: ObjectId validation، string cleanup، numeric ranges، regex escaping، رفض مفاتيح Mongo operators (`$` / `.`)
- escaped regex search في: admin users، admin audit logs، product search، bazaar search، admin users advanced list
- validation للـ query params: audit filters/export، store browse/suggest، offer limits، users filters، bazaar filters

**Backend — Parameter validation:**
- ObjectId validation لمسارات حساسة/عامة في: stores، products، offers، bazaar listings، competitions، admin inline store/product/offer routes
- bulk delete ids في admin promo codes أصبحت array محدودة + ObjectId فقط

**Backend — Mass assignment protection:**
- استبدال raw `req.body` / spread payloads بـ allowlists في: admin category/draw/settings/code generation، promo code create، store/member prizes، product update/create، offer create/update/renew، bazaar create/update، wheel prizes/wins، cards/treasure boxes، competition admin create/update

**DB:** لا — validation فقط على طبقة API

**Breaking:** لا — الطلبات ذات الحقول غير الصالحة/غير المتوقعة أو ObjectId غير صالح ترجع 400 بدل 500/قبول صامت

---

## 2026-07-04 — Security Batch 4.1 (JWT + sessions + password policy + admin)

**نوع:** fix (security hardening)

**Backend — JWT verification:**
- `utils/jwtOptions.util.js` — HS256 فقط؛ `getJwtSecret()`؛ مدة admin 24h / باقي الأدوار 7d
- `auth.middleware.js` — تحقق `tv` (tokenVersion)؛ رفض JWT بدون `id`؛ HS256
- `optionalAuth.middleware.js` — الدور من DB لا من JWT؛ تحقق tokenVersion + حظر
- `admin.middleware.js` — USER_SENSITIVE_SELECT؛ حظر؛ tokenVersion؛ لا تسريب password hash
- `sensitiveAuth.middleware.js` / `maintenance.middleware.js` — HS256 على verify
- `server.js` — يتوقف إن غاب `JWT_SECRET`

**Backend — Session invalidation:**
- `User.tokenVersion` — يُرفع عند: تغيير/إعادة تعيين كلمة المرور، resetAdminPassword، حظر/تعليق (ban + update-manual)
- JWT يحمل `tv` — middleware يرفض عدم التطابق (`SESSION_INVALIDATED`)
- تغيير كلمة مرور admin → إبطال sensitive token أيضاً

**Backend — Password policy:**
- `register-business` — حد أدنى 6 أحرف (كان مفقوداً)
- `admin-sensitive.controller` — setup/change: 8 أحرف (كان 6)
- `seedAdmin` — يرفض `ADMIN_PASSWORD` أقل من 8

**Refresh Token:** غير مُنفَّذ في المشروع — لا تغيير.

**DB:** نعم — حقل `tokenVersion` على User (default 0؛ JWTs القديمة بدون `tv` تُعامل كـ 0)

**Breaking:** JWTs الصادرة قبل تغيير كلمة المرور/الحظر تُرفض بعد الرفع؛ admin JWT 24h بدل 7d

---

## 2026-07-04 — Performance Batch 3.3 (code split + debounce + compression + upload)

**نوع:** perf

**Backend:**
- `compression` middleware — gzip/deflate للاستجابات >1KB
- `express.json({ limit: '3mb' })` — حد صريح لحجم الرفع
- startup log للتحقق من compression + حد JSON
- `imageProcess.util` — تخطّي إعادة ضغط الصور <80KB؛ WebP `effort: 4` لتسريع المعالجة

**Frontend — Code splitting:**
- customer: lazy `CompetitionCard` (Home)، `HorizontalSwipe`/swiper (Explore, StoreQuickSearch)، صفحات التفاصيل (Store/Offer/Product/StoreQuickSearch)
- admin: dynamic `import('xlsx')` عند التصدير فقط (CodeGeneratorPage)

**Frontend — Debounce:**
- hook `useDebouncedValue` (customer + admin)
- Explore, StoreQuickSearch, Users — توحيد على الـ hook
- AdminChats, Stores, CodeGeneratorPage — debounce للفلترة المحلية

**Frontend — Upload:**
- `imageUpload.js` — تخطّي إعادة ضغط ملفات WebP <120KB (customer + store-supplier)

**DB:** لا

**Breaking:** لا

---

## 2026-07-04 — Performance Batch 3.2 (WebP + lazy load + network dedup)

**نوع:** perf

**Backend — Images:**
- `sharp` + `utils/imageProcess.util.js` — تحويل data URL إلى WebP عند الحفظ (نفس حقول API)
- thumbnails 320px لـ chat context `itemImage`؛ max 800px لرسائل الدردشة؛ 400px للشعار/avatar
- يُطبَّق على: product، offer، store logo/cover، bazaar images، chat، user avatar، competition images

**Frontend — Images (قبل الرفع):**
- `utils/imageUpload.js` — ضغط WebP في المتصفح (customer + store-supplier)
- `ImagePicker`, `Chats`, `UserCenter`, `Marketplace` — استخدام الضغط قبل الإرسال

**Frontend — Lazy loading:**
- `React.lazy` + `Suspense` للصفحات الكبيرة في customer / admin / store-supplier `App.jsx`
- `loading="lazy"` + `decoding="async"` على بطاقات القوائم (OfferCard, ProductCard, StoreCard, HonorBoard, CompetitionCard, Marketplace, ReferencedItemsBar)

**Frontend — Network:**
- store-supplier `useMaintenanceMode` → `usePlatformSettings` cache (إزالة fetch مكرر)
- `DashboardHome` — إزالة طلب `/orders/store` المكرر؛ unread عبر `/chats/unread-count` بدل جلب كل المحادثات

**DB:** لا

**Breaking:** لا — نفس حقول الصور ونفس شكل JSON

---

## 2026-07-04 — Performance Batch 3.1 (MongoDB + API lists + React Query)

**نوع:** perf

**Backend — MongoDB:**
- فهارس جديدة: `Order` (store/status/createdAt, customer/createdAt)، `Conversation` (participants/updatedAt)، `Message` (conversation/createdAt)، `User` (role/createdAt, followedStores)، `Competition`، `BazaarListing` (browse)، `Offer` (expiry monitor)
- `.select()` + `.lean()` على: orders lists، notifications، product search (limit 50)، offer monitor cron، competition lists، chat unread count، store customers

**Backend — API responses (قوائم):**
- `store.controller` — `getStoreById` offers/products: projection + strip base64؛ `getAllStores`: lean + strip logo
- `storeDiscovery.service` — strip base64 logo في browse/regions/suggest
- `chat.controller` — قائمة المحادثات: lean + strip itemImage/avatar/lastMessage image
- `bazaar.controller` — browse بدون `images[]` (hasImages فقط)
- `competition.controller` — lists: select + lean + strip base64 image/prizeImage

**Frontend (customer):**
- `useMaintenanceMode` — يقرأ من `usePlatformSettings` cache (إزالة fetch مكرر لـ `/settings/public`)
- `Chats.jsx` — قائمة المحادثات عبر `queryKeys.chats` (React Query)
- `OfferDetail.jsx` — حالة المفضّلة من `queryKeys.favorites` cache

**DB:** نعم — فهارس compound جديدة (يُنشئها Mongoose عند التشغيل)

**Breaking:** لا — نفس شكل JSON؛ base64 يُستبدل بـ `hasImage`/`hasLogo`/`hasImages` حيث كان يُزال سابقاً

---

## 2026-07-04 — Frontend stability: crashes + safe storage + unreadCount

**نوع:** bug fix (High — runtime crashes)

**Frontend (customer + store-supplier):**
- `utils/safeStorage.js` — `parseStoredJson` / `getStoredUser` مع try/catch
- `utils/unreadCount.js` — `getUnreadCountForUser` (Map أو object)
- `Orders.jsx` / `Cart.jsx` — `(items || []).map` + arrays آمنة في cache updates
- `Chats.jsx`, `Chat.jsx`, `DashboardHome.jsx` — unreadCount آمن
- `UserCenter.jsx` — إصلاح `setDevCode` crash؛ defaults للـ progress/stats/legal/modals
- `ProtectedRoute`, `auth.js`, `DashboardLayout` — parse آمن

**ما أُصلح:**
- `.map()` on undefined في Orders/Cart
- `JSON.parse(localStorage)` يرمي عند بيانات تالفة
- unreadCount من Mongoose Map لا يُقرأ كـ object
- UserCenter modals crash عند state ناقص

**Breaking:** لا

---

## 2026-07-04 — Data integrity: renewOffer + redeem transactions + order confirm

**نوع:** bug fix (Critical — financial data integrity)

**Backend:**
- `controllers/offer.controller.js` — `renewOffer`: تحديث `expiresAt` مع `autoDeleteAt` عند التجديد بالأيام؛ التحقق من التاريخ
- `utils/atomicRedeem.util.js` — دعم `session` + `rollbackPromoClaim` / `rollbackAdminCodeClaim`
- `controllers/promo-code.controller.js` — استرداد promo/admin/registration داخل MongoDB transaction؛ rollback عند الفشل بدون transactions
- `services/order.service.js` — خصم الكروت + منح النقاط **قبل** تأكيد الطلب؛ rollback عند فشل التحديث؛ إشعار بعد النجاح فقط

**ما أُصلح:**
- عروض مجدّدة لا تُعطّل فوراً بسبب `expiresAt` قديم
- كود مست consumed بدون نقاط (أو العكس)
- طلب `confirmed` بدون نقاط/كروت فعلية

**Breaking:** لا

---

## 2026-07-04 — Business logic: stock + BOGO pricing + offer image

**نوع:** bug fix (High — pricing / inventory)

**Backend:**
- `services/pricing.service.js` — `computeOfferLineTotal` لـ BOGO (ادفع `ceil(qty/2)` × السعر الأصلي)؛ `finalPrice` للعرض 1+1 = نصف السعر للعرض
- `services/cart.service.js` — تحقق مخزون عند الإضافة/التحديث/checkout؛ خصم atomic `$inc`؛ استرجاع عند إلغاء الطلب؛ إجمالي السطر من `lineTotal`
- `controllers/offer.controller.js` — تحديث العرض بدون `image` لا يمسح الصورة المحفوظة
- `services/order.service.js` — استرجاع مخزون المنتجات عند إرجاع عناصر الطلب للسلة

**ما أُصلح:**
- طلب بكمية أكبر من المتوفر
- مخزون سالب (atomic deduct)
- BOGO يُحسب كـ unitPrice × qty بدل 1+1
- مسح صورة العرض عند PATCH بدون صورة

**Breaking:** لا — `stock === 0` = بدون حد (منتجات قديمة)؛ `stock > 0` = مخزون مُدار

---

## 2026-07-04 — Authorization patches: role assignment + sensitive token + supplier routes

**نوع:** bug fix (Critical — privilege escalation / auth)

**Backend:**
- `utils/registrationRole.util.js` — دور التسجيل من `registrationRole` أو بادئة صريحة (`STORE-` / `SUPPLIER-`)؛ رفض الكود غير المحدد
- `models/promoCode.js` — حقل `registrationRole`
- `controllers/promo-code.controller.js` — إزالة `includes("STORE")`؛ rollback عند فشل تحديد الدور
- `controllers/admin-sensitive.controller.js` — `sv` في JWT + `revokeSensitiveSession` + bump عند setup/change/logout
- `middleware/sensitiveAuth.middleware.js` — التحقق من `sv` لمنع إعادة استخدام التوكن المُبطَل
- `routes/wheel-admin.routes.js` — `POST /admin/sensitive/revoke`

**Frontend:**
- `admin-panelFrontend` — `adminLogout.js` يمسح التوكن الحساس + يستدعي revoke؛ Sidebar/AdminHeader/axios
- `store-supplier-frontend` — `StoreOnlyRoute`؛ `ProtectedRoute` يوجّه للوحة الصحيحة؛ مسارات store-only محظورة على `/supplier/*`

**ما أُصلح:**
- privilege escalation عبر substring "STORE" في أي كود
- sensitive token يبقى صالحاً بعد logout
- صفحات store-only مفتوحة للتاجر عبر URL مع 403

**Breaking:** أكواد تسجيل بدون `registrationRole` أو بادئة صريحة تُرفض؛ التوكنات الحساسة القديمة (بدون `sv`) تحتاج إعادة verify

---

## 2026-07-04 — إزالة hardcoded localhost URLs

**نوع:** fix (production readiness)

**Frontend:**
- `lib/apiUrl.js` في admin / store-supplier / customer
- axios configs: `baseURL: VITE_API_URL` فقط (بدون localhost fallback)
- `Login.jsx`, `PromoCodes.jsx`, `BuyCodes.jsx`, `Chats.jsx`, `CodeStats.jsx`, `MemberPrizes.jsx`, `useMaintenanceMode`
- `.env.example` لـ admin-panel + store-supplier

**Breaking:** يتطلب `VITE_API_URL` في `.env` عند build/run (انظر `.env.example`)

---

## 2026-07-04 — Auth security hardening

**نوع:** bug fix (Critical — auth bypass / password leak)

**Backend:**
- `utils/userSanitize.util.js` — `sanitizeUser`, `assertUserNotBlocked`, `USER_SENSITIVE_SELECT`
- `auth.controller.js` — Google: email/sub مطلوب؛ TikTok: openId من API فقط؛ banned/suspended blocked على login/OAuth
- `auth.middleware.js` — منع banned/suspended من المسارات المحمية
- `user.controller.js` — `getMe` بدون حقول حساسة
- `admin.controller.js` — `searchUsers` / `updateUserManually` / `getAllUsers` بدون password hash

**Breaking:** TikTok login بدون `accessToken`/`code` لم يعد مقبولاً

---

## 2026-07-04 — Atomic cart checkout + order status guards

**نوع:** bug fix (Critical — duplicate orders / invalid status transitions)

**Backend:**
- `services/cart.service.js` — atomic `findOneAndUpdate` يفرّغ السلة مرة واحدة قبل إنشاء الطلبات؛ transaction + restore cart عند الفشل
- `services/order.service.js` — جدول انتقالات مسموحة؛ `findOneAndUpdate` بشرط `status` الحالي؛ منع pending→delivered و confirmed→pending؛ atomic card/points

**ما أُصلح:**
- منع duplicate checkout (concurrent requests)
- منع double confirm / double status update (409)
- منع تغييرات حالة غير منطقية

**Breaking:** لا — pending→delivered لم يعد مسموحاً (كان bypass)

---

## 2026-07-04 — Atomic wheel spin + competition join

**نوع:** bug fix (Critical — double deduct / double join)

**Backend:**
- `services/wheel.service.js` — MongoDB transaction + atomic `$inc` points؛ DB rate limit عبر WheelSpin؛ idempotency E11000 replay
- `controllers/competition.controller.js` — atomic join: `$push` مشارك جديد أو `$inc` entries؛ cooldown 2s لمنع double-click؛ transaction + refund fallback

**ما أُصلح:**
- Wheel: منع خصم نقاط مرتين (concurrent / double click)
- Competitions: منع duplicate participant + double join سريع
- نقاط تُخصم مرة واحدة لكل join ناجح

**Breaking:** لا — مشاركات إضافية بعد 2s ما زالت مسموحة

---

## 2026-07-04 — Atomic code redemption (Promo / Admin / Activation)

**نوع:** bug fix (Critical — double redeem / race conditions)

**Backend:**
- `utils/atomicRedeem.util.js` — `findOneAndUpdate` + pipeline: claim كود مرة واحدة atomically
- `promo-code.controller.js` — redeem promo/admin/registration: claim قبل منح النقاط
- `activation.controller.js` — `activateStore`: claim كود قبل تفعيل المتجر

**ما أُصلح:**
- منع double redeem مع concurrent requests
- منع `user.save()` قبل تحديث حالة الكود
- استبعاد registration codes من `/redeem` العادي
- فحص `maxUses` ضمن شرط atomic update

**Breaking:** لا

---


**نوع:** completion (feature موجود ضمن Phase 1 scope — أكواد)

**Backend:**
- `models/AdminCode.js` — `code`, `rewardPoints`, `isActive`, `usedBy`, `maxUses`, `currentUses` — **بدون storeId**
- `controllers/admin/adminCode.controller.js`
- Routes: `POST/GET/DELETE /api/admin/admin-codes/*`
- `promo-code.controller.js` — redeem: PromoCode (merchant) ثم AdminCode

**Frontend (admin):**
- `CodeGeneratorPage.jsx` — تبويب Merchant | Admin + bulk + Excel (`xlsx`)

**DB:** نموذج جديد `AdminCode` — لا migration لبيانات قديمة

**Breaking:** لا — merchant ActivationCode/PromoCode كما هي

---

## 2026-07-04 — React Query + تحميل خفيف (3 frontends)

**نوع:** perf + UX

**Frontend (customer):**
- `QueryClientProvider`, `LightLoadingHint`, `lib/queryClient.js`
- صفحات: Home, Explore, UserCenter, Favorites, Notifications, Draws, HonorBoard, TreasureChests, Inventory

**Frontend (store-supplier):**
- `@tanstack/react-query` — MyStore, OffersManager, Warehouses, Notifications, Orders
- hooks: `useCategoryTree`, `useRegionTree`

**Frontend (admin):**
- Dashboard, Stores, Users, Competitions, Categories, Activity

**نمط:** `isLoading && !data` → hint خفيف أول مرة؛ cache عند العودة

**Breaking:** لا

---

## 2026-07-04 — أداء: بطء تحميل ~30s

**نوع:** perf

**Backend:**
- `config/db.js` — `serverSelectionTimeoutMS` / `connectTimeoutMS` ~8s
- `middleware/maintenance.middleware.js` — cache 10s
- `services/platformSettings.service.js` — cache 30s
- `services/offer.service.js` — إزالة base64 من lists + `.lean()` + `.select()`

**Frontend (الثلاث):**
- axios `timeout: 15_000`

**Breaking:** لا

---

## 2026-07-04 — UX: دردشة التاجر + صورة إلزامية

**نوع:** bug + UX

**Frontend (store):**
- `styles/Chats.css` — `.msg.sent` → `#111827` (كانت زرقاء على خلفية زرقاء)
- `AddProductsOffers.jsx` — submit معطّل بدون صورة

**Backend:** validation صورة موجودة مسبقاً في product/offer controllers

**Breaking:** لا

---

## 2026-07-04 — إعادة تنظيم التوثيق

**نوع:** docs

- `16_LAUNCH_MEMORY.md` — حالة + Phase 1 + checklist فقط
- `CHANGE_LOG.md` — هذا الملف (تنفيذي)
- `TODO.md` — مستقبلي / مؤجّل

**Breaking:** لا
