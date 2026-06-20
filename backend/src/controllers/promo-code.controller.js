const PromoCode = require("../models/promoCode");
const Store = require("../models/store");
const user = require("../models/user");
const SystemSetting = require("../models/systemSetting");
const logActivity = require("../utils/logger");

// ================= استرداد كود عادي =================
exports.redeemCode = async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;
        const promo = await PromoCode.findOne({ code });

        if (!promo || !promo.isActive) {
            return res.status(400).json({ message: "الكود غير صالح أو منتهي الصلاحية" });
        }

        const alreadyUsed = promo.usedBy.find(u => u.user.toString() === userId);
        if (alreadyUsed) {
            return res.status(400).json({ message: "لقد قمت باستخدام هذا الكود من قبل" });
        }

        const user = await User.findById(userId);
        let energyEarned = 0;

        if (promo.store) {
            const hasClaimedEnergy = user.storesEnergyClaimed.includes(promo.store);
            if (!hasClaimedEnergy) {
                const joinEnergySetting = await SystemSetting.findOne({ key: "store_join_energy" });
                energyEarned = joinEnergySetting ? parseInt(joinEnergySetting.value) : 50;
                user.energy += energyEarned;
                user.storesEnergyClaimed.push(promo.store);
            }
        }

        user.points += promo.rewardPoints || 0;
        user.entriesWallet += promo.rewardEntries || 0;
        user.codesUsed += 1;
        await user.save();

        promo.usedBy.push({ user: userId });
        promo.currentUses++;
        if (promo.currentUses >= promo.maxUses) promo.isActive = false;
        await promo.save();

        res.json({ message: "تم استرداد الكود بنجاح", rewards: { points: promo.rewardPoints, energy: energyEarned } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= استرداد كود تفعيل =================
exports.redeemActivationCode = async (req, res) => {
    try {
        const { code } = req.body;
        const promo = await PromoCode.findOne({ code, isRegistrationCode: true });
        if (!promo || !promo.isActive) return res.status(400).json({ message: "كود تفعيل غير صحيح" });

        const user = await User.findById(req.user.id);
        user.role = code.includes("STORE") ? "store" : "supplier";
        await user.save();

        promo.isActive = false;
        promo.usedBy.push({ user: req.user.id });
        await promo.save();

        res.json({ message: "تم تفعيل الحساب بنجاح" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= إنشاء كود جديد =================
exports.createPromoCode = async (req, res) => {
    try {
        const code = "OT-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        const promo = await PromoCode.create({ ...req.body, code, createdBy: req.user.id });
        res.json({ message: "تم إنشاء الكود بنجاح", promo });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= إحصائيات الأكواد (الوظيفة التي كانت تسبب الخطأ) =================
exports.getCodeStats = async (req, res) => {
    try {
        const totalCodes = await PromoCode.countDocuments();
        const activeCodes = await PromoCode.countDocuments({ isActive: true });
        res.json({ totalCodes, activeCodes });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
