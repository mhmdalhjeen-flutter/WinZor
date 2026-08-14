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

### الواجهات (لكل تطبيق إنتاجي)
```bash
cd customer        # أو adminstore أو admin أو delivery
npm install
npm run dev                # خادم Vite للتطوير
npm run build              # بناء للإنتاج (مجلد dist/)
npm run preview            # معاينة البناء
```

> **Admin:** استخدم `admin/` فقط. لا تنشر `admin-panelFrontend/` — راجع `docs/DEPRECATED_admin-panelFrontend.md`.

---

## 2. ترتيب التشغيل
1. شغّل الـ Backend أولاً (الواجهات تعتمد على `localhost:5000`).
2. ثم شغّل الواجهة/الواجهات المطلوبة (كل واحدة على منفذ Vite مختلف).

---

## 3. متغيّرات البيئة

### backend/.env (مطلوب)
```
MONGO_URI=...
JWT_SECRET=...
PORT=5000
CORS_ORIGINS=...     # نطاقات الإنتاج (adminwingold.pages.dev, …)
```

See `backend/.env.example` for the full variable list.

### Frontend `.env` / `.env.example`
```
VITE_API_URL=http://localhost:5000/api   # development
# production: https://winzor.onrender.com (or your API host)
```

Each app (`customer/`, `adminstore/`, `admin/`, `delivery/`) ships an `.env.example`.

---

## 4. اعتبارات الإنتاج (Checklist مقترح — غير منفّذ)

- [ ] 🔴 إصلاح حساسية حالة الأحرف في `require` (تكسر على Linux). راجع `15_BUGS.md`.
- [ ] 🔴 إغلاق ثغرات الصلاحيات الأمنية. راجع `08_Security.md`.
- [ ] 🔴 تعطيل/تأمين الأدمن الافتراضي.
- [ ] تقييد CORS لنطاقات الواجهات.
- [ ] `VITE_API_URL` في كل واجهة عند build الإنتاج.
- [ ] `.gitignore` في الجذر وكل تطبيق — `dist/` غير مُتتبّع (راجع `REPOSITORY_STRUCTURE.md` إن كان `dist` مُلتزماً في repo فرعي).
- [ ] لا تنشر `admin-panelFrontend/` — استخدم `admin/` فقط.
- [ ] إضافة process manager (PM2) أو حاوية (Docker) للـ Backend.
- [ ] HTTPS + رؤوس أمان (helmet).
- [ ] نسخ احتياطي لقاعدة البيانات (Atlas backups).
- [ ] متغيّرات بيئة عبر مدير أسرار لا ملفات نصية.

---

## 5. بنية نشر مقترحة (مستقبلية)

```
[Backend]   → خدمة Node (Render/Railway/VPS + PM2) أو حاوية Docker
[4 Frontends] → استضافة ثابتة (Cloudflare Pages / Workers / Netlify) — مجلدات `customer/`, `adminstore/`, `admin/`, `delivery/`:
                 customer.*          (customer)
                 win-gold-supplier.* (adminstore)
                 adminwingold.*      (admin)
                 delivery-win-gold.* (delivery)
[Database]  → MongoDB Atlas (مع IP allowlist + backups)
```

> لا يوجد حالياً أي ملفات بنية تحتية (Docker/CI). إنشاؤها بند مستقبلي في `14_TODO.md`.
