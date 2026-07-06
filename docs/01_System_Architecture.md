# 01 — معمارية النظام (System Architecture)

---

## 1. لماذا هذه المعمارية؟

اختار صاحب المشروع فصل **الواجهات (Frontends)** عن **الخادم (Backend)** فصلاً كاملاً (Decoupled / Headless):
- كل واجهة تطبيق React مستقل يُبنى ويُنشر بشكل منفصل.
- الخادم يوفّر **REST API** فقط (JSON)، لا يعرض صفحات HTML.
- التواصل بينهما عبر HTTP + JWT.

**الفائدة:** يمكن تعديل أو إعادة بناء أي واجهة دون لمس الخادم، والعكس صحيح — وهذا يخدم فلسفة "المشروع متغيّر باستمرار".

---

## 2. المخطط العام

```
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│  customerFrontend  │   │ store-supplier-    │   │  admin-panel       │
│  (الزبون)          │   │ frontend (المتاجر) │   │  Frontend (الإدارة)│
│  React18 / Vite5   │   │  React19 / Vite8   │   │  React18 / Vite5   │
└─────────┬──────────┘   └─────────┬──────────┘   └─────────┬──────────┘
          │                        │                        │
          │  HTTP (axios) + Bearer JWT من localStorage       │
          └────────────┬───────────┴────────────┬───────────┘
                       ▼                         ▼
              ┌──────────────────────────────────────────────┐
              │              BACKEND (Express 5)               │
              │                                                │
              │  app.use(cors()) + express.json()              │
              │  ┌──────────────────────────────────────────┐ │
              │  │ Routes  (/api/...)                         │ │
              │  │   ↓ middleware: auth → role/admin          │ │
              │  │ Controllers (business logic)               │ │
              │  │   ↓                                        │ │
              │  │ Models (Mongoose schemas)                  │ │
              │  └──────────────────────────────────────────┘ │
              │  Background job: monitorOffers() كل 24 ساعة    │
              └───────────────────────┬────────────────────────┘
                                      │ Mongoose
                                      ▼
                         ┌──────────────────────────┐
                         │   MongoDB Atlas (سحابية)   │
                         │   قاعدة بيانات واحدة        │
                         └──────────────────────────┘
```

---

## 3. طبقات الـ Backend (Layered Architecture)

الخادم يتبع نمط **MVC مبسّط**:

```
Request
  → Route            (تعريف المسار + ربط middleware)
    → Middleware      (auth.middleware → role/admin middleware)
      → Controller    (منطق العمل + التحقق + الرد)
        → Model       (Mongoose — التفاعل مع MongoDB)
```

- **Routes:** في `backend/src/routes/`. تُسجَّل كلها في `server.js` تحت بادئة `/api`.
- **Controllers:** في `backend/src/controllers/` (+ مجلد فرعي `admin/`).
- **Models:** في `backend/src/models/`.
- **Middleware:** في `backend/src/middleware/` (auth, admin, role).
- **Utils:** `logger.js` (تسجيل النشاط)، `offerMonitor.js` (مهمة دورية).
- **Config:** `config/db.js` (الاتصال بقاعدة البيانات).

> ملاحظة: بعض المنطق مكتوب **داخل ملفات الـ routes مباشرة** (مثل `cart.routes.js`, `order.routes.js`, وأجزاء من `admin.routes.js` و `store.routes.js`) بدل وضعه في controllers. هذا تفاوت في النمط مسجّل للتحسين المستقبلي (راجع `14_TODO.md`).

---

## 4. آلية المصادقة (Authentication Flow)

1. المستخدم يسجّل دخول عبر `POST /api/auth/login` (أو register، أو google).
2. الخادم يتحقق ويعيد **JWT** موقّعاً بـ `JWT_SECRET`، صالح **7 أيام**، يحوي `{ id, role }` (أحياناً `storeId`).
3. الواجهة تحفظ الـ token و `user` في `localStorage`.
4. كل طلب لاحق: axios interceptor يضيف ترويسة `Authorization: Bearer <token>`.
5. `auth.middleware` يتحقق من التوكن، يجلب المستخدم من DB، ويضع `req.user = { id, role, email }`.
6. عند الحاجة: `role.middleware([...])` أو `admin.middleware` يتحققان من الصلاحية.

> فصل التطبيقات: `login` يقبل `appType` (`customer` / `business` / `admin`) ويرفض الدخول إن كان الدور لا يناسب التطبيق — لكنه **اختياري** (إن لم تُرسل `appType` لا يُطبَّق الفصل).

---

## 5. آلية تدفق البيانات (Data Flow) — مثال كامل

**سيناريو: زبون يطلب منتجاً**
1. الزبون في `customerFrontend` يضيف منتجاً للسلة → `POST /api/cart/add`.
2. عند الدفع → `POST /api/cart/checkout`: يُنشئ الخادم **Order واحد لكل متجر** بحالة `pending`.
3. التاجر في `store-supplier-frontend` يرى الطلب → `GET /api/orders/store`.
4. التاجر يؤكد → `PATCH /api/orders/:id/status` بـ `confirmed`:
   - إن لم يكن `bypassCards` مفعّلاً ولا يملك كروتاً → يُرفض.
   - وإلا: يُخصم كرت واحد من المتجر + تُضاف نقطة (+1) للزبون.
5. عند `delivered`: يُحذف الطلب من DB وتُنظّف عناصره من سلة الزبون.

هذا المثال يوضّح أن **بيانات الزبون والتاجر تلتقي في نفس الـ Order ونفس قاعدة البيانات** — ولهذا أي تعديل على نموذج `Order` يؤثر على الواجهتين.

---

## 6. المهام الخلفية (Background Jobs)

- `monitorOffers()` في `server.js`: تعمل عند الإقلاع ثم **كل 24 ساعة** (`setInterval`):
  - تُعطّل العروض التي تجاوزت `autoDeleteAt`.
  - ترسل تحذيراً (حالياً `console.log` فقط) للعروض التي ستنتهي خلال 3 أيام.
- `seedAdmin()`: يُنشئ حساب أدمن افتراضياً عند الإقلاع إن لم يوجد.

> هذه المهمة تعتمد على `setInterval` داخل العملية — إن تعدّدت نسخ الخادم (scaling) ستعمل أكثر من مرة. مسجّل للتحسين (راجع `09_Performance.md`).

---

## 7. نقاط القوة في المعمارية

- فصل واضح بين الواجهات والخادم (Headless API).
- بنية MVC مفهومة وسهلة التتبع للمبتدئين.
- مصادقة موحّدة (JWT) عبر كل الأنظمة.
- إعادة استخدام نفس نماذج البيانات عبر الواجهات الثلاث.

## 8. نقاط الضعف / للتطوير المستقبلي

- لا يوجد **طبقة خدمات (Service Layer)** — المنطق مبعثر بين controllers و routes.
- لا يوجد **معالج أخطاء مركزي (Centralized Error Handler)** — كل دالة تكرّر `try/catch`.
- لا يوجد **طبقة Validation** (مثل Joi/Zod) — التحقق يدوي وغير متّسق.
- عنوان الـ Backend **مكتوب يدوياً (hardcoded)** في كل واجهة (`http://localhost:5000/api`) بدل متغيّر بيئة.
- المهام الدورية داخل العملية (لا تصلح للتوسّع الأفقي).
