const Product = require("../models/Product");
const Store = require("../models/Store");

// ================= إنشاء منتج جديد =================
exports.createProduct = async (req, res) => {
    try {
        // التحقق من أن المستخدم صاحب متجر أو تاجر
        if (req.user.role !== "store" && req.user.role !== "supplier") {
            return res.status(403).json({ message: "غير مسموح لك بإنشاء منتجات" });
        }

        const store = await Store.findOne({ owner: req.user.id });
        if (!store) {
            return res.status(404).json({ message: "يجب إنشاء متجر/مستودع أولاً قبل إضافة منتجات" });
        }

        const product = await Product.create({
            ...req.body,
            store: store._id
        });

        res.json({ message: "تم إنشاء المنتج بنجاح", product });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= جلب منتجات متجر معين (للزبائن) =================
exports.getStoreProducts = async (req, res) => {
    try {
        const products = await Product.find({ 
            store: req.params.storeId,
            isActive: true,
            isWholesale: false // عرض المنتجات العادية فقط للزبائن
        });
        res.json({ products });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= جلب منتجات الجملة (حصرياً لأصحاب المحلات) =================
exports.getWholesaleProducts = async (req, res) => {
    try {
        // التحقق من أن المستخدم صاحب متجر
        if (req.user.role !== "store" && req.user.role !== "admin") {
            return res.status(403).json({ message: "هذه الصفحة مخصصة لأصحاب المحلات فقط" });
        }

        const products = await Product.find({ 
            isWholesale: true,
            isActive: true 
        }).populate("store", "name phone whatsapp region");

        res.json({
            count: products.length,
            products
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================= البحث عن المنتجات =================
exports.searchProducts = async (req, res) => {
    try {
        const { q } = req.query;

        const products = await Product.find({
            name: { $regex: q, $options: "i" },
            isActive: true,
            isWholesale: false // الزبائن يبحثون في المنتجات العادية فقط
        });

        res.json({
            count: products.length,
            products
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ================= حذف منتج (إخفاء) =================
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "المنتج غير موجود" });
        }

        // التحقق من الملكية
        const store = await Store.findOne({ owner: req.user.id });
        if (req.user.role !== "admin" && product.store.toString() !== store._id.toString()) {
            return res.status(403).json({ message: "غير مسموح لك بحذف هذا المنتج" });
        }

        product.isActive = false;
        await product.save();

        res.json({ message: "تم حذف المنتج بنجاح" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
