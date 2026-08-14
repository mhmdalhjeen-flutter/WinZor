# 09 — الأداء (Performance)

> ملاحظات أداء مسجّلة للتطوير التدريجي. لا تنفيذ قبل الموافقة.

---

## 1. قاعدة البيانات

### 1.1 نقص الفهارس (Indexes)
استعلامات متكررة على حقول غير مفهرسة:
- `Store.findOne({ owner })` — في كل عملية متجر تقريباً.
- `Product.find({ store })`, `Offer.find({ store })`.
- `Order.find({ store })`, `Order.find({ customer })`.
- `PromoCode.findOne({ code })` (مفهرس unique ✅) لكن `find({ store })` غير مفهرس.

**مقترح:** إضافة فهارس على `owner`, `store`, `customer` لتسريع الاستعلامات عند نمو البيانات.

### 1.2 استعلامات متسلسلة بدل متوازية
بعض الدوال تنفّذ استعلامات بالتتابع يمكن توازيها بـ `Promise.all` (مثل `dashboard.controller`, `store.getStoreById`). جزء من admin يستخدم `Promise.all` ✅.

### 1.3 populate يدوي للسلة
`cart.routes` يجلب كل عنصر باستعلام منفصل داخل `Promise.all` (N+1). مقبول لسلال صغيرة، لكن يُحسَّن بـ `$in` لاحقاً.

### 1.4 تحديثات متكررة عند كل زيارة
`getStoreById` يكتب `totalVisits`/`todayVisits` (write على كل عرض صفحة) → ضغط كتابة. يمكن تجميعها (batch) أو فصلها في عداد منفصل.

---

## 2. الخادم

### 2.1 المهام الدورية داخل العملية
`monitorOffers` عبر `setInterval` داخل عملية الخادم:
- لا تصلح عند تشغيل عدة نسخ (ستعمل مكرّرة).
- تتوقف إن أُعيد تشغيل العملية في توقيت غير مناسب.
**مقترح:** نقلها إلى cron خارجي أو طابور مهام (BullMQ) عند التوسّع.

### 2.2 Response caching (Batch 9 ✅)
In-memory per-user TTL cache + request deduplication on polling endpoints (`/users/me`, `/notifications*`, `/chats/unread-count`, `/cart`). See `docs/batch-9-performance-report.md`. Redis recommended when scaling to multiple server instances.

### 2.3 لا pagination في معظم القوائم
`getAllStores`, `getOffers`, `getAllCodes`... تُرجع كل النتائج. عند النمو يجب إضافة pagination (الموجود حالياً فقط في رسائل المحادثة).
- ✅ (v0.9.0) أُضيف **Cursor-Based Pagination** لخلاصة عروض الزبون عبر `GET /api/offers/feed` (`limit`+`cursor` بالـ `_id`) مع Infinite Scroll في الواجهة (AD-006). يبقى توسيعها لبقية القوائم (متاجر/أكواد) مهمة لاحقة.

---

## 3. الواجهات (Frontend)

### 3.1 أحجام الحزم (Bundles)
- `admin/` يستورد `xlsx` (ثقيل) — يُفضّل lazy-load عند الحاجة فقط.
- `customer/` يستخدم `swiper` + `framer-motion` — مقبول، لكن راقب الحجم.

### 3.2 node_modules داخل src (admin)
يبطّئ أدوات الفهرسة/الـ HMR وقد يربك Vite. (انظر `15_BUGS.md`.)

### 3.3 لا code-splitting واضح
المسارات تُحمَّل دفعة واحدة (لا `React.lazy`). فرصة لتقسيم الكود حسب المسار.

---

## 4. ملخص الأولويات (مقترح)

| # | البند | الأثر |
|---|------|-------|
| 1 | فهارس على owner/store/customer | عالٍ عند النمو |
| 2 | pagination للقوائم الكبيرة | عالٍ |
| 3 | إصلاح node_modules في admin/src | متوسط |
| 4 | lazy-load لـ xlsx | متوسط |
| 5 | نقل المهام الدورية خارج العملية | عند التوسّع |
| 6 | caching للبيانات شبه الثابتة | عند النمو |

> لا توجد قياسات أداء فعلية بعد (لا profiling). يُنصح بقياس قبل التحسين (measure first).
