const PromoCode = require("../models/promoCode");
const User = require("../models/user");
const Store = require("../models/store");
const Category = require("../models/category");
const Region = require("../models/region");
const DrawBatch = require("../models/drawBatch");
const SystemSetting = require("../models/systemSetting");
const ActivityLog = require("../models/activityLog");
const CardType = require("../models/cardType");
const TreasureBox = require("../models/treasureBox");
const crypto = require("crypto");
const logActivity = require("../utils/logger");

// 1. إحصائيات لوحة التحكم الشاملة
exports.getStats = async (req, res) => {
    try {
        const [u, s, p, c, d, ct, tb] = await Promise.all([
            User.countDocuments({ role: 'customer' }),
            Store.countDocuments({ isActive: true }),
            Store.countDocuments({ isActive: false }),
            PromoCode.countDocuments({ currentUses: { $gt: 0 }, isRegistrationCode: false }),
            DrawBatch.countDocuments({ status: { $in: ['open', 'quorum_reached', 'active'] } }),
            CardType.countDocuments({ isActive: true }),
            TreasureBox.countDocuments({ isActive: true })
        ]);
        res.status(200).json({ totalUsers: u, activeStores: s, pendingStores: p, totalCodesUsed: c, activeDraws: d, totalCardsProduced: ct, activeBoxes: tb });
    } catch (error) { res.status(500).json({ message: "خطأ في جلب الإحصائيات", error: error.message }); }
};

// 2. إدارة المستخدمين
exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const users = await User.find({ $or: [{ name: { $regex: query, $options: 'i' } }, { email: { $regex: query, $options: 'i' } }] }).limit(20);
        res.status(200).json(users);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateUserManually = async (req, res) => {
    try {
        const { userId, points, entriesWallet, rank, status, codesUsed } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
        if (points !== undefined) user.points = points;
        if (entriesWallet !== undefined) user.entriesWallet = entriesWallet;
        if (codesUsed !== undefined) user.codesUsed = codesUsed;
        if (rank !== undefined) user.rank = rank;
        if (status !== undefined) user.status = status;
        await user.save();
        res.status(200).json({ message: "تم تحديث البيانات بنجاح", user });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 3. إدارة المتاجر
exports.getAllStores = async (req, res) => {
    try {
        const stores = await Store.find().populate("owner", "name email");
        res.status(200).json(stores);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.toggleStoreStatus = async (req, res) => {
    try {
        const store = await Store.findById(req.params.storeId);
        if (!store) return res.status(404).json({ message: "المتجر غير موجود" });
        store.isActive = !store.isActive;
        await store.save();
        res.status(200).json({ message: "تم تغيير الحالة", isActive: store.isActive });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 4. إدارة التصنيفات
exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.addCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json(category);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 5. إدارة الأكواد (Bulk Generation) - إصلاح الخطأ في السطر 33
exports.generateBulkCodes = async (req, res) => {
    try {
        const { count, rewardPoints, rewardEntries, storeId } = req.body;
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = "OT-" + crypto.randomBytes(3).toString("hex").toUpperCase();
            codes.push({ code, rewardPoints: rewardPoints || 0, rewardEntries: rewardEntries || 0, store: storeId || null, createdBy: req.user.id });
        }
        await PromoCode.insertMany(codes);
        res.status(201).json({ message: `تم إنتاج ${count} كود بنجاح` });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 6. إدارة السحوبات
exports.getAllDraws = async (req, res) => {
    try {
        const draws = await DrawBatch.find().sort({ createdAt: -1 });
        res.status(200).json(draws);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.createDraw = async (req, res) => {
    try {
        const draw = await DrawBatch.create(req.body);
        res.status(201).json(draw);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.approveDraw = async (req, res) => {
    try {
        const draw = await DrawBatch.findById(req.params.drawId);
        if (!draw) return res.status(404).json({ message: "الفعالية غير موجودة" });
        draw.status = "active";
        await draw.save();
        res.status(200).json(draw);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 7. سجل النشاطات وتنبيهات الأمان
exports.getSecurityAlerts = async (req, res) => {
    try {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const alerts = await ActivityLog.find({ severity: { $in: ["warning", "danger"] }, createdAt: { $gt: yesterday } }).sort({ createdAt: -1 }).limit(10);
        res.status(200).json({ hasAlerts: alerts.length > 0, alerts });
    } catch (error) { res.status(500).json({ message: "خطأ في جلب التنبيهات" }); }
};

exports.getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find().populate("user", "name role").sort({ createdAt: -1 }).limit(100);
        res.status(200).json(logs);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 8. إعدادات النظام
exports.updateSystemSettings = async (req, res) => {
    try {
        const { key, value } = req.body;
        const setting = await SystemSetting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
        res.status(200).json(setting);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getSystemSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.find();
        res.status(200).json(settings);
    } catch (error) { res.status(500).json({ message: error.message }); }
};
