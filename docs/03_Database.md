# 03 — قاعدة البيانات (Database)

> قاعدة البيانات: **MongoDB** (Atlas سحابي) عبر **Mongoose**. الاتصال في `backend/src/config/db.js` باستخدام `MONGO_URI`.
>
> النماذج هي **العقد المشترك** بين الخادم والواجهات الثلاث. أي تعديل هنا يؤثر على كل النظام.

---

## 1. قائمة النماذج (Collections)

| # | الملف | الموديل | الوظيفة |
|---|-------|---------|---------|
| 1 | `user.js` | `User` | المستخدمون بكل الأدوار + النقاط والطاقة والمخزن والرتبة |
| 2 | `store.js` | `Store` | المتاجر والمستودعات + الميزات والإحصائيات ورصيد الكروت |
| 3 | `product.js` | `Product` | المنتجات (قطاعي + جملة) |
| 4 | `offer.js` | `Offer` | العروض (خصم/سعر ثابت/bogo/مجاني) |
| 5 | `category.js` | `Category` | تصنيفات المتاجر/المنتجات |
| 6 | `region.js` | `Region` | المناطق والمناطق الفرعية |
| 7 | `Cart.js` | `Cart` | سلة المستخدم (عنصر واحد لكل مستخدم) |
| 8 | `order.js` | `Order` | الطلبات (لكل متجر طلب منفصل) |
| 9 | `codeOrder.js` | `CodeOrder` | طلبات شراء الكروت من المتاجر |
| 10 | `cardType.js` | `CardType` | أنواع البطاقات: `pointsValue` (أساسي) + `price` + alias `points` |
| 11 | `ActivationCode.js` | `ActivationCode` | أكواد تفعيل موحّدة (role: store/supplier، prefix: sup/str) |
| ~~12~~ | ~~`activationCodeBusiness.js`~~ | — | ✅ (v0.3.0) حُذف النموذج المكرّر |
| 13 | `promoCode.js` | `PromoCode` | أكواد ترويجية (نقاط/فرص) |
| 14 | `treasureBox.js` | `TreasureBox` | صناديق الكنز ومكافآتها واحتمالاتها |
| 15 | `dailyPrize.js` | `DailyPrize` | جوائز الصندوق اليومي |
| 16 | `drawBatch.js` | `DrawBatch` | فعاليات السحب والمشاركون والفائزون (المشارك يحمل `entriesCount`، والسحب `totalEntries` للترجيح بالحظ) |
| 17 | `honorBoard.js` | `HonorBoard` | لوحة الشرف (عناصر مؤقتة) |
| 18 | `systemSetting.js` | `SystemSetting` | إعدادات النظام (key/value) |
| 19 | `ActivityLog.js` | `ActivityLog` | سجل النشاطات والأمان |
| 20 | `message.js` | `Message` | رسائل المحادثات (تنتهي تلقائياً بعد 4 أيام عبر TTL) |
| 21 | `conversationChat.js` | `Conversation` | المحادثات والمشاركون وعدّاد غير المقروء |
| 22 | `wheelPrize.js` | `WheelPrize` | جوائز عجلة الحظ (displayWeight / winWeight) |
| 23 | `wheelSpin.js` | `WheelSpin` | سجل دوران العجلة (audit + idempotency) |
| 24 | `wheelWin.js` | `WheelWin` | سجل فوز بجائزة العجلة |
| 25 | `rating.js` | `Rating` | تقييمات موحّدة (متجر/عرض/منتج) |

---

## 2. النماذج الأساسية بالتفصيل

### 2.1 User (`user.js`)
الحقول الأهم:
- `name` (required), `email` (unique sparse), `phone` (unique sparse) — **يجب توفير إيميل أو هاتف على الأقل** (تحقق في `pre("validate")`).
- `googleId`, `provider` (`local`/`google`), `password` (قد يكون null لحسابات Google), `avatar`.
- **نظام التحفيز:** `points`, `energy`, `entriesWallet` (فرص السحب), `codesUsed`.
- `inventory.cards[]`: مصفوفة `{ cardType (ref CardType), count }` — مخزن البطاقات الملوّنة.
- `referralCode` (unique، يُولَّد تلقائياً), `referredBy` (ref User).
- `rank`: `bronze/silver/gold/platinum` — يُحسب تلقائياً في `pre("save")` بناءً على `codesUsed` (10/50/100).
- `followedStores[]` (ref Store), `lastChestOpened` (Date).
- `status`: `active/suspended/banned`، `role`: `customer/store/supplier/admin`، `address`.
- **`sensitivePasswordHash`** (v0.14.0): bcrypt hash لكلمة مرور إضافية للأدmin (صفحات حساسة).

> ✅ (v0.2.0) أُضيف الحقل `storesEnergyClaimed: [ObjectId ref Store]` إلى نموذج User (يستخدمه `promo-code.controller` لمنع تكرار منح الطاقة عن نفس المتجر).

### 2.2 Store (`store.js`)
- `name`, `phone` (required), `region` (enum: North/Gaza/Middle/South/Rafah), `subRegion`, `category` (required).
- **`codePrefix`** (v0.15.0, unique): بصمة أكواد الكروت `{PREFIX}-XXXXXX`.
- **`ratingAvg` / `ratingCount`** (v0.15.0).
- `logo`, `coverImage`, `whatsapp`, `address`, `description`.
- `isActive` (افتراضي `false` — يحتاج تفعيل أدمن).
- `features{}`: تفعيل ميزات (aiTools, priorityOffers, advancedAnalytics, gamification).
- `usageStats{}`, `maxOfferDays` (افتراضي 30), إحصائيات زيارات (`totalVisits`, `todayVisits`, `customersCount`, `codesEntered`).
- **`cards`** (عدد الكروت المتاحة) و **`bypassCards`** (يسمح الأدمن للمتجر بالعمل بلا كروت) — أساسيان في منطق الطلبات.
- `owner` (ref User, required).

### 2.3 Product (`product.js`)
- `name`, `price` (required), `wholesalePrice`, `isWholesale`, `minOrderQuantity`.
- `image`, `stock`, `isFeatured`, `category`, `store` (ref), `isActive`.

### 2.4 Offer (`offer.js`)
- `title` (required), `offerType` (enum: discount/fixed_price/bogo/free_item, required), `value`, `currency` (ILS).
- `priority`, `isFeatured`, `startDate`, **`expiresAt`** (من التاجر), **`autoDeleteAt`** (من النظام — يحسبه `offer.controller` = الآن + `maxOfferDays`).
- `isExtended`, `deletionWarningSent`, `views`, `clicks`, `store` (ref), `createdBy` (ref User), `isActive`.

### 2.5 Cart (`Cart.js`) و Order (`order.js`)
- **Cart:** `user` (ref, **unique** — سلة واحدة لكل مستخدم), `items[]` = `{ item (ObjectId بدون ref ثابت), itemType (Product/Offer), quantity }`. الـ populate يدوي في `cart.routes.js`.
- **Order:** `customer` (ref), `store` (ref), `items[]` = `{ item, itemType, quantity, price, name }`, `total`, `status` (pending/confirmed/rejected/delivered).

---

## 3. نماذج التحفيز (Gamification)

### CardType
`name`, `color` (افتراضي ذهبي), **`pointsValue`** (قيمة البطاقة بالنقاط), `icon`, `isActive`.
> ⚠️ بعض الـ controllers تتعامل مع حقول `price`/`points` بدل `pointsValue` → عدم تطابق (راجع `15_BUGS.md`).

### PromoCode
`code` (unique), `store` (اختياري), `rewardPoints`, `rewardEntries`, `isRegistrationCode`, `batchName`, `usedBy[]` (`{user, usedAt}`), `isActive`, `maxUses`, `currentUses`.

### TreasureBox
`title`, `boxType` (daily/promotional/sponsored), `store`, `requirements{}` (متطلبات تسويقية: متابعة/مشاركة/فيديو), `rewards[]` (`{cardType, probability}`), `costInEnergy`, `isActive`.

### DailyPrize
`title`, `prizeType` (discount_code/product/points/entries), `value` (Mixed), `store`, `probability`, `isActive`.

### DrawBatch
`name`, `eventType` (field/online/fast_contest), `targetAudience`, `prizes[]` (`{item, count}`), `eventDate`, `minParticipants`, `requiredRank`, `status` (open/quorum_reached/active/closed/completed/cancelled), `adminApproval{}`, `participants[]` (`{user, joinedAt}`), `winners[]`. + virtual `currentCount`.

> 🔴 **عدم تطابق كبير:** `draw.controller` يستخدم حقولاً غير موجودة في هذا النموذج: `status:"voting"`, `locationOptions`, `totalEntries`, `totalVoters`, `participants[].entriesCount`, `participants[].votedLocation`, `finalLocation`. النموذج والـ controller غير متزامنين (راجع `15_BUGS.md` و `07_Business_Logic.md`).

### HonorBoard
`user` (ref), `title`, `message`, `awardImage`, `displayUntil` (متى يختفي), `priority`, `isActive`. فهرس على `{displayUntil, isActive}`.

### WheelPrize (v0.14.0)
`name`, `description`, `icon`, `image`, `color`, `minPoints`, **`displayWeight`** (حجم القطاع), **`winWeight`** (احتمال الفوز — 0 = تظهر ولا تُفوز), `prizeType` (none/points/entries/item), `prizeValue`, `isActive`, `sortOrder`.

### WheelSpin (v0.14.0)
`user`, `prize`, `outcome` (win/no_win/locked), `pointsCost`, `pointsBefore`, `pointsAfter`, `segmentIndex`, `idempotencyKey` (unique sparse), `ip`, `meta`.

### WheelWin (v0.14.0)
`user`, `prize`, `spin`, `userName`, `userPhone`, `userAddress`, `prizeName`, `deliveryStatus` (pending/contacted/delivered/cancelled), `adminNotes`, `wonAt`.

### Rating (v0.15.0)
`user`, `targetType` (store/offer/product), `targetId`, `stars` (1–5). فهرس فريد `(user, targetType, targetId)`.

---

## 4. نماذج مساعدة

- **SystemSetting:** `key` (unique) + `value` (Mixed) + `description`. يُستخدم لإعدادات قابلة للتعديل (مثل `store_join_energy`, `home-video`, **`wheel_spin_cost`**).
- **ActivityLog:** `action`, `details`, `user`, `store`, `ipAddress`, `severity` (info/warning/danger). يكتب فيه `logger.js`.
- **Message:** `conversation`, `sender`, `text`, `image`, `replyTo{}`, `read`, **`expiresAt`** (افتراضي +4 أيام) مع **فهرس TTL** (`expireAfterSeconds: 0`) → الرسائل تُحذف تلقائياً بعد 4 أيام.
- **Conversation:** `participants[]`, `lastMessage`, `context{}` (سياق منتج/عرض), `unreadCount` (Map).
- **ActivationCode (موحّد - v0.3.0):** `code`, `role` (store/supplier), `prefix` (sup/str, اختياري), `isUsed`, `usedBy`, `expiresAt`. (حُذف الملف المكرّر `activationCodeBusiness.js`.)

---

## 5. مخطط العلاقات (Relationships)

```
User 1──* Store (owner)
User *──* Store (followedStores / customersCount)
User 1──1 Cart
User 1──* Order (customer)        Store 1──* Order (store)
Store 1──* Product                Store 1──* Offer
Store 1──* CodeOrder              CodeOrder *──1 CardType   CodeOrder *──* PromoCode (codes)
User *──* CardType (inventory.cards)
TreasureBox *──* CardType (rewards)
DrawBatch *──* User (participants / winners)
HonorBoard *──1 User
Conversation *──* User (participants)   Conversation 1──* Message
PromoCode *──1 Store (اختياري)          PromoCode *──* User (usedBy)
```

---

## 6. الفهارس (Indexes)

- `User`: `email` (unique sparse), `phone` (unique sparse), `referralCode` (unique).
- `Category`: `name` unique. `Region`: `name` unique. `SystemSetting`: `key` unique.
- `PromoCode`/`ActivationCode`: `code` unique.
- `HonorBoard`: فهرس مركّب `{displayUntil, isActive}`.
- `Message`: فهرس TTL على `expiresAt`.
- `Cart`: `user` unique.

> ⚠️ غياب فهارس على حقول استعلام شائعة (مثل `Store.owner`, `Product.store`, `Offer.store`, `Order.store`, `Order.customer`) — فرصة تحسين أداء (راجع `09_Performance.md`).

---

## 7. نقاط القوة ونقاط الضعف

**القوة:**
- استخدام جيد لـ `ref` والعلاقات.
- استخدام ذكي لـ TTL في الرسائل.
- `timestamps: true` في كل النماذج.

### نموذج جديد: `Competition` (v0.7.0)
نظام المسابقات المستقل (AD-002). Collection جديدة لا تمسّ أي نموذج قائم.
- الحقول: `title` (مطلوب)، `description`، `image`، `minPoints` (حد أدنى للتأهّل)، `pointsPerEntry` (تكلفة المشاركة)، `requiredParticipants`، `location`، `startDate`، `endDate`، `isFeatured` (واحدة فقط)، `status` (`draft|active|ended`)، `participants[{ user, entriesCount, pointsSpent, joinedAt }]`، `totalEntries`، `createdBy`، + virtual `participantsCount`.
- خصم النقاط من `User.points` يتم في `POST /competitions/:id/join` (موثوق على الخادم).

### نموذج جديد: `Notification` (v0.11.0)
خدمة الإشعارات الموحّدة (AD-008). Collection جديدة.
- الحقول: `user` (المستلم, مفهرس)، `type` (offer_expiring/offer_expired/offer_renewed/general/...)، `title`، `body`، `data` (Mixed: offerId/url/...)، `read`. + فهرس `{user, read, createdAt}`.
- تُنشأ حصراً عبر `services/notification.service.js`.

### نموذج جديد: `UserActivity` (v0.12.0)
طبقة نشاط المستخدم الموحّدة (AD-007). Collection جديدة، **إضافة غير كاسرة**.
- الحقول: `user` (مفهرس)، `type` (enum: `view_offer`/`open_offer`/`visit_store`/`search`/`favorite_offer`)، `targetType` (`Offer`/`Store`/null)، `targetId`، `meta` (Mixed: `category`/`region`/`query`)، `timestamps`.
- الفهارس: `{user, type, createdAt:-1}` (استعلام الإشارات/التوصيات)، `{user, type, targetId}` (فحص/تبديل المفضّلة وإزالة التكرار).
- المفضّلة ليست نموذجاً منفصلاً؛ هي نشاط `favorite_offer`. تُنشأ الأنشطة عبر `services/activity.service.js` وتُقرأ في التوصيات (AD-004).

**الضعف / للتطوير:**
- ✅ (v0.3.0) عولج تضارب اسم الموديل `ActivationCode` (حذف المكرّر) وتعارض حقول `CardType`.
- ✅ (v0.2.0) عولج تطابق DrawBatch و storesEnergyClaimed.
- 🟡 يبقى: لا Pagination/فهارس مخصّصة على معظم القوائم (M11).
- نقص الفهارس على مفاتيح الاستعلام.
- تخزين `region` كـ enum صلب في `Store` بينما يوجد نموذج `Region` ديناميكي — ازدواجية مصدر الحقيقة.
- لا يوجد soft-delete موحّد (بعض الكيانات تُحذف فعلياً، بعضها `isActive=false`).
