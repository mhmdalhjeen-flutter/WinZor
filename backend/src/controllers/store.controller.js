const Store = require("../models/Store");
const Offer = require("../models/Offer");
const Product = require("../models/Product");
const logActivity = require("../utils/logger");

// ================= إنشاء متجر جديد =================
exports.createStore = async (req, res) => {
    try {
        const { name, description, phone, address, region, subRegion, category, image, activationCode } = req.body;

        // التحقق من أن المستخدم لديه صلاحية "صاحب متجر" أو استخدم كود تفعيل سابقاً
        // ملاحظة: في نظامنا الحالي، المستخدم يحصل على رتبة store عبر كود التفعيل أولاً
        if (req.user.role !== "store") {
            return res.status(403).json({ message: "هذا الحساب غير مخول لإنشاء متجر. يرجى تفعيل الحساب أولاً." });
        }

        // التأكد من أن المستخدم لا يملك متجراً بالفعل (حسب رغبتك في تحديد متجر واحد لكل حساب)
        const existingStore = await Store.findOne({ owner: req.user.id });
        if (existingStore) {
            return res.status(400).json({ message: "لديك متجر مسجل بالفعل." });
        }

        const store = await Store.create({
            name,
            description,
            phone,
            address,
            region,
            subRegion,
            category,
            logo: image, // حالياً نستخدم الحقل القديم للوجو
            owner: req.user.id,
            isActive: false // المتاجر الجديدة بانتظار تفعيل الأدمن
        });

        // تسجيل النشاط
        await logActivity({
            action: "إنشاء متجر",
            details: `المستخدم ${req.user.email} قام بإنشاء طلب لمتجر جديد باسم: ${name}`,
            user: req.user.id,
            store: store._id,
            severity: "warning"
        });

        res.status(201).json({
            message: "تم إنشاء المتجر بنجاح، وهو بانتظار تفعيل الإدارة ليظهر للعامة.",
            store
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================= جلب بيانات متجر بالتفصيل =================
exports.getStoreById = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);

        if (!store) {
            return res.status(404).json({ message: "المتجر غير موجود" });
        }

        // زيادة عداد الزيارات
        store.totalVisits += 1;
        store.todayVisits += 1;
        await store.save();

        const offers = await Offer.find({ store: store._id, isActive: true });
        const products = await Product.find({ store: store._id, isActive: true });

        res.json({
            store,
            offers,
            products
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================= جلب قائمة المتاجر (مع الفلترة) =================
exports.getAllStores = async (req, res) => {
    try {
        const { region, category } = req.query;
        let query = { isActive: true };

        if (region) query.region = region;
        if (category) query.category = category;

        const stores = await Store.find(query).select("name logo region subRegion category description");

        res.json({
            count: stores.length,
            stores
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
