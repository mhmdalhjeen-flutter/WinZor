# 04 — الـ Backend

> خادم Node.js / Express 5. نقطة الدخول `backend/server.js`.

---

## 1. الإقلاع (Bootstrapping) — `server.js`

تسلسل الإقلاع:
1. `dns.setServers(['8.8.4.4','8.8.8.8'])` — تثبيت DNS (حلٌّ لمشاكل الاتصال بـ Mongo Atlas على بعض الشبكات).
2. تحميل express, cors, dotenv, bcrypt.
3. استيراد كل ملفات الـ routes.
4. `dotenv.config()` لقراءة `.env`.
5. `app.use(cors())` — **مفتوح للجميع حالياً** (بلا قيود origin).
6. `app.use(express.json())` — تحليل JSON.
7. تسجيل المسارات تحت `/api` (انظر القسم 3).
8. `startServer()`: يتصل بـ DB → `seedAdmin()` → `monitorOffers()` + `setInterval` كل 24 ساعة → `app.listen(PORT)`.

> **ملاحظة أمنية (مُحدَّث v0.2.0):** `seedAdmin()` يقرأ بيانات الأدمن من `ADMIN_EMAIL`/`ADMIN_PASSWORD` في `.env` ويتخطّى الإنشاء إن غابا (لا كلمة مرور في الكود). راجع `08_Security.md`.

---

## 2. الإعدادات والبيئة (`.env`)

| المتغيّر | الاستخدام |
|---------|-----------|
| `MONGO_URI` | رابط اتصال MongoDB Atlas |
| `JWT_SECRET` | مفتاح توقيع/تحقق JWT |
| `PORT` | منفذ الخادم (افتراضي 5000) |
| `VITE_GOOGLE_CLIENT_ID` | معرّف Google OAuth |

> الكود يشير أيضاً إلى `process.env.GOOGLE_CLIENT_ID` (في `auth.controller`) و `process.env.MASTER_KEY` (في `resetAdminPassword`) — **غير معرّفين في `.env` الحالي** → ميزات Google reset قد لا تعمل كما هو متوقع. مسجّل في `15_BUGS.md`.

---

## 3. خريطة تسجيل المسارات (من `server.js`)

| البادئة | الملف | الوصف |
|---------|------|--------|
| `/api/auth` | auth.routes | تسجيل/دخول/google |
| `/api/users` | user.routes | الملف الشخصي + تبديل البطاقات |
| `/api/admin` | admin/admin.routes | كل عمليات الإدارة |
| `/api/stores` | store.routes | المتاجر + warehouses + follow |
| `/api/offers` | offer.routes | العروض |
| `/api/products` | product.routes | المنتجات + جملة + بحث |
| `/api/promo` | promo.routes | الأكواد الترويجية |
| `/api/draws` | draw.routes | السحوبات |
| `/api/chest` | chest.routes | الصندوق اليومي |
| `/api/honor` | honor.routes | لوحة الشرف |
| `/api/treasure` | treasure.routes | صناديق الكنز |
| `/api/activation` | activation.routes | تفعيل المتجر |
| `/api/card-types` | cardType.routes | أنواع البطاقات |
| `/api/code-orders` | codeOrder.routes | طلبات شراء الكروت |
| `/api/chats` | chat.routes | المحادثات |
| `/api/cart` | cart.routes | السلة + checkout |
| `/api/orders` | order.routes | الطلبات |

> غير مُسجَّل: `Dashboardstorer.routes.js` (كود ميّت).

---

## 4. الـ Middleware

### auth.middleware.js
يقرأ `Authorization: Bearer`، يتحقق من JWT، يجلب المستخدم (`-password`)، ويضع `req.user = { id, role, email }`.

### admin.middleware.js
نفس فكرة auth لكنه يتحقق أيضاً أن `user.role === "admin"`، ويضع `req.user = user` (كائن Mongoose كامل — اختلاف عن auth.middleware الذي يضع كائناً مبسّطاً).

> ⚠️ **تكرار منطق:** `auth.middleware` و `admin.middleware` يكرّران فك التوكن وجلب المستخدم. الأفضل تركيب `admin` فوق `auth`. كما أن شكل `req.user` يختلف بينهما (مبسّط مقابل كامل) مما قد يسبب التباساً.

### role.middleware.js
`roleMiddleware([...roles])` — يتحقق أن `req.user.role` ضمن القائمة. يجب أن يأتي **بعد** auth.middleware.

---

## 5. طبقة الـ Controllers (ملخص المسؤوليات)

| Controller | المسؤولية |
|-----------|-----------|
| `auth.controller` | registerCustomer, registerBusiness, login, resetAdminPassword, googleAuth |
| `user.controller` | getMe, updateProfile, redeemCard |
| `store.controller` | createStore, followStore, getStoreCustomers, getStoreById, getAllStores, activateStore |
| `product.controller` | إنشاء/جلب/بحث/حذف/تعديل المنتجات + جملة |
| `offer.controller` | إنشاء/جلب/حذف/تعديل العروض |
| `dashboard.controller` | getDashboard (إحصائيات المتجر) |
| `promo-code.controller` | redeemCode, redeemActivationCode, createPromoCode, getCodeStats |
| `cardType.controller` | CRUD لأنواع البطاقات |
| `box-admin.controller` | إدارة CardType + TreasureBox (مكرّر جزئياً مع cardType) |
| `codeOrder.controller` | طلب/تكوين/استلام/تصدير الكروت (Excel + QR) |
| `chest.controller` | openDailyChest |
| `treasure.controller` | getAvailableBoxes, openBox (محرّك احتمالات) |
| `draw.controller` | getOpenDraws, joinDraw, voteLocation, getMyDraws |
| `honor-board.controller` | getActiveHonorItems, addToHonorBoard, toggleStatus |
| `activation.controller` | activateStore, createStoreActivationCode |
| `admin/admin.controller` | إحصائيات، إدارة مستخدمين/متاجر/أكواد/سحوبات/إعدادات/سجلات |
| `admin/activationCodeBusiness.controller` | createCodeBusiness |
| `chat.controller` | getOrCreateConversation, getMyConversations, getMessages, sendMessage + فلتر كلمات |

---

## 6. أنماط متكررة في الكود (Conventions الحالية)

- كل دالة controller تستخدم `try/catch` وترجع JSON بـ `{ message }`.
- الرسائل بالعربية موجّهة للمستخدم النهائي.
- التحقق من الملكية شائع: `Store.findOne({ owner: req.user.id })` ثم مقارنة `store._id`.
- الحذف غالباً soft (`isActive = false`) للمنتجات/العروض، لكن **hard delete** للمتاجر والطلبات والمستخدمين (أدمن).

---

## 7. نقاط القوة ونقاط الضعف

**القوة:**
- مسارات منظّمة ومقسّمة حسب الوحدة.
- منطق ملكية واضح في أغلب العمليات.
- استخدام `Promise.all` في بعض الإحصائيات.
- ميزة تصدير أكواد QR إلى Excel متقدّمة وعملية (`codeOrder.controller`).

**الضعف / للتطوير المستقبلي (مسجّل فقط):**
- ✅ **(v0.2.0) حساسية حالة الأحرف في require** صُحِّحت في 7 مسارات (`ActivityLog`, `Cart`, `product.controller`, `promo-code.controller`) — لن تكسر Linux.
  - (سابقاً) `logger.js` و `admin.controller` → `../models/activityLog` (الملف `ActivityLog.js`).
  - `admin.routes` و `cart.routes` و `order.routes` → `../models/cart` (الملف `Cart.js`).
  - `product.routes` → `../controllers/product.Controller` (الملف `product.controller.js`).
  - `promo.routes` → `../controllers/promo-code.Controller`.
- ✅ **(v0.3.0) خطأ مرجعي:** كانت عدة controllers تكتب `const user = require(...)` ثم تستخدم `User` (غير معرّف) → `ReferenceError`. وُحِّد الاستيراد إلى `const User` في store/user/treasure/promo controllers.
- 🔴 **`activation.controller` و `store.controller.activateStore`** يستخدمان حقولاً/متغيّرات غير معرّفة (`type`, `ActivationCode` غير مستورد في store.controller).
- ✅ (v0.4.0) أُضيف معالج أخطاء مركزي + 404 موحّد في `server.js` (يلتقط الأخطاء غير المعالَجة وأخطاء CORS). يبقى: logging منظّم (حالياً console).
- 🟡 منطق كثير داخل ملفات الـ routes بدل الـ controllers.
- 🟡 لا يوجد إصدار للـ API (versioning مثل `/api/v1`).
