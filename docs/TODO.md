# TODO — تحسينات مستقبلية (خارج Phase 1 الحالي)

> **Phase 1 Freeze:** ❌ لا تنفّذ ما هنا إلا بعد Launch أو بموافقة صريحة.
> **bugs / fixes فعلية** → `CHANGE_LOG.md` وليس هنا.
> **حالة المشروع** → `16_LAUNCH_MEMORY.md`

---

## 🔴 قبل Launch — إكمال / فحص (Phase 1 مسموح)

- [ ] **فحص pre-launch:** smoke test كامل من checklist في `16_LAUNCH_MEMORY.md`
- [ ] **React Query:** صفحات ما زالت `fetch` يدوي — store: `Cart.jsx`, `Chats.jsx` | admin: Analytics, Settings, PromoCodes…
- [x] **`PromoCodes.jsx` (admin):** توحيد مع `VITE_API_URL` — 2026-07-04
- [ ] **`MyStore.jsx`:** مراجعة مسارات/imports vs هيكل store-supplier الأحدث
- [ ] **Envelope API:** `/api/v1` موجود جزئياً — لم يُفرض على كل المسارات

---

## 🟡 أمان — مؤجّل (بعد Launch مفضّل)

- [ ] Validation موحّدة (Joi/Zod) لكل المسارات + منع mass-assignment
- [ ] `helmet` + رؤوس أمان
- [ ] JWT: `localStorage` → httpOnly cookies (يمسّ المواقع الثلاث)
- [ ] مراجعة rate limiting على مسارات حساسة إضافية

---

## 🟡 أداء / بنية — مؤجّل

- [ ] فهارس DB: `Store.owner`, `Product.store`, `Offer.store`, `Order.store`, `Order.customer`
- [ ] pagination للقوائم الكبيرة
- [ ] Service Layer كامل — نقل باقي المنطق من routes/controllers
- [ ] envelope موحّد لكل `/api/*`
- [ ] دمج `cardType.controller` و `box-admin.controller`

---

## 🟢 تحسينات — بعد Launch

- [ ] code-splitting (`React.lazy`) + lazy-load `xlsx` في admin
- [ ] توحيد إصدارات React/Vite/Router بين الواجهات
- [ ] Dockerfile + CI/CD + PM2
- [ ] تفعيل إشعارات `monitorOffers` (حالياً console)
- [ ] تحديث أرشيف `00`–`15` ليطابق Ground Truth (عند طلب صريح فقط)

---

## ✅ أُنجز — لا تعيد (مرجع سريع)

> التفاصيل في `CHANGE_LOG.md` و `13_CHANGE_LOG.md`

- VITE_API_URL في الواجهات الثلاث (v0.4.0)
- roleMiddleware admin (v0.2.0)
- حذف `Dashboardstorer.routes.js` (v0.4.0)
- React Query customer + store + admin (2026-07-04)
- Admin Codes منفصل (2026-07-04)
- Offer feed perf + Mongo timeout (2026-07-04)
