# 02 — هيكل المشروع (Project Structure)

> شرح تفصيلي لكل مجلد وملف مهم. الهدف أن تعرف "أين تجد كل شيء".

---

## 1. الجذر (Root)

```
offers-tech/
├── backend/                  ← الخادم وقاعدة البيانات
├── customerFrontend/         ← واجهة الزبون
├── store-supplier-frontend/  ← واجهة المتاجر/الموردين
├── admin-panelFrontend/      ← واجهة الإدارة
├── docs/                     ← التوثيق (هذا المجلد)
└── package.json              ← يحوي exceljs + qrcode فقط (أدوات مساعدة، ليس workspace رسمي)
```

> ملاحظة: لا يوجد إعداد Monorepo رسمي (لا workspaces). كل مشروع مستقل بـ `package.json` و `node_modules` خاصين.

---

## 2. الـ Backend

```
backend/
├── .env                      ← أسرار (MONGO_URI, JWT_SECRET, PORT, GOOGLE_CLIENT_ID) — مُتجاهَل في git ✅
├── .gitignore                ← يتجاهل node_modules/ و .env و dist/ و build/
├── package.json              ← scripts: dev (nodemon), start (node)
├── server.js                 ← نقطة الدخول: إعداد express، تسجيل المسارات، seedAdmin، monitorOffers
└── src/
    ├── config/
    │   └── db.js             ← الاتصال بـ MongoDB عبر Mongoose
    ├── models/               ← 21 نموذج (انظر 03_Database.md)
    ├── controllers/
    │   ├── *.controller.js   ← منطق العمل لكل وحدة
    │   └── admin/            ← controllers خاصة بالأدمن
    ├── routes/
    │   ├── *.routes.js       ← تعريف المسارات
    │   └── admin/admin.routes.js
    ├── middleware/
    │   ├── auth.middleware.js   ← التحقق من JWT + جلب المستخدم
    │   ├── admin.middleware.js  ← التحقق من JWT + أن الدور = admin
    │   └── role.middleware.js   ← التحقق أن الدور ضمن قائمة مسموحة
    └── utils/
        ├── logger.js         ← logActivity() → يكتب في ActivityLog
        └── offerMonitor.js   ← مهمة مراقبة العروض الدورية
```

### ملاحظات هيكلية مهمة على الـ Backend
- يوجد ملفان لنموذج أكواد التفعيل: `ActivationCode.js` و `activationCodeBusiness.js`، **وكلاهما يسجّل نفس الاسم** `mongoose.model("ActivationCode", ...)` → تضارب محتمل (راجع `15_BUGS.md`).
- ملف route غير مستخدم: `Dashboardstorer.routes.js` يستورد دالة غير موجودة (`getStoreAnalytics`) وغير مُسجَّل في `server.js` (كود ميّت).
- يوجد controllers مكرّرة الوظيفة: `cardType.controller.js` و `box-admin.controller.js` كلاهما يدير CardType/Box بحقول مختلفة.

---

## 3. واجهة الزبون — customerFrontend

```
customerFrontend/
├── .env                      ← VITE_GOOGLE_CLIENT_ID
├── package.json              ← React18, Vite5, Tailwind, framer-motion, swiper
├── vite.config.js
└── src/
    ├── main.jsx              ← يلفّ App بـ AuthProvider
    ├── App.jsx               ← كل المسارات (BrowserRouter + Routes)
    ├── api/axios.js          ← axios instance (baseURL localhost:5000/api + token interceptor)
    ├── context/AuthContext.jsx  ← حالة المصادقة (user, token, login, logout, isAuth, role)
    ├── services/authService.js  ← logout helper
    ├── auth/permissions.js   ← خريطة صلاحيات (PERMISSIONS) — معرّفة لكن استخدامها محدود
    ├── routes/ProtectedRoute.jsx ← حماية المسارات حسب token + allowedRoles
    ├── components/           ← Header, BottomNav, FloatingCodeButton, GiftModal
    └── pages/                ← Intro, Home, Login, Register, Explore, Marketplace,
                                StoreDetail, OfferDetail, Draws, LuckyWheel, Wallet,
                                TreasureChests, HonorBoard, Inventory, Profile, Personalization
```

---

## 4. واجهة المتاجر/الموردين — store-supplier-frontend

```
store-supplier-frontend/
├── package.json              ← React19, Vite8, react-router 7, eslint  (أحدث إصدارات من البقية)
├── vite.config.js
├── README.md                 ← قالب Vite الافتراضي (غير مخصّص)
└── src/
    ├── main.jsx
    ├── App.jsx               ← مسارات /store/* و /supplier/* (نفس الصفحات لكلا الدورين)
    ├── services/
    │   ├── api.js            ← axios instance
    │   ├── auth.service.js
    │   ├── cart.service.js
    │   ├── offers.service.js
    │   └── products.service.js
    ├── context/StoreContext.jsx  ← حالة محلية للمنتجات (بسيطة، in-memory)
    ├── utils/auth.js         ← setAuth/getUser/getRole/logout (localStorage)
    ├── routes/ProtectedRoute.jsx
    ├── layouts/              ← DashboardLayout, AuthLayout
    ├── components/           ← Sidebar, Topbar
    ├── auth/                 ← Login.jsx, Register.jsx
    └── pages/
        ├── storeOwner/       ← DashboardHome, AddProductsOffers, Products, OffersManager
        └── *.jsx             ← MyStore, Orders, Chats, Cart, Competitions, BuyCodes,
                                Warehouses, WarehouseDetail, ItemDetails, Support, Profile,
                                not-authorized
```

> ملاحظة: واجهة المتاجر تستخدم **React 19 / Vite 8 / react-router 7**، بينما الواجهتان الأخريان على **React 18 / Vite 5 / react-router 6**. هذا تفاوت في الإصدارات يجب الانتباه له عند نقل المكوّنات بين الواجهات.

---

## 5. واجهة الإدارة — admin-panelFrontend

```
admin-panelFrontend/
├── package.json              ← React18, Vite5, Tailwind, axios, react-qr-code, xlsx, react-router 6
├── vite.config.js
└── src/
    ├── (main.jsx / App.jsx)  ← نقطة الدخول والراوتر
    ├── api/axios.js          ← axios instance (نفس النمط)
    ├── components/           ← Sidebar, AdminHeader, AdminLayout, ProtectedRoute
    └── pages/                ← Dashboard, Users, Stores, Categories, Draws, Prizes,
                                PromoCodes, CodeGeneratorPage, HonorManagement,
                                CardManagement, BoxManagement, SecurityLogs, Settings, Activity, Login
```

> 🔴 **مشكلة هيكلية:** يوجد مجلد `node_modules` **بداخل** `admin-panelFrontend/src/` (في غير مكانه الصحيح — يجب أن يكون في جذر `admin-panelFrontend/`). هذا يضخّم البحث ويعطّل أدوات الفهرسة وقد يربك أدوات البناء. مسجّل في `15_BUGS.md` و `14_TODO.md`.
>
> بسبب هذه المشكلة تعذّرت القراءة العميقة لمنطق صفحات الأدمن وقت إنشاء هذا التوثيق؛ المعلومات هنا على مستوى الهيكل، ويجب التحقق من تفاصيل الصفحات لاحقاً (راجع `12_AI_MEMORY.md`).

---

## 6. أين أجد كل شيء؟ (مرجع سريع)

| أريد أن... | اذهب إلى |
|-----------|----------|
| أضيف نقطة نهاية API | `backend/src/routes/` + `backend/src/controllers/` |
| أعدّل بنية بيانات | `backend/src/models/` |
| أغيّر صلاحيات الوصول | `backend/src/middleware/` + ترتيب الـ middleware في الـ route |
| أضيف صفحة للزبون | `customerFrontend/src/pages/` + `App.jsx` |
| أضيف صفحة للمتجر | `store-supplier-frontend/src/pages/` + `App.jsx` |
| أضيف صفحة للأدمن | `admin-panelFrontend/src/pages/` + الراوتر |
| أغيّر عنوان الـ API | `*/src/api/axios.js` أو `*/src/services/api.js` |
