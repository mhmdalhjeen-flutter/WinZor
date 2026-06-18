const PromoCode = require("../models/PromoCode");
const User = require("../models/user");
const Store = require("../models/Store");
const Category = require("../models/Category");
const Region = require("../models/Region");
const DrawBatch = require("../models/DrawBatch");
const ActivityLog = require("../models/ActivityLog");
const crypto = require("crypto");
const logActivity = require("../utils/logger");

// 1. إحصائيات لوحة التحكم (عين الأدمن)
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

        res.status(200).json({
            totalUsers,
            activeStores,
            pendingStores,
            totalCodesUsed,
            activeDraws
        });
    } catch (error) {
        res.status(500).json({ message: "خطأ في جلب الإحصائيات", error: error.message });
    }
};

// 2. توليد كود تفعيل لصاحب متجر أو تاجر
exports.generateActivationCode = async (req, res) => {
    try {
        const { roleType, batchName } = req.body;
        if (!["store", "supplier"].includes(roleType)) {
            return res.status(400).json({ message: "نوع الحساب غير صحيح" });
        }
        const code = `ACT-${roleType.toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
        const newCode = new PromoCode({
            code,
            isRegistrationCode: true,
            batchName: batchName || "Manual Generation",
            maxUses: 1,
        });
        await newCode.save();

        await logActivity({
            action: "توليد كود تفعيل",
            details: `قام الأدمن بتوليد كود تفعيل جديد (${code}) لنوع: ${roleType}`,
            user: req.user.id,
            severity: "warning"
        });

        res.status(201).json({ message: "تم توليد كود التفعيل", code: newCode.code });
    } catch (error) {
        res.status(500).json({ message: "خطأ في التوليد", error: error.message });
    }
};

// 3. توليد دفعة أكواد لمتجر معين
exports.generateBulkCodes = async (req, res) => {
    try {
        const { storeId, count, rewardPoints, rewardEntries, batchName } = req.body;
        if (!storeId || !count) return res.status(400).json({ message: "يجب تحديد المتجر وعدد الأكواد" });
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
                batchName: batchName || `Batch-${store.name}-${new Date().toLocaleDateString()}`,
                maxUses: 1
            });
        }
        const insertedCodes = await PromoCode.insertMany(codes);

        await logActivity({
            action: "توليد دفعة أكواد",
            details: `تم توليد ${count} كود للمتجر ${store.name} برصيد ${rewardPoints} نقطة و ${rewardEntries} فرصة لكل كود.`,
            user: req.user.id,
            store: storeId
        });

        res.status(201).json({ message: `تم توليد ${count} كود للمتجر ${store.name}`, codes: insertedCodes });
    } catch (error) {
        res.status(500).json({ message: "خطأ في توليد الدفعة", error: error.message });
    }
};

// 4. إدارة التصنيفات
exports.addCategory = async (req, res) => {
    try {
        const category = await Category.create(req.body);
        await logActivity({ action: "إضافة تصنيف", details: `تم إضافة نوع متجر جديد: ${category.name}`, user: req.user.id });
        res.status(201).json(category);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteCategory = async (req, res) => {
    try {
        const cat = await Category.findById(req.params.id);
        await Category.findByIdAndDelete(req.params.id);
        await logActivity({ action: "حذف تصنيف", details: `تم حذف نوع المتجر: ${cat?.name}`, user: req.user.id, severity: "warning" });
        res.status(200).json({ message: "تم حذف التصنيف" });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 5. إدارة المناطق
exports.addRegion = async (req, res) => {
    try {
        const region = await Region.create(req.body);
        await logActivity({ action: "إضافة منطقة", details: `تم إضافة محافظة جديدة: ${region.name}`, user: req.user.id });
        res.status(201).json(region);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getRegions = async (req, res) => {
    try {
        const regions = await Region.find();
        res.status(200).json(regions);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateRegion = async (req, res) => {
    try {
        const region = await Region.findByIdAndUpdate(req.params.id, req.body, { new: true });
        await logActivity({ action: "تحديث منطقة", details: `تم تحديث بيانات المحافظة/المنطقة: ${region.name}`, user: req.user.id });
        res.status(200).json(region);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 6. إدارة المتاجر وحظر المستخدمين
exports.getAllStores = async (req, res) => {
    try {
        const stores = await Store.find().populate("owner", "name email");
        res.status(200).json(stores);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.toggleStoreStatus = async (req, res) => {
    try {
        const store = await Store.findById(req.params.storeId);
        if (!store) return res.status(404).json({ message: "Store not found" });
        store.isActive = !store.isActive;
        await store.save();
        await logActivity({ action: "تغيير حالة متجر", details: `تم ${store.isActive ? 'تفعيل' : 'إيقاف'} المتجر ${store.name}`, user: req.user.id, store: store._id, severity: store.isActive ? "info" : "warning" });
        res.status(200).json({ message: `Store status updated`, store });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 7. إدارة السحوبات
exports.createDraw = async (req, res) => {
    try {
        const draw = await DrawBatch.create(req.body);
        await logActivity({ action: "إنشاء سحب", details: `تم إنشاء سحب جديد: ${draw.name}`, user: req.user.id, severity: "warning" });
        res.status(201).json({ message: "تم إنشاء السحب بنجاح", draw });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getAllDraws = async (req, res) => {
    try {
        const draws = await DrawBatch.find().sort({ createdAt: -1 });
        res.status(200).json(draws);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.updateDraw = async (req, res) => {
    try {
        const draw = await DrawBatch.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ message: "تم تحديث السحب بنجاح", draw });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// 8. جلب سجل النشاطات
exports.getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find().populate("user", "name role").populate("store", "name").sort({ createdAt: -1 }).limit(100);
        res.status(200).json(logs);
    } catch (error) { res.status(500).json({ message: error.message }); }
};
