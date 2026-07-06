# 06 — مرجع الـ APIs

> كل المسارات تحت البادئة `/api`. العمود "الحماية" يوضّح الـ middleware المطبّق فعلياً في الكود الحالي.
>
> 🔴 = ثغرة صلاحيات (المسار حسّاس لكن لا يتحقق من الدور). راجع `08_Security.md`.

---

## Auth — `/api/auth`
| Method | Path | الحماية | الوصف |
|--------|------|---------|--------|
| POST | `/register-customer` | عام | تسجيل زبون |
| POST | `/register-business` | عام | تسجيل متجر/مورد (يتطلب كود تفعيل صالح) |
| POST | `/login` | عام | دخول موحّد (يدعم `appType`) |
| POST | `/google` | عام | دخول/تسجيل عبر Google |

> `resetAdminPassword` موجود في الـ controller لكنه **غير مربوط** بأي route.

---

## Users — `/api/users`
| Method | Path | الحماية | الوصف |
|--------|------|---------|--------|
| GET | `/me` | auth | بياناتي + المخزن |
| PATCH | `/update-profile` | auth | تعديل الاسم/الأيقونة |
| POST | `/redeem-card` | auth | تبديل بطاقة بنقاط XP |

---

## Stores — `/api/stores`
| Method | Path | الحماية | الوصف |
|--------|------|---------|--------|
| POST | `/` | auth | إنشاء متجر (يتطلب role=store داخلياً) |
| GET | `/` | عام | كل المتاجر النشطة |
| GET | `/warehouses` | عام | المستودعات (أصحابها supplier) |
| POST | `/:storeId/follow` | auth | متابعة/إلغاء متابعة |
| GET | `/:id` | auth | تفاصيل متجر + منتجاته وعروضه (+زيادة الزيارات) |

> ترتيب المسارات مقصود: الثابتة (`/warehouses`) قبل `/:id`.

---

## Offers — `/api/offers`
| Method | Path | الحماية | الوصف |
|--------|------|---------|--------|
| GET | `/` | عام | كل العروض النشطة |
| GET | `/my` | auth | عروض متجري |
| GET | `/:id` | عام | عرض واحد |
| POST | `/` | auth | إنشاء عرض (يربطه بمتجر المالك) |
| DELETE | `/:id` | auth | حذف (soft، تحقق ملكية) |
| PUT | `/:id` | auth | تعديل (تحقق ملكية) |

---

## Products — `/api/products`
| Method | Path | الحماية | الوصف |
|--------|------|---------|--------|
| POST | `/` | auth + role(store/supplier/admin) | إنشاء منتج |
| GET | `/my` | auth | منتجات متجري |
| GET | `/store/:storeId` | عام | منتجات متجر (للزبائن) |
| GET | `/wholesale` | auth | منتجات الجملة (store/supplier/admin) |
| GET | `/search` | عام | بحث بالاسم |
| GET | `/:id` | عام | منتج واحد |
| DELETE | `/:id` | auth | حذف (soft) |
| PUT | `/:id` | auth | تعديل |

---

## Cart — `/api/cart` (كل المسارات: auth)
| Method | Path | الوصف |
|--------|------|--------|
| GET | `/` | جلب السلة (مع populate يدوي + حساب total) |
| POST | `/add` | إضافة عنصر (Product/Offer) |
| PATCH | `/update` | تعديل الكمية |
| DELETE | `/remove` | حذف عنصر |
| DELETE | `/clear` | تفريغ |
| POST | `/checkout` | إنشاء Order لكل متجر (السلة تبقى كما هي) |

---

## Orders — `/api/orders` (كل المسارات: auth)
| Method | Path | الوصف |
|--------|------|--------|
| GET | `/store` | طلبات متجري (+رصيد الكروت) |
| GET | `/my` | طلباتي كزبون |
| PATCH | `/:id/status` | تغيير الحالة (confirm يخصم كرت + نقطة للزبون؛ delivered يحذف الطلب) |
| PATCH | `/admin/bypass/:storeId` | الأدمن يمنح/يسحب bypassCards (يتحقق من الدور داخلياً ✅) |

---

## Promo — `/api/promo` (كل المسارات: auth)
| Method | Path | الوصف |
|--------|------|--------|
| POST | `/create` | auth + role(store/supplier/admin) — إنشاء كود (مُحدَّث v0.2.0) |
| POST | `/redeem` | استرداد كود (نقاط/طاقة/فرص) |
| POST | `/redeem-activation` | تحويل الحساب لمتجر/مورد عبر كود |
| GET | `/stats` | إحصائيات الأكواد |

---

## Gamification
| Method | Path | الحماية | الوصف |
|--------|------|---------|--------|
| GET | `/api/draws/open` | auth | السحوبات المفتوحة |
| POST | `/api/draws/join` | auth | المشاركة (يرسل `{ drawId, entriesToSpend }`؛ افتراضي فرصة واحدة، يمكن إنفاق عدّة فرص لزيادة الحظ + تحقق رتبة) |
| GET | `/api/draws/my-draws` | auth | سحوباتي |
| POST | `/api/chest/open` | auth | فتح الصندوق اليومي (24 ساعة) |
| GET | `/api/treasure/available` | auth | الصناديق المتاحة |
| POST | `/api/treasure/open/:boxId` | auth | فتح صندوق (محرّك احتمالات) |
| GET | `/api/honor/active` | عام | لوحة الشرف |
| POST | `/api/honor/add` | auth + role(admin) | إضافة للوحة |
| PATCH | `/api/honor/toggle/:id` | auth + role(admin) | تفعيل/إخفاء |

> ✅ (v0.2.0) أُزيل مسار `/api/draws/vote` ووُحِّد `/api/draws/join` مع نموذج `DrawBatch` (راجع `07_Business_Logic.md`).

---

## Card Types — `/api/card-types`
| Method | Path | الحماية |
|--------|------|---------|
| GET | `/` | auth |
| POST | `/` | auth + role(admin) |
| PUT | `/:id` | auth + role(admin) |
| DELETE | `/:id` | auth + role(admin) |

## Code Orders — `/api/code-orders`
| Method | Path | الحماية | الوصف |
|--------|------|---------|--------|
| POST | `/` | auth + role(store/supplier) | طلب شراء أكواد |
| GET | `/my` | auth + role(store/supplier) | طلباتي |
| DELETE | `/my/:id` | auth + role(store/supplier) | حذف طلب pending |
| GET | `/admin/all` | auth + role(admin) | كل الطلبات |
| POST | `/admin/configure/:id` | auth + role(admin) | تكوين الأكواد (رقمي يضيف للرصيد) |
| POST | `/admin/receive/:id` | auth + role(admin) | تأكيد استلام ورقي |
| GET | `/admin/export/:id` | auth + role(admin) | تصدير Excel+QR |

## Activation — `/api/activation`
| Method | Path | الحماية |
|--------|------|---------|
| POST | `/activate-store` | auth |
| POST | `/create-code` | auth + role(admin) |

## Chats — `/api/chats` (كل المسارات: auth)
| Method | Path | الوصف |
|--------|------|--------|
| POST | `/` | جلب/إنشاء محادثة |
| GET | `/` | محادثاتي |
| GET | `/:convId` | رسائل محادثة (+تعليم مقروء) |
| POST | `/:convId` | إرسال رسالة (فلتر كلمات) |

---

## Admin — `/api/admin`
> ✅ **(v0.2.0)** الراوتر الآن: `router.use(authMiddleware)` ثم `router.use(roleMiddleware(["admin"]))` → **كل** مسارات الأدمن أدناه تتطلب دور `admin`. الجدول التالي يوثّق المسارات (الثغرة السابقة أُغلقت).

### مسارات الأدمن (كلها الآن auth + role admin)
| Method | Path | الخطر |
|--------|------|--------|
| POST | `/settings/home-video` | أي مستخدم يعدّل إعدادات النظام |
| GET | `/settings` | — |
| POST/GET | `/cards`, `/treasure-boxes` | أي مستخدم يدير البطاقات/الصناديق |
| GET | `/security-alerts` | كشف تنبيهات أمنية |
| GET | `/users/search`, `/users` | كشف بيانات كل المستخدمين |
| PATCH | `/users/update-manual` | **أي زبون يعدّل نقاط/رتبة/حالة أي مستخدم** |
| POST | `/activation-code`, `/generate-bulk-codes`, `/codes/generate` | **أي مستخدم يولّد أكواد نقاط** |
| GET | `/codes`, `/check-code/:code`, `/code` | كشف الأكواد |
| GET/POST | `/categories` | تعديل التصنيفات |
| GET/POST/PATCH | `/draws`, `/draws/:id/approve` | إدارة السحوبات |
| POST | `/draws/:drawId/draw-winners` | إعلان الفائزين (اختيار عشوائي مُرجَّح بعدد الفرص) |
| GET | `/activity-logs` | كشف السجلات |

### مسارات محمية بـ adminMiddleware ✅
| Method | Path |
|--------|------|
| POST | `/create-code` (role admin), `/create-code-business` (role admin) |
| DELETE/PATCH/GET | `/users/:id`, `/users/:id/ban`, `/users/count` |
| DELETE/POST | `/codes/:id`, `/codes/delete-bulk` |
| GET/PATCH/DELETE | `/stores`, `/stores/:storeId/toggle(-status)`, `/stores/:storeId`, `/stores/:storeId/products|offers` |
| PATCH/DELETE | `/products/:productId/toggle`, `/products/:productId` |
| PATCH/DELETE | `/offers/:offerId/toggle`, `/offers/:offerId` |

> ✅ أُنجِز في v0.2.0: أُضيف `roleMiddleware(["admin"])` على مستوى الراوتر فغطّى كل المسارات.

---

## المسابقات (Competitions) — `/api/competitions` (v0.7.0)

نظام مستقل قائم على النقاط (AD-002).

| Method | Path | الوصول | الوصف |
|--------|------|--------|-------|
| GET | `/competitions/featured` | auth | المسابقة المميّزة للصفحة الرئيسية + `userPoints` + `joined`/`myEntries`. |
| GET | `/competitions` | عام | المسابقات النشطة. |
| GET | `/competitions/:id` | عام | تفاصيل مسابقة. |
| POST | `/competitions/:id/join` | auth | الانضمام: body `{ entries }`. يتحقّق التأهّل (`minPoints`) والنقاط، يخصم `entries × pointsPerEntry`, يضيف/يزيد المشاركة، يزيد `totalEntries`. |
| GET | `/competitions/admin/all` | admin | كل المسابقات (تشمل المسودّات). |
| POST | `/competitions` | admin | إنشاء. |
| PUT | `/competitions/:id` | admin | تعديل (لا يعدّل `participants`/`totalEntries`). |
| DELETE | `/competitions/:id` | admin | حذف. |
| PATCH | `/competitions/:id/feature` | admin | تعيين مسابقة رئيسية واحدة (يلغي تمييز البقية). |

> الخصم والتحقق موثوقان على الخادم. شكل الرد للعميل يخفي قائمة المشاركين (يُرجع `participantsCount`/`joined`/`myEntries` فقط).

---

## التصنيفات والمناطق (v0.8.0)

`/api/categories`:
| Method | Path | الوصول | الوصف |
|--------|------|--------|-------|
| GET | `/categories` | عام | قائمة مسطّحة (`?type=store&all=true` اختياري). |
| GET | `/categories/tree` | عام | شجرة متداخلة (`children`). |
| POST/PUT/DELETE | `/categories[/:id]` | admin | إدارة (حذف الأب ممنوع إن كان له أبناء). الهرمية عبر `parent`. |

`/api/regions`:
| Method | Path | الوصول | الوصف |
|--------|------|--------|-------|
| GET | `/regions` | عام | المناطق النشطة (`?all=true` للكل). |
| POST/PUT/DELETE | `/regions[/:id]` | admin | إدارة (`subRegions[]`). |

`GET /api/offers` (محدّث): يقبل `category` (id — يشمل الأحفاد)، `region`، `subRegion`. الفلترة عبر `Store` (العرض يرث تصنيف/منطقة المتجر). **يُرجع مصفوفة** (توافق خلفي).

`GET /api/offers/feed` (v0.9.0 — للتمرير اللانهائي): `?limit&cursor&q&category&region&subRegion` → `{ items, nextCursor }`. Cursor-based (ترتيب `_id` تنازلي، `_id < cursor`). `q` يطابق عنوان العرض أو اسم/تصنيف المتجر.

---

## الإشعارات ودورة حياة العروض (v0.11.0)

`/api/notifications` (auth):
| Method | Path | الوصف |
|--------|------|-------|
| GET | `/notifications` | إشعاراتي (`?unread=true`, `?limit=`). |
| GET | `/notifications/unread-count` | `{ count }` لشارة الجرس. |
| PATCH | `/notifications/:id/read` | تعليم إشعار كمقروء. |
| PATCH | `/notifications/read-all` | تعليم الكل كمقروء. |

العروض (دورة الحياة):
| Method | Path | الوصول | الوصف |
|--------|------|--------|-------|
| PATCH | `/offers/:id/renew` | store/admin | تجديد/تمديد (`{days?}`) — يمدّد `autoDeleteAt`، يفعّل، `isExtended`, وينشئ إشعار `offer_renewed`. |
| GET | `/offers/my?all=true` | store | يشمل العروض المتوقّفة/المنتهية. |

> الإشعارات تُنشأ حصراً عبر `services/notification.service.js` (AD-008). `offerMonitor` (كل 24h) يصدر `offer_expiring`/`offer_expired`.

---

## نشاط المستخدم + المفضّلة + التوصيات (v0.12.0)

`/api/activity` (auth — AD-007/AD-004):
| Method | Path | الوصف |
|--------|------|-------|
| POST | `/activity` | تسجيل نشاط `{ type, targetType?, targetId?, meta? }`. الأنواع المسموحة للتسجيل: `view_offer`, `open_offer`, `visit_store`, `search`. |
| GET | `/activity/me` | نشاطي الأخير (`?limit=`, أقصى 100). |
| GET | `/activity/recommendations` | توصيات rule-based (`?limit=`, أقصى 30). يُرجع `{ recommendations, basedOn:{categories,regions,fallback} }`. |
| GET | `/activity/favorites` | المفضّلة (عروض فعّالة) — يُرجع `{ favorites, favoriteIds }`. |
| POST | `/activity/favorites/:offerId/toggle` | تبديل المفضّلة — يُرجع `{ favorited: true|false }`. |

> كل تسجيل نشاط يمرّ عبر `services/activity.service.js` (fire-and-forget). المفضّلة تُخزَّن كنشاط `favorite_offer` مع `meta.category/region` لتغذية التوصيات. منطق التوصية: إشارات آخر 80 نشاطاً بأوزان (مفضّلة 3/فتح 2/غيرها 1) → متاجر مطابقة → عروض مرتّبة بنقاط، مع fallback لأحدث العروض.

---

## عجلة الحظ — `/api/wheel` + `/api/admin/wheel` (v0.14.0)

### الزبون (auth)
| Method | Path | الوصف |
|--------|------|-------|
| GET | `/wheel/config` | إعداد العجلة (segments بدون winWeight) + `spinCost` + `userPoints`. |
| POST | `/wheel/spin` | دوران — header **`Idempotency-Key`** مطلوب للأمان. يُرجع `{ outcome, charged, pointsCost, userPoints, segmentIndex, prize, message, winId? }`. |
| GET | `/wheel/my-wins` | جوائزي `{ wins[] }`. |

**outcomes:** `win` (خصم + جائزة) | `no_win` (خصم، prizeType=none) | `locked` (لا خصم — نقاط المستخدم < minPoints للجائزة المختارة).

### الأدمن — حساس (`/api/admin/sensitive`, auth + role admin)
| Method | Path | الوصف |
|--------|------|-------|
| GET | `/sensitive/status` | `{ configured: boolean }`. |
| POST | `/sensitive/setup` | تعيين كلمة المرور الإضافية (أول مرة). |
| POST | `/sensitive/verify` | `{ password }` → `{ sensitiveToken }` (JWT 30 دقيقة). |
| POST | `/sensitive/change` | تغيير كلمة المرور (يتطلب القديمة). |

### الأدمن — جوائز (auth + admin + header **`x-sensitive-token`**)
| Method | Path | الوصف |
|--------|------|-------|
| GET/POST | `/wheel/prizes` | قائمة / إنشاء جائزة. |
| PUT/DELETE | `/wheel/prizes/:id` | تعديل / حذف. |
| GET | `/wheel/preview` | معاينة (segments + prizes كاملة). |

### الأدmin — فائزون (auth + admin فقط)
| Method | Path | الوصف |
|--------|------|-------|
| GET | `/wheel/wins` | سجل الفوز (populate user). |
| PATCH | `/wheel/wins/:id` | `{ deliveryStatus, adminNotes? }`. |
| GET | `/wheel/spins` | سجل الدوران (audit). |

> التواصل مع الفائز: `POST /api/chats { recipientId, context: { type:'wheel_win', winId, prizeName } }`.

---

## التقييم + أكواد الكروت (v0.15.0)

### Promo — استرداد كود (auth)
| Method | Path | الوصف |
|--------|------|-------|
| POST | `/promo/redeem` | `{ code }` → `{ storeId, storeName, userPoints, rewards, autoFollowed }`. يتحقق من `codePrefix` (ما عدا أكواد `OT-` legacy). |

### Ratings
| Method | Path | الوصف |
|--------|------|-------|
| POST | `/ratings` | `{ targetType, targetId, stars }` — upsert (1–5). |
| GET | `/ratings/mine?targetType&targetId` | تقييمي + ملخص الهدف. |
| GET | `/ratings/:targetType/:targetId` | `{ ratingAvg, ratingCount }`. |

**Store.codePrefix:** تُولَّد عند `register-business` / `createStore`؛ تُBackfill للمتاجر القديمة عند إقلاع الخادم.

**ترتيب العروض:** `ranking.util.js` — Bayesian smoothing + priority + freshness + جودة العرض.

---

## شكل الاستجابات (Response Shapes)

غير موحّد عبر المشروع — أمثلة:
- بعضها `{ message, data }`، بعضها `{ success, data }`، بعضها كائن/مصفوفة مباشرة.
- الأخطاء غالباً `{ message }` بحالة 400/401/403/404/500.
- ✅ (v0.2.0) `chat.controller.sendMessage` لم يعد يُرجع `err.stack` للعميل.

> توحيد شكل الاستجابة فرصة تحسين مستقبلية (راجع `14_TODO.md`).
