# 13 — سجل التغييرات (Change Log) — أرشيف

> **⚠️ من 2026-07-04:** السجل التنفيذي الحالي → **`CHANGE_LOG.md`**
> هذا الملف = أرشيف v0.1–0.16 (Keep a Changelog + SemVer).

---

## قالب الإدخال (انسخه لكل تعديل)

```
## [الإصدار] - YYYY-MM-DD
### السبب
لماذا أُجري هذا التعديل؟

### الملفات المتأثرة
- backend: ...
- frontend (customer/store/admin): ...
- docs: ...

### قاعدة البيانات
هل تغيّر أي Schema؟ هل يحتاج migration؟

### Backend
ما الذي تغيّر في المنطق/المسارات؟

### Frontend
ما الذي تغيّر في الواجهات؟ أي واجهة تحديداً؟

### التوافق مع الإصدارات السابقة (Backward Compatibility)
هل يوجد كسر توافق؟ (Breaking change نعم/لا) وكيف نتعامل معه.
```

---

## [0.1.0-docs] - 2026-06-30
### السبب
إنشاء قاعدة المعرفة الرسمية (Knowledge Base) للمشروع كمرجع موحّد للفريق، قبل البدء بأي تعديل برمجي.

### الملفات المتأثرة
- backend: لا شيء (مرحلة قراءة فقط — لم يُعدَّل أي كود).
- frontend: لا شيء.
- docs: إنشاء مجلد `docs/` وإضافة 16 ملفاً (`00`..`15`).

### قاعدة البيانات
لا تغيير.

### Backend
لا تغيير. تم فقط توثيق البنية والمنطق والثغرات المرصودة.

### Frontend
لا تغيير. تم توثيق الواجهات الثلاث (admin على مستوى الهيكل لتعذّر القراءة العميقة).

### التوافق مع الإصدارات السابقة
لا كسر توافق (لا تغييرات كود).

---

> ⬆️ أضف الإدخالات الأحدث **في الأعلى** أسفل هذا السطر مباشرة.

---

## [0.16.0] - 2026-07-01 — TASK-005: تجربة المتاجر والاكتشاف
### السبب
ربط صفحات المتاجر بالـ Backend، نظام عضوية pending/member، ترتيب ذكي، مناطق هرمية، لوحة المتجر، وإكمال الفجوات من TASK-004.

### Backend
- `StoreMembership`, `StoreMemberPrize`, `storeDiscovery.service` (ترتيب حسب اهتمام + تقييم + نشاط + منطقة).
- مسارات: `/stores/browse`, `/by-regions`, `/suggest`, join/leave, member-prizes, `/my/code-stats`.
- `POST /admin/settings` لـ `store_competitions_enabled` و `referral_reward_points`.
- `PATCH /regions/reorder` + شجرة `?tree=true`.

### Frontend (customer)
- `Explore`, `StoreQuickSearch`, `StoreDetail`, `ProductDetail` — API كامل.
- مكونات مشتركة: `Toast`, `LoadingSpinner`, `EmptyState`, `ErrorState`, `StoreCard`, `ProductCard`, `StarRating`.
- FAB: كود + **كروت مجانية** (إحالة).
- عضوية: pending حتى إدخال كود → member.

### Frontend (store-supplier)
- `CodeStats` (بصمة + QR + إحصائيات).
- `MemberPrizes` (إدارة جوائز الأعضاء).

### Frontend (admin)
- `Regions.jsx` — هرمي + إعادة ترتيب.
- `Settings.jsx` — تفعيل مسابقات المتاجر + نقاط الإحالة.

### التوافق
لا كسر — `User.followedStores` legacy غير مستخدم في مسارات المتاجر الجديدة.

---

## [0.15.0] - 2026-07-01 — TASK-004: مفاتيح المتاجر، الكروت، والتقييم
### السبب
فصل بصمة كل متجر عن البصمة العامة `OT-`، ربط FAB إدخال الكود بالـ Backend مع QR، ونظام تقييم موحّد يؤثر على ترتيب النتائج.

### الملفات المتأثرة
- backend: **جديد** `utils/storePrefix.js`, `promoCode.util.js`, `ranking.util.js`؛ `models/rating.js`؛ `services/rating.service.js`؛ `controllers/rating.controller.js`؛ `routes/rating.routes.js`؛ تعديل `store.js`, `offer.js`, `product.js`, `promo-code.controller.js`, `auth.controller.js`, `store.controller.js`, `admin.controller.js`, `codeOrder.controller.js`, `offer.routes.js`, `activity.controller.js`, `server.js`.
- frontend (customer): `FloatingCodeButton.jsx` (API + QR + animation), `StarRating.jsx`, `AuthContext.jsx`, `OfferDetail.jsx`, `package.json`.
- frontend (admin): `CodeGeneratorPage.jsx` (اختيار متجر إلزامي).
- docs: `13_CHANGE_LOG.md`, `12_AI_MEMORY.md`, `06_APIs.md`, `03_Database.md`.

### قاعدة البيانات
- **Store.codePrefix** (unique): بصمة أكواد الكروت.
- **Store/Offer/Product:** `ratingAvg`, `ratingCount`.
- **Rating:** `{ user, targetType, targetId, stars }` — فهرس فريد لكل مستخدم/هدف.

### Backend
- توليد `{codePrefix}-{HEX}` بدل `OT-`؛ التحقق من البادئة عند الاسترداد (الأكواد القديمة `OT-` مدعومة).
- `POST /promo/redeem` يُرجع `storeId`, `userPoints`, `autoFollowed`؛ يزيد `codesEntered` ويُFollow تلقائياً.
- `POST /ratings`, `GET /ratings/mine`, `GET /ratings/:type/:id`.
- ترتيب العروض: Bayesian rating + freshness + priority في `ranking.util.js`.

### Frontend
- FAB: QR scanner + إدخال يدوي + مؤثر نقاط + انتقال لصفحة المتجر.
- تقييم 5 نجوم في `OfferDetail` (عرض + متجر).

### التوافق
- أكواد `OT-*` القديمة تعمل إذا مرتبطة بـ `PromoCode.store`. المتاجر القديمة تُBackfill بادئات عند إقلاع الخادم.

---

## [0.14.0] - 2026-07-01 — TASK-003: نظام عجلة الحظ (Wheel of Fortune)
### السبب
بناء نظام عجلة حظ متكامل مرتبط بالـ Backend ولوحة الإدارة: دوران آمن، جوائز قابلة للإدارة، فصل نسب الظهور/الفوز، حماية إضافية للصفحات الحساسة، وسجل فائزين مع محادثة.

### الملفات المتأثرة
- backend: **جديد** `models/wheelPrize.js`, `wheelSpin.js`, `wheelWin.js`؛ `services/wheel.service.js`؛ `controllers/wheel.controller.js`, `admin-sensitive.controller.js`؛ `middleware/sensitiveAuth.middleware.js`؛ `routes/wheel.routes.js`, `wheel-admin.routes.js`؛ تعديل `models/user.js` (`sensitivePasswordHash`)؛ `server.js`.
- frontend (customer): **جديد** `components/WheelVisual.jsx`؛ تعديل `pages/LuckyWheel.jsx` (API + legend + نتائج)؛ `pages/Inventory.jsx` (`GET /wheel/my-wins`).
- frontend (admin): **جديد** `components/SensitiveGate.jsx`, `WheelPreview.jsx`, `utils/sensitiveToken.js`؛ `pages/WheelManagement.jsx`, `WheelWinners.jsx`؛ تعديل `api/axios.js`, `App.jsx`, `Sidebar.jsx`؛ `CodeGeneratorPage` محمي بـ SensitiveGate.
- docs: `13_CHANGE_LOG.md`, `12_AI_MEMORY.md`, `06_APIs.md`, `03_Database.md`.

### قاعدة البيانات
- **WheelPrize:** name, description, icon, image, color, minPoints, displayWeight, winWeight, prizeType, prizeValue, isActive, sortOrder.
- **WheelSpin:** سجل تدقيق (outcome, pointsCost, idempotencyKey, segmentIndex, ip).
- **WheelWin:** سجل فوز (userName, phone, address, deliveryStatus, adminNotes).
- **User.sensitivePasswordHash:** كلمة مرور إضافية للأدمن (صفحات حساسة).

### Backend
- **العميل:** `GET /wheel/config`, `POST /wheel/spin` (header `Idempotency-Key`), `GET /wheel/my-wins`.
- **المنطق:** اختيار الجائزة عبر `crypto.randomInt` على `winWeight`؛ النتيجة `win|no_win|locked`؛ **locked = لا خصم نقاط**؛ win/no_win = خصم `wheel_spin_cost` (افتراضي 5)؛ rate limit 3s.
- **الأدمن:** `POST /admin/sensitive/setup|verify|change`؛ CRUD جوائز `/admin/wheel/prizes` (يتطلب `x-sensitive-token`); فائزون `/admin/wheel/wins` (admin فقط).

### Frontend
1. **الزبون:** عجلة conic-gradient + legend؛ زر "جرّب حظك"؛ modals للفوز/القفل/عدم الفوز؛ إعادة محاولة مجانية عند locked.
2. **الأدmin:** SensitiveGate + sessionStorage token؛ إدارة جوائز + معاينة مباشرة؛ فائزو العجلة + محادثة (`POST /chats`).
3. **الأمان:** Frontend يعرض فقط `segmentIndex` من الخادم — لا `winWeight`.

### التوافق مع الإصدارات السابقة
لا كسر توافق. `LuckyWheel.jsx` استبدل المنطق التجريبي القديم (client-side random).

---

## [0.13.0] - 2026-07-01 — TASK-002: تحسين تجربة الزبون (Customer Experience)
### السبب
تحسين تجربة المستخدم في تطبيق الزبون: دردشة احترافية، Header محسّن، سلة كاملة، أداء أفضل، لوحة شرف، نقاط، مسابقات، وفصل عروض المحلات عن التجار.

### الملفات المتأثرة
- backend: **جديد** `utils/storeFilter.js`؛ تعديل `routes/offer.routes.js` (فلتر store-only)؛ `routes/cart.routes.js` (رفض supplier + owner populate)؛ `models/order.js` (حالات cancelled/completed_off_platform)؛ `routes/order.routes.js` (`PATCH /:id/cancel`)؛ `models/honorBoard.js` + `controllers/honor-board.controller.js` + `routes/honor.routes.js` (حقول فائز موسّعة + admin CRUD)؛ `controllers/activity.controller.js` (توصيات store-only).
- frontend (customer): **جديد** `pages/Chats.jsx` (مessenger كامل)، `pages/Cart.jsx`، `pages/Competitions.jsx`، `pages/CompetitionDetail.jsx`، `components/PointsModal.jsx`، `styles/Chats.css`، `lib/queryClient.js`؛ تعديل `Header.jsx`، `Home.jsx` (React Query)؛ `OfferDetail.jsx` (chatContext)؛ `HonorBoard.jsx` (API)؛ `main.jsx` (QueryClientProvider)؛ `App.jsx` (مسارات جديدة).
- frontend (admin): تعديل `HonorManagement.jsx` (API حقيقي + حقول موسّعة).
- docs: `13_CHANGE_LOG.md`, `12_AI_MEMORY.md`.

### Backend
- **فصل store/supplier:** `restrictOfferQueryToCustomerStores` يُطبَّق على `GET /offers` و`/offers/feed` وتوصيات النشاط. السلة ترفض إضافة/checkout عناصر متاجر suppliers للزبون.
- **الطلبات:** حالات `cancelled` و`completed_off_platform` للتوسّع المستقبلي؛ `PATCH /orders/:id/cancel` للزبون (pending فقط).
- **لوحة الشرف:** حقول `winnerImage`, `prizeName`, `receivedAt`, `competitionLink`, `isPrimary`؛ `GET /honor/admin/all`, `PUT /:id`, `DELETE /:id`.

### Frontend (customer)
1. **دردشة:** messenger موحّد (قائمة + نافذة) بنفس تجربة التجار: context banner **قابل للضغط** (React Router)، reply-to، صور، polling 3s، mobile-first.
2. **Header:** أيقونات السلة/دردشة/شرف/نقاط/مسابقات/عجلة مع badge للسلة.
3. **السلة:** GET/update/remove/checkout + طلباتي + إلغاء pending.
4. **الأداء:** `@tanstack/react-query` — cache + staleTime + refetchOnFocus + useInfiniteQuery للعروض.
5. **لوحة الشرف:** `GET /honor/active` بتصميم احتفالي.
6. **النقاط:** modal مع نجوم ملوّنة + progress + مسابقات مقترحة.
7. **المسابقات:** قائمة + صفحة تفاصيل + انضمام.
8. **Mobile First:** Chats responsive، Header مضغوط للهاتف.

### التوافق
متوافق خلفياً. حقول HonorBoard جديدة اختيارية. مسارات Chat القديمة (`Chat.jsx`/`ChatConversation.jsx`) استُبدلت بـ `Chats.jsx`.

---

## [0.12.0] - 2026-06-30 — TASK-001 / المرحلة 7: نظام التوصيات الذكي + طبقة User Activity
### السبب
إنشاء طبقة نشاط مستخدم موحّدة (AD-007) تجمع المشاهدة/الفتح/زيارة المتجر/البحث/المفضّلة، وتغذية نظام توصيات بسيط قائم على القواعد (AD-004) قابل للتطوير لاحقاً، مع ميزة المفضّلة الكاملة في واجهة الزبون.

### الملفات المتأثرة
- backend: **جديد** `models/userActivity.js`, `services/activity.service.js`, `controllers/activity.controller.js`, `routes/activity.routes.js`؛ تعديل `server.js` (تسجيل `/api/activity`).
- frontend (customer): **جديد** `utils/activity.js` (helper)، `pages/Favorites.jsx`؛ تعديل `components/OfferCard.jsx` (زر مفضّلة اختياري عبر props)، `pages/Home.jsx` (صف "موصى لك" + تسجيل البحث + تمرير المفضّلة)، `pages/OfferDetail.jsx` (تسجيل `open_offer` + زر مفضّلة)، `pages/StoreDetail.jsx` (تسجيل `visit_store` بصمت)، `components/Header.jsx` (أيقونة المفضّلة)، `App.jsx` (مسار `/favorites` المحمي).
- docs: `13_CHANGE_LOG.md`, `12_AI_MEMORY.md`, `06_APIs.md`, `03_Database.md`, `05_Frontend.md`, `PROJECT_DECISIONS.md`.

### قاعدة البيانات
- **نموذج جديد `UserActivity`** (موحّد — AD-007): `{ user, type(enum: view_offer|open_offer|visit_store|search|favorite_offer), targetType, targetId, meta(Mixed), timestamps }` + فهارس `{user,type,createdAt}` و`{user,type,targetId}`. **إضافة غير كاسرة** (مجموعة جديدة، لا تمسّ بيانات قائمة).

### Backend
- `/api/activity` (محميّة بالكامل بـ auth):
  - `POST /` تسجيل نشاط (`view_offer`/`open_offer`/`visit_store`/`search`).
  - `GET /me` نشاطي الأخير.
  - `GET /recommendations` توصيات قائمة على القواعد: تجمع إشارات التصنيف/المنطقة/عبارات البحث من آخر 80 نشاطاً (بأوزان: مفضّلة 3، فتح 2، غيرها 1)، تطابقها بمتاجر→عروض فعّالة، وترتّبها بنقاط؛ مع **fallback** لأحدث العروض عند غياب الإشارات أو نقص العدد.
  - `GET /favorites` قائمة المفضّلة (عروض فعّالة) + `favoriteIds`.
  - `POST /favorites/:offerId/toggle` تبديل المفضّلة (تخزّن `category/region` في `meta` لتغذية التوصيات).
- خدمة `activity.service.log` بنمط fire-and-forget (لا تُسقط الطلب الأساسي عند الفشل — AD-009).

### Frontend (customer)
- صف "موصى لك" أفقي أعلى الرئيسية (يختفي أثناء البحث).
- زر قلب على بطاقات العروض (props اختيارية، لا يكسر الاستخدامات القائمة) وفي رأس صفحة التفاصيل.
- صفحة `/favorites` كاملة (عرض/إزالة فورية) + أيقونة في الهيدر.
- تسجيل صامت للأنشطة: فتح العرض، زيارة المتجر، عبارة البحث (debounced).

### الاختبار (End-to-End حي)
اختبار متصفّح كامل: تحميل الرئيسية وصف التوصيات، تفعيل المفضّلة من البطاقة وصفحة التفاصيل (قلب يتحوّل أحمر)، صفحة المفضّلة تعرض العناصر، الإزالة الفورية تعمل، البحث يعمل، والتوصيات تتحدّث بعد النشاط. `GET /api/activity/recommendations` و`/favorites` ترجع **200**. بلا أخطاء console/شبكة. **PASS**.

### التوافق
متوافق خلفياً بالكامل. كل الإضافات نقاط/نموذج/مكوّنات جديدة، وزر المفضّلة في `OfferCard` يظهر فقط عند تمرير `onToggleFavorite`. لا كسر لأي مسار أو واجهة قائمة.

---

## [0.11.0] - 2026-06-30 — TASK-001 / المرحلة 6: دورة حياة العروض (انتهاء/تجديد/إشعارات)
### السبب
إكمال دورة حياة العرض: انتهاء تلقائي، تجديد من صاحب المتجر، وإشعارات حقيقية عبر خدمة إشعارات مركزية (AD-008).

### الملفات المتأثرة
- backend: **جديد** `models/notification.js`, `services/notification.service.js`, `controllers/notification.controller.js`, `routes/notification.routes.js`؛ تعديل `utils/offerMonitor.js` (إشعارات حقيقية بدل console.log)؛ تعديل `controllers/offer.controller.js` (`renewOffer` + `getMyOffers?all`)؛ تعديل `routes/offer.routes.js` (`PATCH /offers/:id/renew`)؛ تعديل `server.js` (تسجيل `/api/notifications`).
- frontend (store): إعادة كتابة `pages/storeOwner/OffersManager.jsx` (بيانات حقيقية + حالة + تجديد/إيقاف)؛ **جديد** `pages/Notifications.jsx`، `services/notifications.service.js`؛ تعديل `services/offers.service.js` (getMyOffers/renewOffer)؛ تعديل `App.jsx` (مساري `offers`/`notifications` للمتجر والمورّد) و`layouts/DashboardLayout.jsx` (روابط + جرس بشارة غير المقروء).
- docs: `13_CHANGE_LOG.md`, `12_AI_MEMORY.md`, `06_APIs.md`, `03_Database.md`, `05_Frontend.md`, `PROJECT_DECISIONS.md`.

### قاعدة البيانات
- **نموذج جديد `Notification`** (موحّد — AD-008): `{ user, type, title, body, data(Mixed), read }` + فهارس. **إضافة غير كاسرة**.
- `Offer`: لا تغيير في المخطّط (الحقول `expiresAt/autoDeleteAt/isExtended/deletionWarningSent` كانت موجودة). `createOffer` يضبط `autoDeleteAt` مسبقاً.

### Backend
- `/api/notifications`: `GET /` (إشعاراتي، `?unread=true`)، `GET /unread-count`، `PATCH /:id/read`، `PATCH /read-all`.
- `PATCH /api/offers/:id/renew {days?}`: يمدّد `autoDeleteAt`، يفعّل العرض، `isExtended=true`، يصفّر `deletionWarningSent`، وينشئ إشعار `offer_renewed`.
- `GET /api/offers/my?all=true`: يشمل العروض المتوقّفة/المنتهية (لإتاحة التجديد). **متوافق خلفياً** (بدون `all` يبقى النشطة فقط).
- `offerMonitor` (كل 24 ساعة): يوقف العروض المنتهية وينشئ `offer_expired`؛ وينبّه العروض القاربة على الانتهاء بـ `offer_expiring` (مرّة واحدة).

### Frontend (store/supplier)
- إدارة عروض حقيقية مع حالة دورة الحياة (نشط/قارب على الانتهاء/منتهٍ) وأزرار تجديد/إيقاف.
- صفحة إشعارات + جرس بشارة عدد غير المقروء (تحديث كل 30 ثانية) + "تعليم الكل كمقروء".

### الاختبار (End-to-End حي)
سلسلة API كاملة (كود أدمن → تسجيل متجر → إنشاء عرض → تجديد 60 يوماً) نجحت؛ التجديد مدّد `autoDeleteAt` وأنشأ إشعار `offer_renewed`؛ `getMyOffers?all` أرجع العرض؛ واجهة المتجر عرضت الإدارة + التجديد + صفحة الإشعارات + شارة الجرس + تعليم الكل كمقروء. **PASS** بلا أخطاء. (مسار إشعارات الانتهاء في `offerMonitor` مُتحقّق ساكناً — يستخدم نفس الخدمة، ويحتاج عرضاً قريب الانتهاء ليُطلق حيّاً.)

### التوافق
متوافق خلفياً. كل الإضافات نقاط/نماذج/حقول استعلام جديدة. لا كسر لأي مسار قائم.

---

## [0.10.0] - 2026-06-30 — TASK-001 / المرحلة 5: صفحة تفاصيل العرض + ربط المحادثة
### السبب
صفحة تفاصيل مستقلة لكل عرض (part 11) مع زر تواصل يفتح المحادثة مع صاحب المتجر ويُرسل رابط العرض تلقائياً.

### الملفات المتأثرة
- frontend (customer): إعادة كتابة `pages/OfferDetail.jsx` (بيانات حقيقية من `GET /offers/:id` + إضافة للسلة + تواصل)؛ **جديد** `pages/Chat.jsx` (صندوق المحادثات) و`pages/ChatConversation.jsx` (عرض المحادثة + إرسال)؛ تعديل `App.jsx` (مساري `/chat` و`/chat/:convId` المحميين).
- backend: **لا تغيير** (المحادثات وعرض `GET /offers/:id` موجودان مسبقاً — `/offers/:id` يُرجع `store.owner`).
- docs: `13_CHANGE_LOG.md`, `12_AI_MEMORY.md`, `05_Frontend.md`, `06_APIs.md`.

### التفاصيل
- `OfferDetail`: صورة + شارة (خصم/سعر) + وصف + انتهاء + كرت متجر (← `/store/:id`) + زرّا "إضافة للسلة" (`POST /cart/add`) و"تواصل".
- زر "تواصل": `POST /chats {recipientId: offer.store.owner, context:{itemType:'Offer', itemName, itemImage, itemUrl}}` → يجلب/ينشئ المحادثة → `POST /chats/:convId {text}` يرسل رابط العرض تلقائياً → ينتقل إلى `/chat/:convId`.
- **سدّ فجوة:** لم تكن هناك واجهة محادثة في تطبيق الزبون — أُضيفت صفحتا المحادثات/المحادثة (تستخدمان مسارات `/api/chats` القائمة، مع تحديث دوري بسيط كل 8 ثوانٍ).

### الاختبار (End-to-End حي)
فتح تفاصيل "جناح دجاج" → زر "تواصل" أنشأ محادثة مع "حسن الفيومي" وأرسل تلقائياً رسالة تحوي عنوان العرض ورابط `/offer/...`؛ الرسائل اليدوية تعمل؛ الصندوق يعرض المحادثة. **PASS** بلا أخطاء.

### التوافق
متوافق خلفياً بالكامل (لا تغييرات Backend). المحادثة تستخدم نفس نماذج/مسارات المحادثة المشتركة مع تطبيق المتاجر.

---

## [0.9.0] - 2026-06-30 — TASK-001 / المرحلة 4: عرض العروض + البحث + التحميل الكسول
### السبب
دعم آلاف العروض دون تحميلها دفعة واحدة (AD-006): بحث سريع + Infinite Scroll + **Cursor-Based Pagination**، وإعادة تصميم بطاقة العرض.

### الملفات المتأثرة
- backend: تعديل `routes/offer.routes.js` (**جديد** `GET /offers/feed` — cursor pagination + بحث + فلاتر).
- frontend (customer): **جديد** `components/OfferCard.jsx`؛ إعادة كتابة قسم العروض في `pages/Home.jsx` (Infinite Scroll + بحث debounced).
- docs: `13_CHANGE_LOG.md`, `12_AI_MEMORY.md`, `06_APIs.md`, `05_Frontend.md`, `09_Performance.md`.

### Backend
- `GET /api/offers/feed?limit&cursor&q&category&region&subRegion` يُرجع `{ items, nextCursor }`. الترتيب تنازلي بالـ `_id`؛ المؤشّر = `_id` آخر عنصر (`_id < cursor`). البحث `q` يطابق عنوان العرض أو اسم/تصنيف المتجر (regex آمن). **نقطة منفصلة** للحفاظ على توافق `GET /offers` (الذي يبقى يُرجع مصفوفة — لا يكسر واجهة المتاجر).

### Frontend
- `OfferCard`: تصميم جديد (صورة + شارة خصم/سعر + اسم المتجر + المنطقة + زرّا "للسلة" و"التفاصيل"). "للسلة" يستدعي `POST /cart/add { itemType:'offer' }`.
- `Home`: بحث debounced (400ms) + تمرير لانهائي عبر `IntersectionObserver` + إعادة ضبط عند تغيّر البحث/الفلاتر.

### قاعدة البيانات
لا تغيير.

### الاختبار (End-to-End حي)
`/offers/feed` يُرجع `{items,nextCursor}` (nextCursor=null مع عرض واحد). البطاقة الجديدة تظهر بالزرّين. البحث: "جناح"/"لحوم" يُظهران العرض، نص عشوائي → فارغ. "للسلة" أضاف العرض للسلة (تأكيد عبر `GET /cart` → عنصر itemType=Offer). لا أخطاء console. **PASS**. (ملاحظة: التمرير اللانهائي مُفعّل لكن لم يُختبر بصرياً لوجود عرض واحد < حجم الصفحة 12؛ آلية المؤشّر مُتحقّقة.)

### التوافق
متوافق خلفياً. `GET /offers` لم يتغيّر شكله (مصفوفة). الإضافة نقطة جديدة فقط.

---

## [0.8.0] - 2026-06-30 — TASK-001 / المرحلة 3: التصنيفات الهرمية + المناطق + الفلاتر
### السبب
بناء نظام تصنيفات هرمي (AD-005) ومناطق يديرهما الأدمن، وفلاتر ذكية في الصفحة الرئيسية تصفّي العروض حسب التصنيف/المنطقة.

### الملفات المتأثرة
- backend: تعديل `models/category.js` (إضافة `parent`/`icon`/`order` — هرمية متوافقة خلفياً)؛ **جديد** `controllers/category.controller.js`, `controllers/region.controller.js`, `routes/category.routes.js`, `routes/region.routes.js`؛ تعديل `routes/offer.routes.js` (فلترة `GET /offers` حسب `category`/`region`/`subRegion`)؛ تعديل `server.js` (تسجيل المسارين).
- frontend (admin): إعادة كتابة `pages/Categories.jsx` (CRUD حقيقي + هرمية)؛ **جديد** `pages/Regions.jsx`؛ تعديل `App.jsx` + `Sidebar.jsx`.
- frontend (customer): تعديل `pages/Home.jsx` (شريط فلاتر حقيقي: تصنيفات + فرعية + منطقة، يصفّي العروض).
- docs: `13_CHANGE_LOG.md`, `12_AI_MEMORY.md`, `06_APIs.md`, `03_Database.md`, `05_Frontend.md`.

### قاعدة البيانات
- `Category`: أُضيف `parent` (مرجع ذاتي، null=جذر)، `icon`، `order` + فهرس `{parent, isActive}`. **متوافق خلفياً**: التصنيفات القديمة تصبح جذوراً تلقائياً. (أُزيل `unique` من المخطّط للسماح بالتكرار تحت آباء مختلفين؛ لكن فهرس الـ unique القديم قد يبقى في DB — تُستخدم أسماء فريدة حالياً.)
- `Region`: بلا تغيير (يُدار الآن عبر API).

### Backend
- `/api/categories`: `GET /` (مسطّح)، `GET /tree` (شجرة)، + أدمن `POST/PUT/DELETE` (منع حذف تصنيف له أبناء).
- `/api/regions`: `GET /` + أدمن `POST/PUT/DELETE`.
- `GET /api/offers` يقبل `category` (id، يشمل الأحفاد بالاسم عبر `getCategoryAndDescendantNames`)، `region`، `subRegion` — الفلترة عبر `Store` (لأن العرض يرث تصنيف/منطقة متجره).

### Frontend
- Admin: إدارة تصنيفات هرمية كاملة + إدارة مناطق.
- Customer: شريط فلاتر (تصنيفات المستوى الأعلى → عند الاختيار تظهر الفرعية + قائمة المناطق)، يعيد جلب العروض عند تغيّر الفلتر.

### الاختبار (End-to-End حي)
أدمن أنشأ "ملابس"→"أطفال" و"لحوم" ومناطق "Gaza"/"North". على الزبون: فلتر "Gaza" يُظهر العرض، "North" فارغ؛ "لحوم" يُظهر العرض، "ملابس" فارغ مع ظهور الفرعية "أطفال". **PASS** بلا أخطاء.

### التوافق
متوافق خلفياً. الفلترة تعتمد على `Store.category` (نصّي) و`Store.region` (enum) — توثيق للازدواجية القائمة بين enum والنموذج الديناميكي (راجع `03_Database.md`).

---

## [0.7.0] - 2026-06-30 — TASK-001 / المرحلة 2: نظام المسابقات (مستقل، قائم على النقاط)
### السبب
بناء نظام مسابقات كامل يديره الأدمن، مستقل عن نظام Draw الحالي (القرار AD-002)، يُعرض منه مسابقة رئيسية واحدة في الصفحة الرئيسية، ويشارك فيه المستخدم بإنفاق نقاط (كل عدد نقاط = مشاركة، وإنفاق أكثر يزيد الحظ).

### الملفات المتأثرة
- backend: **جديد** `models/competition.js`, `controllers/competition.controller.js`, `routes/competition.routes.js`؛ تعديل `server.js` (تسجيل المسار).
- frontend (admin): **جديد** `pages/Competitions.jsx`؛ تعديل `App.jsx` (مسار `/competitions`) و`components/Sidebar.jsx` (رابط "إدارة المسابقات").
- frontend (customer): **جديد** `components/CompetitionCard.jsx`؛ تعديل `pages/Home.jsx` (استبدال البطاقة الوهمية بالمكوّن الحقيقي).
- docs: `13_CHANGE_LOG.md`, `12_AI_MEMORY.md`, `06_APIs.md`, `03_Database.md`, `05_Frontend.md`.

### قاعدة البيانات
- **نموذج جديد `Competition`** (لا يمسّ أي نموذج قائم): `title, description, image, minPoints, pointsPerEntry, requiredParticipants, location, startDate, endDate, isFeatured, status(draft|active|ended), participants[{user, entriesCount, pointsSpent, joinedAt}], totalEntries, createdBy` + virtual `participantsCount`. **إضافة غير كاسرة** (collection جديدة).

### Backend (مسارات `/api/competitions`)
- عام/عميل: `GET /featured` (auth — يُرجع المسابقة المميّزة + نقاط المستخدم)، `GET /`، `GET /:id`، `POST /:id/join` (auth — يتحقّق التأهّل والنقاط، يخصم النقاط، يضيف/يزيد المشاركة، يزيد `totalEntries`).
- أدمن (auth + role admin): `GET /admin/all`، `POST /`، `PUT /:id`، `DELETE /:id`، `PATCH /:id/feature` (تعيين مسابقة رئيسية واحدة وإلغاء تمييز البقية).
- الخصم والتحقق **موثوقان على الخادم** (لا يُعتمد على الواجهة).

### Frontend
- **Admin:** صفحة `Competitions` CRUD كاملة (إنشاء/تعديل/حذف + تعيين رئيسية) متصلة بالـ API.
- **Customer:** `CompetitionCard` يعرض الصورة/الاسم/الوصف/الحد الأدنى/المشاركين/شريط التقدّم/العدّاد التنازلي/المكان/تاريخ البداية، مع منطق التأهّل (نقاط ناقصة أو زر "انضم الآن")، ونافذة انضمام تختار عدد المشاركات وتحسب التكلفة وتعرض Animation نجاح.

### الاختبار (End-to-End حي)
على البيئة الحيّة (admin :5174، customer :5173، backend :5000): أدمن أنشأ مسابقة مميّزة → ظهرت في الصفحة الرئيسية للزبون → منح نقاط للزبون عبر `update-manual` → الزبون انضم → خُصمت النقاط (10) → ثبتت المشاركة بعد إعادة التحميل. **PASS** بلا أخطاء console.

### التوافق مع الإصدارات السابقة
متوافق خلفياً بالكامل. لا تعديل على أي نموذج/مسار قائم (إضافات فقط). نظام Draw/Entries لم يُمَس (AD-002/AD-012).

---

## [0.6.0] - 2026-06-30 — TASK-001 / المرحلة 1: ربط الصفحة الرئيسية بالـ Backend (عروض حقيقية)
### السبب
الصفحة الرئيسية للزبون كانت تعرض **بيانات وهمية بالكامل** (مصفوفة `restaurantOffers` مكرّرة 4×، تصنيفات ثابتة، بطاقة سحب ثابتة). المطلوب جعل بياناتها حقيقية قادمة من قاعدة البيانات (ضمن سبرنت TASK-001، حسب ترتيب AD-001).

### النطاق (مُلتزَم بالترتيب المعتمد)
مصدر البيانات الحقيقي الوحيد المتاح حالياً للصفحة هو **العروض** (`GET /api/offers`). لذلك رُبطت شبكة "أحدث العروض" ببيانات حقيقية، مع **إبقاء** بطاقة المسابقة (المرحلة 2) وشريط التصنيفات (المرحلة 3) والبحث/التحميل الكسول (المرحلة 4) كعناصر مؤقتة (placeholders) تُبنى في مراحلها المخصّصة — تفادياً لبناء ميزات جديدة قبل أوانها.

### الملفات المتأثرة
- frontend (customer): `customerFrontend/src/pages/Home.jsx` (إعادة كتابة قسم العروض ليجلب من الـ API).
- docs: `13_CHANGE_LOG.md`, `12_AI_MEMORY.md`, `05_Frontend.md`.

### Frontend
- `Home.jsx`: استدعاء `GET /api/offers` عبر `api` (axios) داخل `useEffect`، مع حالات **تحميل (skeleton)** و**خطأ** و**فارغ** و**عرض**.
- فرز "أحدث العروض" تنازلياً حسب `createdAt` وعرض أحدث 8 (الفرز/التحميل الكسول الكامل لاحقاً في المرحلة 4).
- تعيين الحقول الحقيقية: `title`, `store.name`, `store.region`, `image` (مع بديل عند غيابها)، وشارة من `offerType`/`value` (دالة `getOfferBadge` — مرشّحة لـ Shared Service لاحقاً حسب AD-009).
- إزالة بيانات الـ rating/points الوهمية (لا مصدر حقيقي لها)؛ الانتقال إلى `/offer/:_id` بمعرّف Mongo حقيقي؛ زر "مشاهدة الكل" → `/marketplace`.

### Backend / قاعدة البيانات
لا تغيير. (استُهلك المسار العام الموجود `GET /api/offers` كما هو.)

### الاختبار (End-to-End حي)
على البيئة الحيّة (Customer :5173 مع HMR + Backend :5000): `GET /api/offers` أعاد **200** وعرضاً واحداً ("جناح دجاج" — متجر "الفيومي للحوم" — Gaza — شارة "10 ₪")، ظهر كبطاقة حقيقية دون أخطاء console. **النتيجة: PASS**.

### التوافق مع الإصدارات السابقة
متوافق خلفياً بالكامل. لا تغيير على الـ Backend/DB ولا على الواجهات الأخرى. (تغيير عرضي في واجهة الزبون فقط.)

---

## [0.5.0] - 2026-06-30 — TASK-001 / المرحلة 0: إصلاح إنشاء الحساب
### السبب
عند إنشاء حساب جديد من Customer Frontend كانت تظهر رسالة "المسار غير موجود"، بينما ينجح نفس الطلب عبر Postman. المطلوب تحديد السبب الجذري وإصلاحه (ضمن سبرنت TASK-001 المعتمد).

### السبب الجذري (Root Cause)
عدم تطابق المسار (Path Mismatch) بين الواجهة والـ Backend — **وليس** مشكلة Axios أو Proxy أو CORS أو عنوان الـ API:
- الواجهة كانت ترسل `POST /auth/register` (مسار غير معرّف ⇒ 404).
- الـ Backend يعرّف فقط `POST /auth/register-customer` و`POST /auth/register-business`.
- لذلك Postman كان ينجح (لأنه يستدعي المسار الصحيح) بينما الواجهة تفشل.

### الملفات المتأثرة
- frontend (customer): `customerFrontend/src/pages/Register.jsx` (سطر استدعاء التسجيل فقط).
- docs: `13_CHANGE_LOG.md`, `12_AI_MEMORY.md`, **جديد** `PROJECT_DECISIONS.md` (في جذر المشروع).

### Frontend
- تغيير نقطة النهاية في `handleRegister` من `/auth/register` إلى `/auth/register-customer` (تطابق العقد الفعلي للـ Backend). لا تغيير في شكل البيانات المُرسَلة (`name, email, phone, password`) لأن `registerCustomer` يقبلها كما هي.

### Backend / قاعدة البيانات
لا تغيير.

### الاختبار (End-to-End حي)
تم اختبار التدفق فعلياً على البيئة المحلية الحيّة (Backend :5000 + MongoDB متصل + Customer :5173 مع HMR):
- إنشاء حساب باسم/بريد/هاتف اختباري ⇒ الطلب ذهب إلى `http://localhost:5000/api/auth/register-customer`.
- استُلم Token وحُفظ في `localStorage` ⇒ تمت إعادة التوجيه من `/register` إلى الصفحة الرئيسية `/` بحالة "مُسجَّل الدخول".
- لا توجد أي رسالة خطأ. **النتيجة: PASS**.

### التوافق مع الإصدارات السابقة
متوافق خلفياً بالكامل. لا كسر توافق (تصحيح مسار خاطئ فقط). لا تأثير على Store/Supplier Frontend ولا Admin Panel ولا الـ Backend.

### ملاحظة خارج النطاق (مُسجَّلة — لم تُصلَح)
ظهر في سجل الـ Backend سطر قديم `Error: Cannot find module 'qrcode'` (من تشغيل سابق). الخادم يعمل حالياً بشكل طبيعي على :5000، لكن يُحتمل وجود اعتماد `qrcode` ناقص يُستدعى في مسار ما. سُجِّلت للمراجعة دون إصلاح (التزاماً بقاعدة عدم التعديل خارج نطاق المهمة).

---

## [0.4.0] - 2026-06-30
### السبب
تحسينات 🟢 (المرحلة الثالثة: الأخضر) — تنظيف وكود أنظف وتجربة أفضل، دون تغيير سلوك وظيفي.

### الملفات المتأثرة
- backend: **حذف** `src/routes/Dashboardstorer.routes.js` (ميّت)؛ `server.js` (404 + معالج أخطاء مركزي).
- frontend: `customerFrontend/src/api/axios.js`, `store-supplier-frontend/src/services/api.js`, `admin-panelFrontend/src/api/axios.js` (VITE_API_URL + معالجة 401).
- جذر المشروع: **جديد** `.gitignore`.
- docs: `15_BUGS.md`, `14_TODO.md`, `04_Backend.md`, `05_Frontend.md`, `12_AI_MEMORY.md`.

### Backend
- **G1:** حذف `Dashboardstorer.routes.js` (كان يستورد `getStoreAnalytics` غير الموجودة وغير مُسجَّل) — BUG-009.
- **G2:** إضافة معالج 404 موحّد + **معالج أخطاء مركزي** يلتقط الأخطاء غير المعالَجة وأخطاء CORS ويُرجع JSON موحّداً.

### Frontend
- **G3:** عنوان الـ API صار `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'` في الواجهات الثلاث (قابل للتهيئة دون كسر التطوير).
- **G4:** معالجة **401 موحّدة** في كل interceptors: تنظيف الجلسة وإعادة التوجيه إلى `/login` (مع حارس يمنع حلقة التوجيه على صفحة الدخول).

### DevOps
- **G5:** `.gitignore` في الجذر (node_modules, .env, dist/build, logs, ملفات المحرر/النظام) — يمنع تكرار مشكلة رفع `node_modules`.

### قاعدة البيانات
لا تغيير.

### التوافق
متوافق خلفياً بالكامل. (السلوك الوظيفي كما هو؛ التحسينات إضافية.)

### مؤجّل (معماري أكبر — `14_TODO.md`)
- طبقة خدمات (Service Layer)، إصدار API (`/api/v1`)، `helmet`، Docker/CI/CD، code-splitting، دمج `cardType.controller` مع `box-admin.controller`، تفعيل إشعارات `monitorOffers` الفعلية.

---

## [0.3.0] - 2026-06-30
### السبب
معالجة أخطاء 🟡 Medium المرصودة في `15_BUGS.md` (المرحلة الثانية: الأصفر).

### الملفات المتأثرة
- backend (controllers): `user.controller.js`, `store.controller.js`, `treasure.controller.js`, `promo-code.controller.js`, `activation.controller.js`, `auth.controller.js`.
- backend (models): `cardType.js`, `ActivationCode.js`؛ **حذف** `activationCodeBusiness.js` (مكرّر ميّت).
- backend (routes/middleware/server): `auth.routes.js`, جديد `middleware/rateLimit.middleware.js`, `server.js`, `.env`.
- docs: `15_BUGS.md`, `12_AI_MEMORY.md`, `08_Security.md`, `03_Database.md`, `04_Backend.md`, `14_TODO.md`.

### قاعدة البيانات
- **CardType:** إضافة حقل `price` (افتراضي 0) + خاصية افتراضية `points` كاسم بديل لـ `pointsValue` (للتوافق مع الفرونت). **متوافق خلفياً**.
- **ActivationCode:** إضافة `prefix` اختياري؛ توحيد كل أكواد التفعيل في موديل واحد (حُذف الموديل المكرّر).

### Backend
- **M2 (BUG-007):** توحيد استيراد موديل المستخدم `const User` بدل `const user` في 4 متحكمات (كان يسبب `ReferenceError`).
- **M3 (BUG-006):** `createStoreActivationCode` يستخدم الحقل الصحيح `role` (بدل `type`) مع تحقق من النوع؛ وأُزيلت نسخة `activateStore` المكرّرة المعطوبة من `store.controller`.
- **M1 (BUG-005):** توحيد حقول البطاقة — الفرونت الحيّ يرسل `price`/`points`، ومنطق الزبون يقرأ `pointsValue`؛ صار النموذج يدعم الثلاثة دون كسر.
- **M8 (BUG-008):** حذف الموديل المكرّر `activationCodeBusiness.js` الذي كان يسجّل نفس اسم الموديل (لغم `OverwriteModelError`).
- **M10 (BUG-010):** إضافة `GOOGLE_CLIENT_ID` و `MASTER_KEY` إلى `.env`، و**تصليب** `resetAdminPassword` (كان `undefined !== undefined` يسمح بتجاوز التحقق إن غاب المفتاح).
- **M4:** CORS صار allowlist عبر `CORS_ORIGINS` (مفتوح في التطوير عند غيابه).
- **M6:** محدّد معدّل (rate limit) على مسارات `/api/auth` (20 طلب/15 دقيقة لكل IP) عبر middleware داخلي بلا تبعيات.
- **M7 (جزئي) + تسريب أمني:** تحقق مدخلات على تسجيل الزبون والدخول (طول كلمة المرور، صيغة البريد)، و**إزالة تسريب hash كلمة المرور** من ردود `login`/`register*`/`google`. توحيد توكن Google ليحمل `role`.

### Frontend
لا تغيير. (الفرونت الحيّ `PromoCodes.jsx` يبقى يعمل لأن النموذج صار يُرجع `points`/`price`.)

### التوافق
- ⚠️ **register/login**: كلمة مرور الزبون الجديدة يجب أن تكون ≥ 6 أحرف، ويجب بريد أو هاتف. (لا يؤثر على الحسابات القائمة.)
- ⚠️ ردود المصادقة لم تعد تحتوي `password`.
- باقي التغييرات إضافية/متوافقة خلفياً.

### مؤجّل (يتطلب عملاً أكبر — موثّق في `14_TODO.md`)
- **M5:** نقل JWT من `localStorage` إلى httpOnly cookies (يمسّ المواقع الثلاثة + الباك).
- **M11:** Pagination للقوائم + فهارس قاعدة بيانات.
- **M7 كامل:** طبقة تحقق موحّدة (Joi/express-validator) لكل المسارات.

---

## [0.2.1] - 2026-06-30
### السبب
قرار صاحب المشروع: **اعتماد نظام "إنفاق عدّة فرص لزيادة الحظ" في السحوبات** (تأكيد للقرار المعلّق في v0.2.0)، واستكمال حلقة إعلان الفائزين.

### الملفات المتأثرة
- `backend/src/models/drawBatch.js`: إضافة `participants[].entriesCount` و `totalEntries`.
- `backend/src/controllers/draw.controller.js`: `joinDraw` يقبل `entriesToSpend` ويُراكم الفرص.
- `backend/src/controllers/admin/admin.controller.js`: `approveDraw` يضبط `adminApproval`، وإضافة `drawWinners` (اختيار مُرجَّح حسب الفرص).
- `backend/src/routes/admin/admin.routes.js`: مسار `POST /api/admin/draws/:drawId/draw-winners`.
- docs: `06_APIs.md`, `07_Business_Logic.md`, `03_Database.md`, `12_AI_MEMORY.md`.

### قاعدة البيانات
- **DrawBatch:** إضافة `participants[].entriesCount` (افتراضي 1) و `totalEntries` (افتراضي 0). **متوافق خلفياً**.

### Backend
- المشاركة: `POST /api/draws/join` يقبل `{ drawId, entriesToSpend }` (افتراضي 1). يخصم الفرص من `entriesWallet`، ويراكم فرص المستخدم على نفس السحب.
- إعلان الفائزين: `POST /api/admin/draws/:drawId/draw-winners` يختار الفائزين **عشوائياً بترجيح حسب عدد الفرص**، بعدد = مجموع كميات الجوائز، بلا تكرار للفائز، ثم يضبط الحالة `completed`.

### Frontend
لا تغيير (صفحات السحوبات في الزبون والأدمن لا تزال بيانات تجريبية غير موصولة بالـ API).

### التوافق
متوافق خلفياً (إضافات حقول + مسار جديد). لا كسر.

---

## [0.2.0] - 2026-06-30
### السبب
معالجة كل الأخطاء المصنّفة 🔴 Critical المرصودة في `15_BUGS.md` (المرحلة الأولى من الإصلاح: الأحمر).

### الملفات المتأثرة
- backend:
  - `src/utils/logger.js`، `src/controllers/admin/admin.controller.js`، `src/routes/cart.routes.js`، `src/routes/order.routes.js`، `src/routes/admin/admin.routes.js`، `src/routes/product.routes.js`، `src/routes/promo.routes.js` (إصلاح مسارات require).
  - `src/routes/admin/admin.routes.js` (تطبيق حماية الدور admin على كل المسارات).
  - `src/routes/promo.routes.js` (حماية `/create` بدور).
  - `src/models/user.js` (إضافة `storesEnergyClaimed`).
  - `src/controllers/chat.controller.js` (إزالة تسريب `err.stack`).
  - `server.js` + `.env` (بيانات الأدمن من البيئة).
  - `src/controllers/draw.controller.js`، `src/routes/draw.routes.js`، `src/models/drawBatch.js` (مواءمة السحوبات + إزالة التصويت).
- frontend: لا تغيير.
- docs: تحديث `15_BUGS.md`, `12_AI_MEMORY.md`, `08_Security.md`, `06_APIs.md`, `07_Business_Logic.md`, `03_Database.md`, `04_Backend.md`.

### قاعدة البيانات
- **User:** إضافة حقل `storesEnergyClaimed: [ObjectId ref Store]` (إضافي، **متوافق خلفياً** — يبدأ فارغاً).
- **DrawBatch:** تفعيل `toJSON/toObject virtuals` (لإظهار `currentCount`). لا تغيير في الحقول.

### Backend
- **C1:** `admin.routes.js` الآن `router.use(authMiddleware)` ثم `router.use(roleMiddleware(["admin"]))` → كل مسارات الأدمن محمية بالدور (أُغلقت ثغرة تصعيد الصلاحيات).
- **C2:** توحيد حالة الأحرف في 7 مسارات `require` (لن يتعطّل على Linux).
- **C3:** `draw.controller` أُعيدت كتابته ليطابق نموذج `DrawBatch`؛ **أُزيل التصويت** (`voteLocation` + مسار `/vote`)؛ المشاركة الآن: تحقق رتبة + منع تكرار + تكلفة فرصة واحدة.
- **C4:** إصلاح خطأ تشغيل استرداد الكود المرتبط بمتجر (الحقل أصبح موجوداً).
- **C5:** `seedAdmin` يقرأ `ADMIN_EMAIL`/`ADMIN_PASSWORD` من `.env` ويتخطّى الإنشاء إن غابا (لا كلمة مرور في الكود).
- **C6:** استجابة خطأ المحادثة لم تعد تكشف `stack`.
- **C7:** `POST /api/promo/create` يتطلب دور `store/supplier/admin`.

### Frontend
لا تغيير. (صفحة الزبون `Draws.jsx` تستخدم بيانات تجريبية ثابتة ولا تتصل بالـ API، فلم تتأثر.)

### التوافق مع الإصدارات السابقة (Breaking Changes)
- ⚠️ **مسارات `/api/admin/*`**: أصبحت كلها تتطلب دور `admin`. أي استدعاء كان يعتمد (بالخطأ) على وصول غير-أدمن سيتوقف — وهذا هو السلوك الصحيح المقصود. واجهة الإدارة (مستخدمها admin) لا تتأثر.
- ⚠️ **`POST /api/promo/create`**: لم يعد متاحاً للزبائن.
- ⚠️ **السحوبات**: أُزيل مسار `POST /api/draws/vote`. تغيّر عقد `POST /api/draws/join` (يرسل `drawId` فقط، التكلفة فرصة واحدة) — لا مستهلك فعلي حالياً في الفرونت.
- باقي التغييرات متوافقة خلفياً.

### قرار عمل مسجّل (يحتاج تأكيد لاحق)
تكلفة المشاركة في السحب حُدِّدت بـ **فرصة واحدة (entry)** ومشاركة واحدة لكل مستخدم (بدل نظام "إنفاق عدة فرص" غير المكتمل سابقاً). يمكن مراجعته إن أراد صاحب المشروع نظام ترجيح بعدد الفرص.
