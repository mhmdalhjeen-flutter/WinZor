# 10 — النشر (Deployment)

> الوضع الحالي: المشروع يعمل محلياً (development). لا يوجد إعداد نشر رسمي بعد (لا Dockerfile، لا CI/CD).

---

## 1. التشغيل المحلي (Local Development)

### المتطلبات
- Node.js (يفضّل LTS حديث متوافق مع Express 5 / Mongoose 9).
- حساب MongoDB Atlas (أو MongoDB محلي) ورابط اتصال.

### الـ Backend
```bash
cd backend
npm install
# أنشئ ملف .env (انظر القسم 3)
npm run dev      # nodemon (تطوير)
# أو
npm start        # node server.js (إنتاج)
```
يعمل على `http://localhost:5000`.

### الواجهات (لكل واحدة)
```bash
cd customerFrontend        # أو store-supplier-frontend أو admin-panelFrontend
npm install
npm run dev                # خادم Vite للتطوير
npm run build              # بناء للإنتاج (مجلد dist/)
npm run preview            # معاينة البناء
```

> ⚠️ في `admin-panelFrontend`: بسبب وجود `node_modules` داخل `src/`، نفّذ `npm install` في **جذر** `admin-panelFrontend/` وتأكّد من عدم وجود `node_modules` خاطئ داخل `src/` (راجع `15_BUGS.md`).

---

## 2. ترتيب التشغيل
1. شغّل الـ Backend أولاً (الواجهات تعتمد على `localhost:5000`).
2. ثم شغّل الواجهة/الواجهات المطلوبة (كل واحدة على منفذ Vite مختلف).

---

## 3. متغيّرات البيئة

### backend/.env (مطلوب)
```
MONGO_URI=...        # رابط MongoDB
JWT_SECRET=...       # مفتاح قوي وطويل
PORT=5000
VITE_GOOGLE_CLIENT_ID=...   # معرّف Google OAuth
# (مشار إليهما في الكود لكن غير معرّفين حالياً):
# GOOGLE_CLIENT_ID=...      # يستخدمه auth.controller فعلياً
# MASTER_KEY=...            # يستخدمه resetAdminPassword
```

### customerFrontend/.env
```
VITE_GOOGLE_CLIENT_ID=...
```

> 🟡 عنوان الـ API مكتوب يدوياً في كل واجهة (`http://localhost:5000/api`). **قبل النشر** يجب تحويله إلى `VITE_API_URL` ليشير لنطاق الإنتاج. مسجّل في `14_TODO.md`.

---

## 4. اعتبارات الإنتاج (Checklist مقترح — غير منفّذ)

- [ ] 🔴 إصلاح حساسية حالة الأحرف في `require` (تكسر على Linux). راجع `15_BUGS.md`.
- [ ] 🔴 إغلاق ثغرات الصلاحيات الأمنية. راجع `08_Security.md`.
- [ ] 🔴 تعطيل/تأمين الأدمن الافتراضي.
- [ ] تقييد CORS لنطاقات الواجهات.
- [ ] `VITE_API_URL` في كل واجهة.
- [ ] إزالة `node_modules` من `admin-panelFrontend/src`.
- [ ] إضافة `.gitignore` في الجذر وكل واجهة (التحقق من عدم رفع node_modules/dist).
- [ ] إضافة process manager (PM2) أو حاوية (Docker) للـ Backend.
- [ ] HTTPS + رؤوس أمان (helmet).
- [ ] نسخ احتياطي لقاعدة البيانات (Atlas backups).
- [ ] متغيّرات بيئة عبر مدير أسرار لا ملفات نصية.

---

## 5. بنية نشر مقترحة (مستقبلية)

```
[Backend]   → خدمة Node (Render/Railway/VPS + PM2) أو حاوية Docker
[3 Frontends] → استضافة ثابتة (Vercel/Netlify/Nginx) كل واحدة بنطاق فرعي:
                 app.example.com     (customer)
                 business.example.com (store/supplier)
                 admin.example.com    (admin)
[Database]  → MongoDB Atlas (مع IP allowlist + backups)
```

> لا يوجد حالياً أي ملفات بنية تحتية (Docker/CI). إنشاؤها بند مستقبلي في `14_TODO.md`.
