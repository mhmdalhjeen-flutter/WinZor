# 15 — الأخطاء المعروفة (Known Bugs)

> أخطاء/تضاربات مرصودة أثناء قراءة الكود (لم تُختبَر تشغيلياً إلا حيث يُذكر). **مسجّلة فقط، لم تُصلَح.**
> الحالة: 🔴 مؤكّد بالقراءة بقوة | 🟠 محتمل (يحتاج تأكيد بالتشغيل).

---

## BUG-011 ✅ Fixed (v0.5.0 - 2026-06-30) — فشل إنشاء الحساب من Customer Frontend (مسار خاطئ)
- **الملف:** `customerFrontend/src/pages/Register.jsx`
- **الوصف:** كانت الواجهة ترسل `POST /auth/register` (غير معرّف) بينما الـ Backend يعرّف `/auth/register-customer` فقط ⇒ 404 "المسار غير موجود". (Postman ينجح لأنه يستدعي المسار الصحيح.) **السبب الجذري = Path Mismatch**، وليس Axios/Proxy/CORS/عنوان API.
- **الإصلاح:** تغيير الاستدعاء إلى `/auth/register-customer`. اختُبر حياً (PASS): حساب أُنشئ → توكن → إعادة التوجيه للصفحة الرئيسية.

## BUG-012 🟠 خارج النطاق (مُسجَّل — لم يُصلَح) — اعتماد `qrcode` محتمل النقص في الـ Backend
- **الوصف:** ظهر في سجل الـ Backend سطر `Error: Cannot find module 'qrcode'` (من تشغيل سابق). الخادم يعمل حالياً على :5000، لكن قد يوجد `require('qrcode')` في مسار يُستدعى عند الطلب (مثلاً توليد QR لكود/طلب) سيفشل عند تنفيذه.
- **الأثر المحتمل:** فشل المسار الذي يستخدم qrcode وقت الاستدعاء (500). يحتاج تأكيد.
- **التوصية:** تحديد موضع `require('qrcode')` و`npm install qrcode` إن لزم — **بانتظار موافقة** (خارج نطاق المرحلة 0).

## BUG-001 ✅ Fixed (v0.2.0 - 2026-06-30) — ثغرة صلاحيات في مسارات الأدمن
- **الملف:** `backend/src/routes/admin/admin.routes.js`
- **الوصف:** `router.use(adminMiddleware)` عند السطر ~69؛ المسارات قبله محمية بـ `authMiddleware` فقط. مسارات مثل `users/update-manual`, `generate-bulk-codes`, `settings`, `users` متاحة لأي مستخدم مسجّل.
- **الأثر:** تصعيد امتياز + احتيال نقاط/أكواد. حرج.
- **الإصلاح:** أُضيف `router.use(roleMiddleware(["admin"]))` مباشرة بعد `authMiddleware` → كل مسارات الراوتر تتطلب دور admin.

## BUG-002 ✅ Fixed (v0.2.0 - 2026-06-30) — عدم تطابق نموذج DrawBatch مع draw.controller
- **الملفات:** `backend/src/models/drawBatch.js` ↔ `backend/src/controllers/draw.controller.js`
- **الوصف:** الـ controller كان يستخدم `status:"voting"`, `locationOptions`, `totalEntries`, `totalVoters`, `participants[].entriesCount`, `participants[].votedLocation`, `finalLocation` — وكلها غير موجودة في النموذج.
- **الأثر:** `join`/`vote` تفشل. ميزة السحب غير موثوقة.
- **الإصلاح:** بقرار صاحب المشروع (الأدمن متحكم، **لا تصويت**): أُعيدت كتابة `draw.controller` ليطابق النموذج، وأُزيل `voteLocation` ومسار `/vote`. المشاركة الآن: تحقق رتبة + منع تكرار + تكلفة فرصة واحدة. (قرار التكلفة قابل للمراجعة — انظر CHANGE_LOG.)

## BUG-003 ✅ Fixed (v0.2.0 - 2026-06-30) — حساسية حالة الأحرف في مسارات require (تكسر على Linux)
- **الإصلاح:** صُحِّحت الحالة في 7 مسارات (`ActivityLog`, `Cart` ×3, `product.controller`, `promo-code.controller`) لتطابق أسماء الملفات الفعلية.
- **أمثلة (قبل الإصلاح):**
  - `utils/logger.js` و`controllers/admin/admin.controller.js` → `require("../models/activityLog")` بينما الملف `ActivityLog.js`.
  - `routes/admin/admin.routes.js`, `routes/cart.routes.js`, `routes/order.routes.js` → `require("../models/cart")` بينما الملف `Cart.js`.
  - `routes/product.routes.js` → `require("../controllers/product.Controller")` بينما الملف `product.controller.js`.
  - `routes/promo.routes.js` → `require("../controllers/promo-code.Controller")`.
- **الأثر:** يعمل على Windows/macOS (case-insensitive)، يفشل عند النشر على Linux. حرج للإنتاج.

## BUG-004 ✅ Fixed (v0.2.0 - 2026-06-30) — حقل storesEnergyClaimed غير موجود في نموذج User
- **الملف:** `controllers/promo-code.controller.js` (`redeemCode`) + `models/user.js`
- **الوصف:** يقرأ/يكتب `user.storesEnergyClaimed` غير المعرّف في `user.js`.
- **الإصلاح:** أُضيف `storesEnergyClaimed: [ObjectId ref Store]` إلى نموذج User (إضافة متوافقة خلفياً).

## BUG-005 ✅ Fixed (v0.3.0 - 2026-06-30) — تعارض حقول CardType (pointsValue مقابل price/points)
- **الوصف:** الفرونت الحيّ (`PromoCodes.jsx`) يرسل/يعرض `price`/`points`، بينما النموذج ومنطق الزبون (redeem/treasure) يستخدمان `pointsValue` → `cardType.controller.createCardType` كان يفشل (pointsValue المطلوب غير مُرسَل).
- **الإصلاح:** أُضيف حقل `price` للنموذج + خاصية افتراضية `points` (get/set ⇆ `pointsValue`) مع تفعيل virtuals في JSON. الآن يعمل الفرونت الحيّ ومنطق الزبون معاً دون كسر.
- (ملاحظة: نسخة `~~🔴~~` السابقة كانت تصنيفاً خاطئاً؛ المشكلة فعلياً Medium.)
- **الملفات:** `models/cardType.js` (يعرّف `pointsValue`) ↔ `controllers/cardType.controller.js`, `box-admin.controller.js`, `codeOrder.controller.js` (تستخدم `price`/`points`).
- **الأثر:** قيم غير معرّفة (`undefined`) في النقاط/الأسعار؛ أكواد بنقاط = undefined.

## BUG-006 ✅ Fixed (v0.3.0 - 2026-06-30) — خطأ في activation.controller و store.controller.activateStore
- **الوصف:** `createStoreActivationCode` كان يكتب `type` بدل الحقل الصحيح `role` (المطلوب) → فشل إنشاء الكود. و`store.controller.activateStore` نسخة مكرّرة معطوبة (تستخدم `type` و`ActivationCode` غير مستورد).
- **الإصلاح:** استخدام `role: accountType` + تحقق من النوع؛ وحذف النسخة المكرّرة (المعتمدة في `activation.controller.activateStore`).
- **`activation.controller.createStoreActivationCode`:** يضبط `type: accountType` و`createdBy`، بينما النموذج يتطلب `role` (enum) ولا يعرف `type` → فشل validation محتمل.
- **`store.controller.activateStore`:** يستخدم `ActivationCode` **غير المستورد** في الملف + يبحث بـ `type:"store_activation"` غير الموجود → ReferenceError/فشل.

## BUG-007 ✅ Fixed (v0.3.0 - 2026-06-30) — تضارب بين `const user` و`User`
- **الملفات:** `store.controller.js`, `user.controller.js`, `treasure.controller.js`, `promo-code.controller.js`.
- **التأكيد:** مؤكَّد — كانت تستورد `const user` وتستخدم `User` (غير معرّف) → `ReferenceError` فعلي في الدوال المعنية (بعضها دوال ميتة غير موصولة، لذا لم يظهر دائماً).
- **الإصلاح:** توحيد الاستيراد إلى `const User = require("../models/user")` في الأربعة.

## BUG-008 ✅ Fixed (v0.3.0 - 2026-06-30) — تضارب اسم الموديل ActivationCode
- **الملفات:** `models/ActivationCode.js` و`models/activationCodeBusiness.js` (كلاهما يسجّل `"ActivationCode"`).
- **الإصلاح:** حُذف `activationCodeBusiness.js` (كان ميّتاً غير مستورد، لكنه لغم `OverwriteModelError`)، وأُضيف حقل `prefix` إلى `ActivationCode.js` ليُحفظ بدل تجاهله. كل أكواد التفعيل الآن في موديل واحد.

## BUG-009 ✅ Fixed (v0.4.0 - 2026-06-30) — كود ميّت: Dashboardstorer.routes.js
- **الوصف:** يستورد `getStoreAnalytics` من `store.controller` (غير موجودة) وغير مُسجَّل في `server.js`.
- **الإصلاح:** حُذف الملف (مؤكَّد أن لا شيء يستورده).

## BUG-010 ✅ Fixed (v0.3.0 - 2026-06-30) — متغيّرات بيئة مشار إليها وغير معرّفة
- **الوصف:** `auth.controller` يستخدم `GOOGLE_CLIENT_ID` و`MASTER_KEY` غير الموجودَين في `.env`.
- **الإصلاح:** أُضيفا إلى `.env`. والأهم: **تصليب ثغرة** في `resetAdminPassword` — كان `masterKey !== process.env.MASTER_KEY` يصبح `undefined !== undefined` (=false) عند غياب المفتاح فيسمح بإعادة تعيين كلمة مرور الأدمن لأي شخص. الآن يُرفض الطلب إن غاب المفتاح أو غاب الإدخال.

## BUG-011 ✅ Fixed (2026-06-30، يدوياً من صاحب المشروع) — node_modules داخل admin-panelFrontend/src
- **الأثر:** كان يربك الفهرسة/البناء ويضخّم البحث.
- **الإصلاح:** حذف صاحب المشروع `node_modules` المُخطئ واستعاد `src` من نسخة احتياطية. يجب تثبيت التبعيات في **جذر** `admin-panelFrontend/` فقط.

---

## كيفية استخدام هذا الملف
- عند تأكيد خطأ 🟠 بالتشغيل، حدّث حالته.
- عند إصلاح أي خطأ: انقله إلى `13_CHANGE_LOG.md`، وعلّمه هنا كـ ✅ Fixed مع تاريخ ورقم الإصدار، وحدّث الملف المختص (`03/04/06/07/08`).
- لا تُصلح أي خطأ قبل الموافقة وحسب خطة متّفق عليها.
