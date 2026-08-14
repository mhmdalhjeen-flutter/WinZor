# 02 — هيكل المشروع (Project Structure)

> شرح تفصيلي لكل مجلد وملف مهم. الهدف أن تعرف "أين تجد كل شيء".

---

## 1. الجذر (Root)

```
offers-tech/
├── backend/                  ← الخادم وقاعدة البيانات
├── customer/                 ← واجهة الزبون (PWA)
├── adminstore/               ← واجهة المتاجر/الموردين (PWA)
├── admin/                    ← واجهة الإدارة الإنتاجية (PWA)
├── delivery/                 ← واجهة شركات التوصيل والسائقين (PWA)
├── docs/                     ← التوثيق (هذا المجلد)
└── package.json              ← أدوات مساعدة في الجذر (exceljs + qrcode)
```

> **Legacy folder names:** `customerFrontend`, `store-supplier-frontend`, `admin-panelFrontend` — see `REPOSITORY_STRUCTURE.md` and `DEPRECATED_admin-panelFrontend.md`.

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

## 3. واجهة الزبون — `customer/`

```
customer/
├── .env.example              ← VITE_API_URL, OAuth keys
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx              ← ErrorBoundary + PersistQueryClientProvider
    ├── App.jsx               ← المسارات
    ├── api/axios.js
    ├── context/              ← Auth, Checkout, DeliverySession, …
    ├── shared/ErrorBoundary.jsx
    ├── components/
    └── pages/                ← Marketplace, StoreDetail, Orders, Chats, …
```

---

## 4. واجهة المتاجر/الموردين — `adminstore/`

```
adminstore/
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx               ← مسارات /store/* و /supplier/*
    ├── services/api.js       ← axios instance
    ├── shared/ErrorBoundary.jsx
    ├── pages/                ← Orders, OrderDetails, DashboardHome, …
    └── components/
```

---

## 5. واجهة الإدارة — `admin/` (canonical)

```
admin/
├── package.json              ← React 18, Vite 5, Tailwind, xlsx, PWA
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── api/axios.js
    ├── shared/ErrorBoundary.jsx
    ├── components/           ← AdminLayout, delivery modals, …
    └── pages/                ← Dashboard, Users, Stores, DeliveryCompanies,
                                StoreSubscriptions, DeliverySubscriptions, …
```

> **Deprecated fork:** `admin-panelFrontend/` is not production. Do not deploy it. See `DEPRECATED_admin-panelFrontend.md`.

---

## 6. واجهة التوصيل — `delivery/`

```
delivery/
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx               ← company routes + /driver/*
    ├── api/axios.js
    ├── shared/ErrorBoundary.jsx
    ├── pages/                ← Dashboard, Requests, RequestDetails, CompanyBilling, …
    └── pages/driver/         ← DriverHome, DriverDeliveryDetail, …
```

---

## 7. أين أجد كل شيء؟ (مرجع سريع)

| أريد أن... | اذهب إلى |
|-----------|----------|
| أضيف نقطة نهاية API | `backend/src/routes/` + `backend/src/controllers/` |
| أعدّل بنية بيانات | `backend/src/models/` |
| أغيّر صلاحيات الوصول | `backend/src/middleware/` + ترتيب الـ middleware في الـ route |
| أضيف صفحة للزبون | `customer/src/pages/` + `App.jsx` |
| أضيف صفحة للمتجر | `adminstore/src/pages/` + `App.jsx` |
| أضيف صفحة للأدمن | `admin/src/pages/` + الراوتر |
| أضيف صفحة للتوصيل | `delivery/src/pages/` + `App.jsx` |
| أغيّر عنوان الـ API | `*/src/lib/apiUrl.js` أو `*/src/api/axios.js` / `adminstore/src/services/api.js` |
