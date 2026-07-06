# 05 — الواجهات الأمامية (Frontend)

> ثلاث واجهات React مستقلة، كلها تستهلك نفس الـ Backend. كل واحدة تُبنى وتُنشر منفصلة.

---

## 1. القواسم المشتركة بين الواجهات الثلاث

- مبنية بـ **Vite + React** (SPA).
- تستخدم **axios** مع `baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'` (مُحدَّث v0.4.0 — قابل للتهيئة عبر `.env`).
- **Interceptor** يضيف `Authorization: Bearer <token>` من `localStorage` تلقائياً لكل طلب.
- المصادقة تُحفظ في `localStorage` (`token` + `user`).
- حماية المسارات عبر مكوّن `ProtectedRoute` يقرأ `token`/`user` من `localStorage`.

> ⚠️ تخزين الـ JWT في `localStorage` يعرّضه لهجمات XSS. مسجّل في `08_Security.md`.

---

## 2. واجهة الزبون — customerFrontend

- **التقنيات:** React 18, Vite 5, Tailwind, framer-motion, swiper, react-router 6.
- **الدخول:** `main.jsx` يلفّ `App` بـ `AuthProvider`.
- **إدارة الحالة:** `AuthContext` يوفّر `{ user, token, login, logout, loading, isAuth, role }`.
- **الراوتر (`App.jsx`):**
  - مسارات عامة: `/intro`, `/login`, `/register`, `/explore`, `/marketplace`, `/store/:id`, `/offer/:id`.
  - مسارات محمية (`ProtectedRoute`): `/draws`, `/wheel`, `/personalization`, `/chests`, `/honor`, `/inventory`, `/wallet`, `/profile`, `/spinWheel`, `/favorites`, `/chat`, `/chat/:convId`.
  - المكوّنات `Header`, `BottomNav`, `FloatingCodeButton` تظهر فقط عند `isAuth`.
  - التوجيه الأول: زائر جديد → `/intro`، مسجّل → `/`، غير ذلك → `/login`.
- **الواجهة:** RTL، خط Cairo، تصميم موجّه للهاتف (شريط سفلي).

### الصفحات
Intro, Home, Login, Register, Explore, Marketplace, StoreDetail, OfferDetail, Draws, LuckyWheel/SpinWheel, Wallet, TreasureChests, HonorBoard, Inventory, Profile, Personalization.

### حالة ربط الصفحات بالـ Backend (TASK-001)
- ✅ **Register** (v0.5.0): يستدعي `POST /auth/register-customer` الصحيح.
- ✅ **Home** (v0.6.0): قسم "أحدث العروض" يجلب من `GET /api/offers`. (شريط التصنيفات placeholder حتى Phase 3؛ البحث/الكسول حتى Phase 4.)
- ✅ **بطاقة المسابقة** (v0.7.0): `components/CompetitionCard.jsx` يجلب `GET /api/competitions/featured` ويتيح الانضمام بإنفاق نقاط. وفي الأدمن: `pages/Competitions.jsx` (CRUD كامل + تعيين رئيسية).
- ✅ **الفلاتر** (v0.8.0): `Home.jsx` يعرض تصنيفات هرمية (`/api/categories/tree`) + مناطق (`/api/regions`) ويصفّي العروض. الأدمن: `Categories.jsx` (هرمي) + `Regions.jsx`.
- ✅ **عرض العروض + البحث + الكسول** (v0.9.0): `Home.jsx` يستخدم `GET /api/offers/feed` (Infinite Scroll + بحث) ويعرض `OfferCard.jsx` (زرّا للسلة/التفاصيل).
- ✅ **تفاصيل العرض + المحادثة** (v0.10.0): `OfferDetail.jsx` (بيانات حقيقية + للسلة + تواصل)؛ **واجهة محادثة جديدة للزبون**: `Chat.jsx` (صندوق)، `ChatConversation.jsx` (محادثة)، مسارات `/chat` و`/chat/:convId`. زر "تواصل" يفتح المحادثة ويرسل رابط العرض تلقائياً.
- ✅ **التوصيات + النشاط + المفضّلة** (v0.12.0): `utils/activity.js` (helper موحّد لـ `/api/activity`). `Home.jsx` يعرض صف "موصى لك" (يختفي أثناء البحث) ويسجّل عبارة البحث. `OfferDetail.jsx` يسجّل `open_offer` ويحوي زر مفضّلة، و`StoreDetail.jsx` يسجّل `visit_store` بصمت. `OfferCard.jsx` يحوي زر قلب اختياري (props: `favorited`/`onToggleFavorite` — لا يظهر إن لم تُمرَّر). صفحة `/favorites` جديدة + أيقونة مفضّلة في `Header`.

### تطبيق المتجر/المورّد (store-supplier-frontend) — v0.11.0
- ✅ **إدارة العروض** (`pages/storeOwner/OffersManager.jsx`): متصلة بـ `/offers/my?all=true` مع حالة دورة الحياة + تجديد/إيقاف (كانت وهمية وغير موجّهة).
- ✅ **الإشعارات** (`pages/Notifications.jsx`): قائمة `/api/notifications` + تعليم كمقروء؛ جرس بشارة غير المقروء في `DashboardLayout`. مسارات `/store|supplier/offers` و`/notifications`.
- ⏳ **OfferDetail / Draws / Explore / Marketplace** وغيرها: ما زالت تستخدم بيانات تجريبية وتُربط في مراحلها المخصّصة لاحقاً.

---

## 3. واجهة المتاجر/الموردين — store-supplier-frontend

- **التقنيات:** React **19**, Vite **8**, react-router **7**, ESLint. (أحدث إصدار بين الواجهات.)
- **الراوتر (`App.jsx`):** قسمان متطابقان في الصفحات:
  - `/store/*` (محمي بـ `allowedRoles={["store"]}`).
  - `/supplier/*` (محمي بـ `allowedRoles={["supplier"]}`).
  - كلاهما داخل `DashboardLayout` ويضمّان نفس الصفحات.
  - `ProtectedRoute` يوجّه غير المصرّح إلى `/not-authorized`.
- **الخدمات:** `services/` مقسّمة (`api`, `auth.service`, `cart.service`, `offers.service`, `products.service`) — تنظيم أفضل من بقية الواجهات.
- **الحالة:** `StoreContext` بسيط (قائمة منتجات in-memory — يبدو مبدئياً/تجريبياً).
- **مساعدات:** `utils/auth.js` (`setAuth/getUser/getRole/logout`).

### الصفحات
storeOwner/(DashboardHome, AddProductsOffers, Products, OffersManager), MyStore, Orders, Chats, Cart, Competitions, BuyCodes, Warehouses, WarehouseDetail, ItemDetails, Support, Profile, not-authorized.

> ملاحظة: المتجر والمورد يتشاركان نفس الصفحات؛ الفرق منطقي (الدور) وفي بيانات الـ API (مثل warehouses للموردين).

---

## 4. واجهة الإدارة — admin-panelFrontend

- **التقنيات:** React 18, Vite 5, Tailwind, axios, react-qr-code, xlsx, react-router 6.
- **الهيكل:** `api/axios.js`, `components/(Sidebar, AdminHeader, AdminLayout, ProtectedRoute)`, وصفحات الإدارة.
- **الصفحات:** Dashboard, Users, Stores, Categories, Draws, Prizes, PromoCodes, CodeGeneratorPage, HonorManagement, CardManagement, BoxManagement, SecurityLogs, Settings, Activity, Login.
- **الميزات الخاصة:** توليد أكواد QR (react-qr-code) وتصدير Excel (xlsx) في صفحة توليد الأكواد.

> 🔴 **قيد التوثيق:** بسبب وجود `node_modules` داخل `admin-panelFrontend/src` تعذّرت القراءة العميقة لمنطق صفحات الأدمن وقت كتابة هذا الملف. التفاصيل أعلاه على مستوى الهيكل والتبعيات؛ يجب التحقق من منطق الصفحات لاحقاً وتحديث هذا الملف (راجع `12_AI_MEMORY.md` و `14_TODO.md`).

---

## 5. تدفق المصادقة في الواجهات

```
Login form → POST /api/auth/login (مع appType) → { token, user }
   → حفظ في localStorage
   → AuthContext.login() (في customer) أو setAuth() (في store)
   → axios interceptor يرفق التوكن تلقائياً
   → ProtectedRoute يسمح بالوصول حسب الدور
```

---

## 6. نقاط القوة ونقاط الضعف

**القوة:**
- فصل نظيف لكل واجهة حسب الجمهور.
- نمط axios + interceptor موحّد وبسيط.
- واجهة المتاجر منظّمة الخدمات (services layer).
- تصميم الزبون حديث (Tailwind + framer-motion + RTL).

**الضعف / للتطوير المستقبلي (مسجّل فقط):**
- ✅ (v0.4.0) عنوان الـ API صار عبر `VITE_API_URL` (مع احتياطي محلي) في الواجهات الثلاث.
- تخزين JWT في `localStorage` (عرضة لـ XSS).
- تفاوت إصدارات React/Vite/Router بين الواجهات يصعّب مشاركة الكود.
- `ProtectedRoute` يعتمد على `user.role` المخزّن محلياً (يمكن للمستخدم العبث به في المتصفح) — الحماية الحقيقية يجب أن تبقى في الـ Backend.
- ✅ (v0.4.0) أُضيفت معالجة 401 موحّدة في الـ interceptors (تنظيف الجلسة + توجيه إلى `/login`).
- `customerFrontend` فيه `permissions.js` لكنه غير مستغَل بالكامل.
