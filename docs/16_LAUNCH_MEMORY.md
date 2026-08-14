# 16 — ذاكرة الإطلاق (Launch Memory) ⭐ اقرأ هذا أولاً

> **مرجع رسمي:** خارطة الطريق، قواعد التجميد، Ground Truth، checklist الإطلاق.
> **لا bugs ولا TODO هنا** — راجع `CHANGE_LOG.md` و `TODO.md`.
> آخر تحديث: **2026-07-04**

---

## 🧭 خارطة الطريق (Project Roadmap)

### المرحلة 1 — إنهاء التطوير (Development Freeze) ← **الحالية**

**الهدف:** عدم إضافة أي Features جديدة بعد هذه المرحلة.

**النطاق:**
- إنهاء جميع صفحات الزبون / التاجر / الأدمن
- إنهاء جميع APIs + قاعدة البيانات
- إنهاء: الإشعارات، المسابقات، العجلة، النقاط، الدردشة، الأكواد، الإحصائيات
- إنهاء التوثيق

**⚠️ بعد المرحلة 1:** ممنوع إضافة Features جديدة — Bug Fix فقط.

---

### المرحلة 2 — تثبيت المعمارية (Foundation Lock)

**الهدف:** تثبيت البنية الحالية ومنع أي إعادة هيكلة لاحقة.

**تشمل:**
- Service Layer
- SSOT (Single Source of Truth)
- API Structure (`/api/v1`)
- تنظيم Backend
- منع أي Business Logic في Frontend

**⚠️ بعد المرحلة 2:** ممنوع أي Architecture Changes.

---

### المرحلة 3 — تحسين الأداء (Performance Optimization)

**الهدف:** رفع سرعة واستقرار النظام بدون تغيير المنطق.

| المجال | التحسينات |
|--------|-----------|
| **DB** | Indexes، Pagination، Projection، Aggregation، إزالة queries البطيئة |
| **صور** | WebP، ضغط، Thumbnails، Lazy Loading |
| **Frontend** | React Query Cache، تقليل API Requests، Debounce، Code Splitting |
| **Backend** | ضغط Responses، Cache، تحسين Upload |
| **Network** | تقليل حجم JSON، إزالة البيانات غير المستخدمة |

---

### المرحلة 4 — Security Hardening 🔐

**الهدف:** تقوية أمان النظام بدون تغيير المعمارية أو إضافة Features.

**تشمل:**
- JWT + Refresh Token
- Helmet + CORS مضبوط للإنتاج
- Rate Limiting + CSRF (عند الحاجة)
- حماية XSS + NoSQL Injection
- تأمين File Upload
- Validation صارم للمدخلات
- Password Policies + Session Security
- حماية Admin Routes + Audit Logs

---

### المرحلة 5 — Code Quality Review 🧹

**الهدف:** تحسين جودة الكود بدون أي تغيير وظيفي أو معماري.

**تشمل:**
- حذف Dead Code + ملفات غير مستخدمة
- إزالة `console.log`
- تنظيف TODOs غير الضرورية
- توحيد naming conventions
- تنظيف imports وتنظيم الملفات

---

### المرحلة 6 — الفحص الوظيفي 🧪 (Functional Testing)

**الهدف:** اختبار شامل لكل الوظائف.

**تشمل:** التسجيل، تسجيل الدخول، المنتجات، العروض، السلة، الطلبات، المسابقات، العجلة، النقاط، الدردشة، الأكواد، الإشعارات، الأدمن، التاجر — كل زر، كل صفحة، كل API.

---

### المرحلة 7 — اختبار الصلاحيات 🔐 (Authorization Testing)

**التأكد من:**
- الزبون لا يمكنه دخول لوحة الأدمن
- التاجر لا يرى بيانات متجر غيره
- منع تعديل الطلبات/النقاط/الأسعار بدون صلاحية

---

### المرحلة 8 — اختبار الضغط ⚡ (Load Testing)

**اختبار:** 100 → 500 → 1000 مستخدم
**مراقبة:** CPU، RAM، MongoDB، سرعة API

---

### المرحلة 9 — اختبار الاستقرار 🧠 (Stability Testing)

**تشغيل:** 24h → 48h → عدة أيام
**مراقبة:** Memory Leaks، Crashes، Slow Queries، Logs

---

### المرحلة 10 — مراقبة الأخطاء 📊 (Monitoring)

**إضافة:** Error/Request/Security/Audit Logging
**مراقبة:** استهلاك السيرفر، أداء قاعدة البيانات

---

### المرحلة 11 — النسخ الاحتياطي 💾 (Backup)

**التأكد من:** Backup تلقائي، Restore، Database Dump، Media Backup

---

### المرحلة 12 — الإطلاق التجريبي 🧪 (Beta)

**إطلاق محدود:** ~20 مستخدم
**مراقبة:** الأخطاء، الأداء، الملاحظات

---

### المرحلة 13 — إصلاح الأخطاء النهائية 🛠

Bug fixes فقط — ❌ بدون Features

---

### المرحلة 14 — تجهيز الإنتاج 🚀 (Production Setup)

**تشمل:** Domain، HTTPS، SMTP، SMS، Google OAuth، Environment Variables، Privacy Policy، Terms، Robots.txt، Sitemap، CDN (إن لزم)

---

### المرحلة 15 — الإطلاق الرسمي 🌍 (Launch)

فتح النظام لجميع المستخدمين

---

### المرحلة 16 — المراقبة بعد الإطلاق 📡 (Post-Launch Monitoring)

**أول أسبوعين:** Errors، CPU، RAM، MongoDB، API Response Time، Crash Reports

---

### المرحلة 17 — تطوير Flutter 📱

- يبدأ فقط بعد استقرار Backend
- يستخدم نفس APIs الحالية
- لا إعادة كتابة منطق

---

### المرحلة 18 — تحديثات مستقبلية 🔄

كل تحديث: Feature → Test → Deploy
بدون إعادة هيكلة للنظام

---

### 🧠 المبدأ الأساسي

```
Phase 1 Freeze → Testing → Stability → Production → Launch → Monitoring
No new architecture or feature expansion during this cycle
```

**الهدف النهائي:** نظام مستقر، سريع، آمن، Production Ready، قابل للتوسع (Flutter + scale).

---

## 1. حالة المشروع الآن

| البند | الوضع |
|--------|--------|
| المرحلة | **Phase 1 — Development Freeze** |
| الهدف | إكمال الموجود، bugs، أداء، **تحضير للرفع** |
| Features جديدة | ❌ ممنوعة |
| Architecture changes | ❌ ممنوعة |
| Schema DB | ❌ لا تغيير إلا Bug |

---

## 2. قواعد القرار (Phase 1)

```
إذا لم تكن Bug أو تحسين أداء أو إكمال شيء موجود → رُفض تلقائياً.
لا Architecture جديدة. لا أنظمة جديدة. أي فكرة جديدة → TODO.md (بعد Launch).
```

**مسموح فقط:**
- Bug fixing
- Performance improvements
- Security hardening
- إكمال صفحات/APIs موجودة

---

## 3. Ground Truth (يصحّح docs القديمة)

| موضوع | الحقيقة الآن | docs قديمة تقول |
|--------|----------------|-------------------|
| API URL | `VITE_API_URL` + fallback localhost | "مكتوب يدوياً فقط" |
| `/api/v1` | ✅ موجود (`health`, `meta`, `pricing/offer-preview`) | "لا versioning" |
| أمان admin | `roleMiddleware(["admin"])` على `/api/admin/*` | ثغرة حرجة مفتوحة |
| Admin Codes | Model + API منفصل (`AdminCode`) | غير موثّق |
| Offer feed | بدون base64 في القوائم | غير موثّق |
| React Query | الواجهات الأربع (جزئي–كامل) | customer فقط |
| Merchant codes | ActivationCode + PromoCode — **لم يُكسر** | — |

**لا تعتمد على:** `00` §6 مخاطر، `04` "لا v1"، `10` §3 API يدوي، `14_TODO` unchecked لبنود أُنجزت.

---

## 4. تشغيل محلي (مرجع سريع)

```bash
cd backend && npm run dev                    # :5000
cd customer && npm run dev                   # :5173
cd adminstore && npm run dev                 # :5175 (conflicts with delivery — run one at a time)
cd admin && npm run dev
cd delivery && npm run dev
```

**Backend `.env` (حد أدنى):** `MONGO_URI`, `JWT_SECRET`, `PORT=5000`, `CORS_ORIGINS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

**Smoke:** `GET /api/v1/health` → 200 | login × 3 أدوار | `/offers/feed?limit=12` حجم معقول

---

## 5. Checklist الإطلاق

### أمان وبيئة
- [ ] `.env` production — لا secrets في Git
- [ ] `CORS_ORIGINS` = نطاقات الإنتاج (customer, adminstore, admin, delivery)
- [ ] `JWT_SECRET` قوي؛ تغيير كلمة الأدmin الافتراضية
- [ ] Mongo Atlas: IP allowlist + backup
- [ ] HTTPS على Backend + Frontends

### Build
- [ ] `npm run build` ناجح: customer + adminstore + admin + delivery
- [ ] Backend يقلع في production
- [ ] `VITE_API_URL` = API الإنتاج عند build

### وظائف (smoke)
- [ ] تسجيل / login × 3 أدوار
- [ ] feed عروض + سلة + checkout
- [ ] promo redeem + admin code redeem
- [ ] CodeGenerator: merchant + admin bulk + Excel
- [ ] دردشة: إرسال/استقبال
- [ ] Admin dashboard بدون انتظار ~30s

### DevOps (اختياري — إن لم يكن blocker)
- [ ] PM2 أو Docker للـ backend
- [ ] استضافة static للـ 3 frontends

---

## 6. خريطة التوثيق

| الملف | الغرض |
|--------|--------|
| **`16_LAUNCH_MEMORY.md`** | حالة + Phase 1 + Ground Truth + checklist |
| **`CHANGE_LOG.md`** | كل تعديل فعلي على الكود / bug fix |
| **`TODO.md`** | أفكار مؤجلة + تحسينات خارج Phase 1 |
| `12_AI_MEMORY.md` | فلسفة + invariants طويلة المدى |
| `07_Business_Logic.md` | نقاط، سلة، أكواد، مسابقات |
| `06_APIs.md` | مرجع مسارات (قد يفتقد admin-codes) |
| `13_CHANGE_LOG.md` | أرشيف v0.1–0.16 (تاريخي) |

---

## 7. أول رسالة لحساب Cursor جديد

```
اقرأ docs/16_LAUNCH_MEMORY.md ثم CHANGE_LOG.md و TODO.md.
Phase 1 Freeze — لا features جديدة.
المطلوب: [مهمتك].
Backend :5000 — ثلاث frontends.
```

---

## 8. قواعد تحديث التوثيق

| ماذا حدّث | أين |
|-----------|-----|
| حالة / freeze / ground truth / checklist | `16_LAUNCH_MEMORY.md` |
| أي bug fix أو تغيير كود | `CHANGE_LOG.md` |
| فكرة مستقبلية أو مؤجلة | `TODO.md` |
| درس معماري طويل | `12_AI_MEMORY.md` (Learning Log) |

**لا تخلط:** bugs وTODO وتاريخ التنفيذ **لا تدخل** LAUNCH_MEMORY.
