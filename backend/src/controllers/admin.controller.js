const PromoCode = require("../models/PromoCode"); // تصحيح الاسم
const User = require("../models/user");
const Store = require("../models/Store");
const Category = require("../models/Category");
const Region = require("../models/Region");
const DrawBatch = require("../models/DrawBatch");
const SystemSetting = require("../models/SystemSetting"); // إضافة الموديل
const ActivityLog = require("../models/ActivityLog");
const crypto = require("crypto");
const logActivity = require("../utils/logger");

// 1. إحصائيات لوحة التحكم
exports.getStats = async (req, res) => {
    try {
        const [
            totalUsers,
            activeStores,
            pendingStores,
            totalCodesUsed,
            activeDraws
        ] = await Promise.all([
            User.countDocuments({ role: 'customer' }),
            Store.countDocuments({ isActive: true }),
            Store.countDocuments({ isActive: false }),
            PromoCode.countDocuments({ currentUses: { $gt: 0 }, isRegistrationCode: false }),
            DrawBatch.countDocuments({ status: { $in: ['open', 'voting'] } })
        ]);

        res.status(200).json({ totalUsers, activeStores, pendingStores, totalCodesUsed, activeDraws });
    } catch (error) {
        res.status(500).json({ message: "خطأ في جلب الإحصائيات", error: error.message });
    }
};

// 2. التحكم اليدوي الكامل في المستخدم (الأمر القاطع)
exports.updateUserManually = async (req, res) => {
    try {
        const { userId, points, entriesWallet, rank, status, suspensionUntil, note, codesUsed } = req.body;
        
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

        if (points !== undefined) user.points = points;
        if (entriesWallet !== undefined) user.entriesWallet = entriesWallet;
        if (codesUsed !== undefined) user.codesUsed = codesUsed; // إمكانية زيادة الأكواد يدوياً
        if (rank !== undefined) user.rank = rank;
        if (status !== undefined) user.status = status;
        if (suspensionUntil !== undefined) user.suspensionUntil = suspensionUntil;

        await user.save();

        await logActivity({
            action: "تعديل يدوي للمستخدم",
            details: `تعديل بيانات ${user.name}. السبب: ${note || 'غير محدد'}`,
            user: req.user.id,
            severity: "warning"
        });

        res.status(200).json({ message: "تم تحديث البيانات بنجاح", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// 3. إدارة إعدادات النظام (تحكم الأدمن في الرتب والنسب)
exports.updateSystemSettings = async (req, res) => {
    try {
        const { key, value } = req.body;
        const setting = await SystemSetting.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        res.status(200).json({ message: "تم تحديث الإعدادات بنجاح", setting });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSystemSettings = async (req, res) => {
    try {
        const settings = await SystemSetting.find();
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- (بقية الوظائف السابقة مع تصحيح الاستدعاءات) ---

exports.generateBulkCodes = async (req, res) => {
    try {
        const { storeId, count, rewardPoints, rewardEntries, batchName } = req.body;
        const store = await Store.findById(storeId);
        if (!store) return res.status(404).json({ message: "المتجر غير موجود" });
        
        const codes = [];
        for (let i = 0; i < count; i++) {
            const prefix = store.name.substring(0, 3).toUpperCase();
            const randomStr = crypto.randomBytes(3).toString("hex").toUpperCase();
            codes.push({
                code: `${prefix}-${randomStr}`,
                store: storeId,
                rewardPoints: rewardPoints || 0,
                rewardEntries: rewardEntries || 1,
                batchName: batchName || `Batch-${store.name}`,
                maxUses: 1
            });
        }
        await PromoCode.insertMany(codes);
        res.status(201).json({ message: "تم توليد الأكواد بنجاح" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } }
            ]
        }).limit(10);
        res.status(200).json(users);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// إضافة وظائف التصنيفات والمناطق والسحوبات...
exports.addCategory = async (req, res) => { res.status(201).json(await Category.create(req.body)); };
exports.getCategories = async (req, res) => { res.status(200).json(await Category.find()); };
exports.addRegion = async (req, res) => { res.status(201).json(await Region.create(req.body)); };
exports.getRegions = async (req, res) => { res.status(200).json(await Region.find()); };
exports.getAllStores = async (req, res) => { res.status(200).json(await Store.find().populate("owner", "name email")); };
exports.toggleStoreStatus = async (req, res) => {
    const store = await Store.findById(req.params.storeId);
    store.isActive = !store.isActive;
    await store.save();
    res.status(200).json(store);
};
exports.createDraw = async (req, res) => { res.status(201).json(await DrawBatch.create(req.body)); };
exports.getAllDraws = async (req, res) => { res.status(200).json(await DrawBatch.find().sort({ createdAt: -1 })); };
exports.getActivityLogs = async (req, res) => { res.status(200).json(await ActivityLog.find().populate("user", "name role").populate("store", "name").sort({ createdAt: -1 }).limit(100)); };
