const Offer = require("../models/Offer");
const Store = require("../models/Store");
const logActivity = require("../utils/logger");

// ================= إنشاء عرض جديد =================
exports.createOffer = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user.id });
        if (!store) {
            return res.status(404).json({ message: "يجب إنشاء متجر أولاً قبل إضافة عروض" });
        }

        // حساب تاريخ الحذف التلقائي بناءً على صلاحية المتجر
        const autoDeleteAt = new Date();
        autoDeleteAt.setDate(autoDeleteAt.getDate() + (store.maxOfferDays || 30));

        const offer = await Offer.create({
            ...req.body,
            store: store._id,
            createdBy: req.user.id,
            autoDeleteAt
        });

        // تسجيل النشاط
        await logActivity({
            action: "إنشاء عرض",
            details: `المحل ${store.name} أضاف عرضاً جديداً: ${offer.title}`,
            user: req.user.id,
            store: store._id
        });

        res.json({ message: "تم إنشاء العرض بنجاح", offer });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= جلب العروض النشطة =================
exports.getOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ isActive: true })
            .populate("store", "name logo region subRegion")
            .sort({ priority: -1, createdAt: -1 }); // الترتيب حسب الأولوية ثم الأحدث
        
        res.json({ offers });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
