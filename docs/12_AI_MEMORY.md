# 12 — ذاكرة المشروع (AI Memory)

> هذا الملف هو **الذاكرة الدائمة** للمشروع. يُحدَّث كلما تعلّمنا شيئاً جديداً. اقرأه قبل أي مهمة.
> **⭐ Phase 1 / Launch:** `16_LAUNCH_MEMORY.md` → `CHANGE_LOG.md` → `TODO.md`
> آخر تحديث: **2026-07-04** — Phase 1 Development Freeze.

---

## 0. Phase 1 — Development Freeze (2026-07-04)

- ❌ Features جديدة | ✅ Bugs + أداء + إكمال الموجود فقط
- ❌ Schema DB بدون ضرورة Bug | ❌ إعادة هيكلة كبيرة
- **التفاصيل + checklist الرفع:** `16_LAUNCH_MEMORY.md`

---

## 1. فكرة المشروع
منصة **Offers-Tech**: سوق عروض ومتاجر محلية (غزة/فلسطين) + طبقة تحفيز وألعاب (نقاط، طاقة، فرص سحب، بطاقات، صناديق، سحوبات، لوحة شرف). Backend واحد + قاعدة بيانات MongoDB واحدة تخدم 3 واجهات (زبون، متاجر/موردون، إدارة).

## 2. فلسفة المشروع
- مشروع حقيقي متجه للإنتاج (~90%)، ليس تجربة.
- **متغيّر باستمرار**: قد تتغيّر قاعدة البيانات/المنطق/الـ APIs/الواجهات/الأنظمة مستقبلاً.
- المطلوب: حلول قابلة للتوسع، سهلة التعديل والصيانة، مناسبة للإنتاج.
- النهج: **تحسين تدريجي لا إعادة بناء**. لا نعتبر مستوى الكود الحالي "خطأ".

## 3. طريقة التفكير المطلوبة (دور الفريق)
نعمل بأدوار متعددة في آن (Senior/Architect/Backend/Frontend/DB/Security/Performance/DevOps/Docs/Reviewer/UX).
ننظر للمشروع **كنظام متكامل** لا أجزاء منفصلة، لأن الـ Backend وقاعدة البيانات مشتركان بين الواجهات الثلاث.

## 4. قواعد العمل المتفق عليها
- مرحلة القراءة: **لا تعديل على الكود**. أي اقتراح تحسين يُسجَّل في **`TODO.md`** فقط.
- قبل أي تعديل: اقرأ `16_LAUNCH_MEMORY.md` → نفّذ → **`CHANGE_LOG.md`** → `TODO.md` إن وُجدت فكرة مؤجلة.
- **Phase 1:** لا features — راجع §0 و `16_LAUNCH_MEMORY.md`.

---

## 5. حقائق تقنية ثابتة (Ground Truth)
- **Backend:** Express 5، Mongoose 9، JWT (7 أيام)، bcrypt، Google OAuth. نقطة الدخول `backend/server.js`. كل المسارات تحت `/api`.
- **DB:** MongoDB Atlas. 21 نموذجاً. النماذج هي العقد المشترك.
- **الأدوار:** `customer`, `store`, `supplier`, `admin` (حقل `role` في User).
- **المصادقة:** التوكن + المستخدم في `localStorage`؛ axios interceptor يرفق `Bearer`.
- **عقد مسارات التسجيل (مهم — لا تُخطئه):** الـ Backend يعرّف **`POST /api/auth/register-customer`** (زبون) و**`POST /api/auth/register-business`** (تاجر/مورد). **لا يوجد** مسار `/auth/register`. أي واجهة يجب أن تستدعي المسار الدقيق وإلا 404.
- **عنوان الـ API:** مكتوب يدوياً `http://localhost:5000/api` في كل واجهة.
- **مهمة دورية:** `monitorOffers` كل 24 ساعة داخل عملية الخادم.
- **seedAdmin:** ينشئ `admin@offers.com` / `admin123456` عند الإقلاع.

---

## 6. القواعد التي يجب ألا تُكسر (Invariants)
1. `role` هو مصدر الحقيقة للصلاحيات، والتحقق الحقيقي في الخادم.
2. رصيد الكروت (`store.cards`) والنقاط/الفرص لا تُعدَّل إلا عبر مسارات موثوقة محمية.
3. المتجر يبدأ `isActive=false` (إلا تسجيل بكود تفعيل/تفعيل أدمن).
4. العروض تُعطّل (soft) لا تُحذف في المسار العادي.
5. سلة واحدة لكل مستخدم؛ طلب منفصل لكل متجر؛ السلة لا تُفرّغ عند checkout.
6. رسائل المحادثة مؤقتة (TTL 4 أيام).

## 7. أشياء قابلة للتغيير بأمان نسبياً
- إعدادات في `SystemSetting` (key/value) — مثل طاقة الانضمام.
- أنواع العروض/البطاقات/الجوائز قابلة للتوسعة.
- التصنيفات والمناطق ديناميكية (نماذج Category/Region) — لكن انتبه أن `Store.region` enum صلب (ازدواجية).

---

## 8. مخاطر/حقائق حسّاسة تعلّمناها (مهم جداً)
> تم في v0.2.0 إصلاح كل المخاطر 🔴 Critical. ما تبقّى أصفر/أخضر.

**أُصلِحت (v0.2.0 - 2026-06-30):**
- ✅ ثغرة صلاحيات الأدمن (كل `/api/admin/*` يتطلب الآن دور admin).
- ✅ تضارب DrawBatch (أُزيل التصويت، ووُحِّد الـ controller مع النموذج).
- ✅ حساسية حالة الأحرف في require (7 مسارات).
- ✅ `User.storesEnergyClaimed` (أُضيف للنموذج).
- ✅ بيانات الأدمن الافتراضي (من `.env` الآن).
- ✅ تسريب `err.stack` في المحادثات.
- ✅ `/api/promo/create` يتطلب دور store/supplier/admin.
- ✅ node_modules داخل `admin-panelFrontend/src` (حذفه صاحب المشروع واستعاد src).

**أُصلِحت (v0.3.0 - الأصفر):**
- ✅ تعارض `CardType` (أُضيف `price` + alias `points` ⇆ `pointsValue`) — BUG-005.
- ✅ `const user` → `const User` في 4 controllers — BUG-007.
- ✅ خلل `activation.controller` (`type`→`role`) + حذف `store.activateStore` المكرّر — BUG-006.
- ✅ حذف موديل `ActivationCode` المكرّر + إضافة `prefix` — BUG-008.
- ✅ متغيّرات البيئة (`GOOGLE_CLIENT_ID`/`MASTER_KEY`) + **تصليب ثغرة** `resetAdminPassword` — BUG-010.
- ✅ CORS allowlist عبر `CORS_ORIGINS`. ✅ rate limiting على `/api/auth`. ✅ تحقق مدخلات المصادقة + **إغلاق تسريب hash كلمة المرور** في ردود المصادقة.

**ما زال قائماً (مؤجّل — يتطلب عملاً أكبر):**
- 🟡 **M5:** JWT في localStorage → الأفضل httpOnly cookies (يمسّ المواقع الثلاثة).
- 🟡 **M11:** Pagination للقوائم + فهارس DB.
- 🟡 **M7 كامل:** طبقة تحقق موحّدة لكل المسارات (الآن المصادقة فقط).
**أُصلِحت (v0.4.0 - الأخضر):**
- ✅ حذف الكود الميّت `Dashboardstorer.routes`. ✅ معالج أخطاء مركزي + 404. ✅ `VITE_API_URL` + معالجة 401 موحّدة في الواجهات الثلاث. ✅ `.gitignore` في الجذر.

**أخضر يبقى (معماري/اختياري):** توحيد شكل الاستجابة، Service Layer، إصدار API، دمج `cardType.controller`/`box-admin.controller`، code-splitting، Docker/CI، إشعارات `monitorOffers` الفعلية.

## 8.ب قرارات عمل مثبّتة
- **السحوبات:** الأدمن هو المتحكّم. **لا يوجد نظام تصويت.** المشاركة تتم بإنفاق فرص (`entriesToSpend`)، و**إنفاق فرص أكثر يزيد الحظ** (ترجيح `entriesCount`). الفائزون يُختارون عشوائياً مُرجَّحاً عبر `POST /api/admin/draws/:drawId/draw-winners`. (مؤكّد v0.2.1.)
- **بيانات الأدمن:** تُضبط عبر `ADMIN_EMAIL`/`ADMIN_PASSWORD` في `.env`؛ لا كلمة مرور في الكود.

## 8.ج قرارات سبرنت TASK-001 المعتمدة (المرجع الكامل: `PROJECT_DECISIONS.md`)
- **المسابقات مستقلة عن Draw** وتعتمد على النقاط فقط (نظام Entries يبقى للسحوبات) — AD-002.
- **Cloudinary** للصور خلف طبقة تجريد لسهولة تبديل المزوّد — AD-003.
- **توصيات** بسيطة rule-based قابلة للتطوير (موقع/تصنيف/اهتمام/سجل/محفوظ/قرب/أحدث) — AD-004.
- **تصنيفات هرمية** 3 مستويات+ — AD-005.
- **أداء:** Lazy Loading + Infinite Scroll + **Cursor-Based Pagination** (لا offset/skip إلا للضرورة) — AD-006.
- **طبقة User Activity موحّدة** (مفضلة/مشاهدة/بحث/مفتوح/متاجر مُزارة) — AD-007.
- **Notification Service مركزية واحدة** لكل النظام — AD-008.
- **Shared Services** للمنطق المكرّر (سعر/خصم/نقاط) — AD-009.
- **عملية 12 مرحلة** لكل ميزة + **عدم الحذف** (Deprecated بدل الحذف) — AD-010/AD-012.

## 9. أسئلة مفتوحة لصاحب المشروع (تحتاج إجابة)
1. هل تشارك الصندوق اليومي وصناديق الكنز نفس مؤقّت 24 ساعة (`lastChestOpened`) مقصود؟
2. ما النموذج الصحيح للسحوبات: نموذج `DrawBatch` الحالي أم ما يفترضه `draw.controller`؟
3. هل `customerFrontend/permissions.js` مقصود استخدامه أم بقايا؟
4. هل واجهة المتاجر (React 19/Vite 8) مقصود إبقاؤها على إصدار مختلف عن البقية؟

## 10. ما تم التحقق منه vs ما لم يُتحقق
- ✅ قُرئ بالكامل: backend (models, middleware, controllers, routes, utils, server)، وcore الواجهتين customer و store.
- ⚠️ لم يُقرأ بعمق: منطق صفحات `admin-panelFrontend` (بسبب node_modules داخل src). يجب التحقق وتحديث `05_Frontend.md` لاحقاً.
- ⚠️ لم تُختبر تشغيلياً أي افتراضات (مرحلة قراءة فقط). الأخطاء "المحتملة" تحتاج تأكيد بالتشغيل.

---

## 11. سجل التعلّم (Learning Log)
| التاريخ | ما تعلّمناه |
|--------|-------------|
| 2026-06-30 | استكشاف كامل للهيكل + قراءة الـ Backend والواجهتين. توثيق أولي كامل (16 ملفاً). رصد الثغرات والتضاربات أعلاه. |
| 2026-06-30 | إصلاح كل أخطاء 🔴 Critical (v0.2.0). تأكيد: صفحة الزبون `Draws.jsx` بيانات تجريبية ثابتة لا تتصل بالـ API. قرار: لا تصويت في السحوبات، الأدمن متحكم. |
| 2026-06-30 | v0.2.1: اعتماد ترجيح السحوبات بعدد الفرص + اختيار فائزين مُرجَّح. v0.3.0: إصلاح أخطاء 🟡 Medium. تأكيد: الفرونت الحيّ للبطاقات `PromoCodes.jsx` يستخدم `price`/`points` (لذا أبقيناهما عبر alias)؛ صفحات السحوب/البطاقات الأخرى في الأدمن بيانات تجريبية. |
| 2026-06-30 | v0.4.0: تحسينات 🟢 (معالج أخطاء مركزي، VITE_API_URL، 401 موحّد، حذف كود ميّت، .gitignore جذر). |
| 2026-06-30 | بدء سبرنت TASK-001 واعتماد 12 قراراً معمارياً (`PROJECT_DECISIONS.md`). v0.5.0 المرحلة 0: **السبب الجذري لفشل إنشاء الحساب = مسار خاطئ** (`/auth/register` بدل `/auth/register-customer`) وليس Axios/Proxy/CORS. أُصلح في `Register.jsx` واختُبر حياً (PASS: حساب أُنشئ → توكن → الصفحة الرئيسية). ملاحظة خارج النطاق: سطر `Cannot find module 'qrcode'` قديم في سجل الـ Backend — مُسجَّل للمراجعة. |
| 2026-07-01 | v0.16.0 TASK-005: **تجربة المتاجر**. `StoreMembership` pending→member عند أول كود. `browseStores` ترتيب حسب اهتمام+تقييم+منطقة+نشاط. Explore/StoreDetail/ProductDetail API. FAB إحالة. store-supplier: CodeStats + MemberPrizes. admin: Regions tree/reorder + Settings competitions toggle. |
| 2026-07-01 | v0.15.0 TASK-004: **مفاتيح المتاجر + تقييم**. `Store.codePrefix` فريد عند إنشاء المتجر؛ أكواد `{PREFIX}-HEX` بدل `OT-` (legacy مدعوم). `POST /promo/redeem` → auto-follow + `storeId` + `codesEntered`. `Rating` model + `/api/ratings`. ترتيب عروض عبر `ranking.util.js` (Bayesian + freshness). FAB زبون: QR + API + animation. |
| 2026-07-01 | v0.14.0 TASK-003: **عجلة الحظ**. Backend يحدّد النتيجة (`crypto.randomInt` على `winWeight`؛ لا `winWeight` للعميل). فصل `displayWeight` (حجم القطاع) عن `winWeight` (احتمال الفوز). outcomes: `win`/`no_win`/`locked` — **locked لا يخصم نقاط**. `WheelSpin` audit + `Idempotency-Key` + rate limit 3s. `WheelWin` + inventory زبون + admin winners + chat. **SensitiveGate:** `User.sensitivePasswordHash` + JWT `x-sensitive-token` (30m) لـ CRUD جوائز العجلة وصفحة الأكواد. تكلفة الدوران: `SystemSetting` key `wheel_spin_cost` (افتراضي 5). |
| 2026-07-01 | v0.13.0 TASK-002: **تجربة الزبون**. دردشة messenger كاملة (`Chats.jsx`) مع context banner قابل للضغط عبر React Router (لا href نسبي). Header: سلة/دردشة/شرف/نقاط/مسابقات/عجلة. سلة + checkout + طلبات + إلغاء. React Query للcache. HonorBoard API + admin موسّع. Competitions list/detail. **فصل store/supplier:** `utils/storeFilter.js` على offers/feed/cart/recommendations — الزبون يرى/يشتري من role=store فقط. Order statuses: cancelled, completed_off_platform. |
| 2026-06-30 | v0.12.0 المرحلة 7: **طبقة User Activity موحّدة (AD-007)** + **توصيات rule-based (AD-004)**. `UserActivity` model (`type`: view_offer/open_offer/visit_store/search/favorite_offer + `meta`) + `services/activity.service.log` (fire-and-forget) + `/api/activity` (`POST /`، `GET /me`، `GET /recommendations`، `GET /favorites`، `POST /favorites/:offerId/toggle`). التوصيات تجمع إشارات التصنيف/المنطقة/البحث من آخر 80 نشاطاً بأوزان (مفضّلة 3/فتح 2/غيرها 1) وترتّب عروض المتاجر المطابقة، مع fallback لأحدث العروض. الزبون: `utils/activity.js`، صف "موصى لك" + تسجيل بحث في `Home.jsx`، قلب مفضّلة في `OfferCard`/`OfferDetail`، تسجيل `open_offer`/`visit_store`، صفحة `/favorites` + أيقونة الهيدر. **مهم:** أي تسجيل نشاط يمرّ عبر `activity.service`؛ والمفضّلة تُخزّن `category/region` في `meta` لتغذية التوصيات. اختُبر حياً (PASS). |
| 2026-06-30 | v0.11.0 المرحلة 6: **دورة حياة العروض** + **خدمة إشعارات مركزية (AD-008)**. `Notification` model + `services/notification.service.js` (`create`/`createMany`) + `/api/notifications`. `PATCH /offers/:id/renew` (يمدّد `autoDeleteAt`+`isExtended`+ينشئ إشعار). `getMyOffers?all=true` يشمل المتوقّفة. `offerMonitor` ينشئ إشعارات `offer_expiring`/`offer_expired` (كان console.log). واجهة المتجر: `OffersManager` حقيقي + `Notifications` + جرس. **مهم:** أي إشعار جديد في النظام يجب أن يمرّ عبر `notification.service` (لا إنشاء مباشر). |
| 2026-06-30 | v0.10.0 المرحلة 5: **صفحة تفاصيل العرض** (`OfferDetail.jsx` تجلب `GET /offers/:id` التي تُرجع `store.owner`) + **واجهة محادثة جديدة في تطبيق الزبون** (`Chat.jsx`/`ChatConversation.jsx`, مسارات `/chat` و`/chat/:convId`). زر "تواصل" = `POST /chats {recipientId:store.owner, context}` ثم `POST /chats/:convId {text}` يرسل رابط العرض تلقائياً. المحادثة مشتركة مع تطبيق المتاجر (نفس `/api/chats`). |
| 2026-06-30 | v0.9.0 المرحلة 4: **`GET /api/offers/feed`** (cursor pagination بالـ `_id` تنازلي + بحث `q` في العنوان/اسم المتجر/التصنيف + فلاتر). يُرجع `{items, nextCursor}`. **مهم:** `GET /offers` القديم بقي يُرجع مصفوفة (توافق مع واجهة المتاجر). الزبون: `OfferCard.jsx` (زرّا للسلة/التفاصيل) + Infinite Scroll عبر IntersectionObserver في `Home.jsx`. السلة تدعم العروض عبر `POST /cart/add {itemType:'offer'}`. |
| 2026-06-30 | v0.8.0 المرحلة 3: **تصنيفات هرمية** (`Category.parent` ذاتي) + **مناطق** (`/api/categories`, `/api/regions`) + فلترة `GET /api/offers?category&region&subRegion`. الفلترة تتم **عبر المتجر** (العرض يرث `store.category` النصّي و`store.region` enum). أدمن: `Categories.jsx` (هرمي) + `Regions.jsx`. الزبون: شريط فلاتر في `Home.jsx`. ملاحظة: `getCategoryAndDescendantNames` يحوّل id التصنيف إلى أسماء (هو+أحفاده) لمطابقة `store.category`. اختُبر حياً (PASS). |
| 2026-06-30 | v0.7.0 المرحلة 2: **نظام مسابقات جديد مستقل** (`Competition` model + `/api/competitions`). قائم على النقاط فقط (لا علاقة بـ Draw). مسابقة رئيسية واحدة (`isFeatured`) في الصفحة الرئيسية. الانضمام = إنفاق نقاط (`entries × pointsPerEntry`)، الخصم موثوق على الخادم. أدمن CRUD كامل (`admin-panelFrontend/pages/Competitions.jsx`). الزبون: `CompetitionCard.jsx`. اختُبر حياً End-to-End (PASS). أداة مفيدة للاختبار: `PATCH /api/admin/users/update-manual {userId, points}` لمنح نقاط. |
| 2026-06-30 | v0.6.0 المرحلة 1: `customerFrontend/Home.jsx` كانت **وهمية بالكامل**؛ رُبط قسم "أحدث العروض" بـ `GET /api/offers` (يُرجع مصفوفة عروض active مع `store` populated: name/logo/region) مع حالات تحميل/خطأ/فارغ. اختُبر حياً (PASS، 200، عرض حقيقي ظهر). بطاقة المسابقة (Phase 2) والتصنيفات (Phase 3) والبحث/الكسول (Phase 4) ما زالت placeholders ثابتة عمداً حسب ترتيب AD-001. `OfferDetail.jsx` ما زالت بيانات تجريبية (تُربط في Phase 5). |

| 2026-07-04 | **تنظيم docs:** `16_LAUNCH_MEMORY` (حالة) + `CHANGE_LOG.md` (تنفيذ) + `TODO.md` (مستقبل). Phase 1 Freeze. التفاصيل التنفيذية في CHANGE_LOG وليس LAUNCH. |

> أضف صفّاً جديداً هنا كلما اكتشفت معلومة مهمة عن المشروع.
