const PromoCode = require("../models/PromoCode");
const Store = require("../models/Store");
const User = require("../models/user");
const logActivity = require("../utils/logger");

// ================= استرداد كود عادي (نقاط/فرص سحب وتوجيه للمحل) =================
exports.redeemCode = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        const promo = await PromoCode.findOne({ code });

        if (!promo || !promo.isActive) {
            return res.status(400).json({ message: "الكود غير صالح أو منتهي الصلاحية" });
        }

        if (promo.isRegistrationCode) {
            return res.status(400).json({ message: "هذا الكود مخصص لتفعيل الحسابات وليس للاستخدام العام" });
        }

        // التحقق مما إذا كان المستخدم قد استخدم هذا الكود من قبل
        const alreadyUsed = promo.usedBy.find(u => u.user.toString() === userId);
        if (alreadyUsed) {
            return res.status(400).json({ message: "لقد قمت باستخدام هذا الكود من قبل" });
        }

        // تحديث رصيد المستخدم
        const user = await User.findById(userId);
        user.points += promo.rewardPoints || 0;
        user.entriesWallet += promo.rewardEntries || 0;
        user.codesUsed += 1;
        await user.save();

        // إضافة المستخدم لقائمة المستهلكين
        promo.usedBy.push({ user: userId });
        promo.currentUses++;

        if (promo.currentUses >= promo.maxUses) {
            promo.isActive = false;
        }
        await promo.save();

        let redirectStoreId = null;
        let storeName = "عام";
        if (promo.store) {
            const store = await Store.findById(promo.store);
            if (store) {
                store.totalVisits++;
                store.codesEntered++;
                await store.save();
                redirectStoreId = store._id;
                storeName = store.name;
            }
        }

        // تسجيل النشاط
        await logActivity({
            action: "إدخال كود",
            details: `المستخدم ${user.name} أدخل كوداً للمحل: ${storeName}. حصل على ${promo.rewardPoints} نقطة و ${promo.rewardEntries} فرصة سحب.`,
            user: userId,
            store: promo.store
        });

        res.json({
            message: "تم استرداد الكود بنجاح",
            rewards: {
                points: promo.rewardPoints,
                entries: promo.rewardEntries
            },
            redirectStoreId
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= استرداد كود تفعيل (تحويل الحساب) =================
exports.redeemActivationCode = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        const promo = await PromoCode.findOne({ code });

        if (!promo || !promo.isActive || !promo.isRegistrationCode) {
            return res.status(400).json({ message: "كود تفعيل غير صحيح أو مستخدم مسبقاً" });
        }

        let newRole = "customer";
        if (code.includes("STORE")) newRole = "store";
        else if (code.includes("SUPPLIER")) newRole = "supplier";

        const user = await User.findById(userId);
        const oldRole = user.role;
        user.role = newRole;
        await user.save();

        promo.isActive = false;
        promo.usedBy.push({ user: userId });
        await promo.save();

        // تسجيل النشاط
        await logActivity({
            action: "تفعيل حساب",
            details: `تم ترقية المستخدم ${user.name} من ${oldRole} إلى ${newRole} باستخدام كود تفعيل`,
            user: userId,
            severity: "warning"
        });

        res.json({
            message: `مبروك! تم تفعيل حسابك كـ ${newRole === "store" ? "صاحب متجر" : "تاجر"}`,
            newRole
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= إنشاء كود جديد =================
exports.createPromoCode = async (req, res) => {
    try {
        const { rewardPoints, rewardEntries, maxUses } = req.body;
        const store = await Store.findOne({ owner: req.user.id });

        const code = "OT-" + Math.random().toString(36).substring(2, 8).toUpperCase();

        const promo = await PromoCode.create({
            code,
            store: store ? store._id : null,
            rewardPoints: rewardPoints || 0,
            rewardEntries: rewardEntries || 0,
            maxUses: maxUses || 1,
            createdBy: req.user.id
        });

        // تسجيل النشاط
        await logActivity({
            action: "إنشاء كود",
            details: `المستخدم ${req.user.email} أنشأ كوداً جديداً: ${code}`,
            user: req.user.id,
            store: store ? store._id : null
        });

        res.json({ message: "تم إنشاء الكود بنجاح", promo });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
