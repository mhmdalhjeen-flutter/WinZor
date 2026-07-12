const Product = require("../models/product");
const Store = require("../models/store");
const { processDataUrlImage } = require("../utils/imageProcess.util");
const { resolveListImageField } = require("../utils/mediaDelivery.util");
const {
    assertNoMongoOperators,
    cleanString,
    numberInRange,
    requireObjectId,
    safeRegex,
} = require("../utils/inputSecurity.util");

const PRODUCT_LIST_SELECT =
    "name description price wholesalePrice isWholesale minOrderQuantity image stock freeDelivery ratingAvg ratingCount store createdAt";

function stripBase64Image(product) {
    if (!product || typeof product !== "object") return product;
    return resolveListImageField(product, "products");
}

// ================= إنشاء منتج جديد =================
exports.createProduct = async (req, res) => {
    try {
        assertNoMongoOperators(req.body, "product");

       const store = await Store.findOne({
    owner: req.user.id,
    isActive: true
});
        if (!store) {
            return res.status(404).json({ message: "يجب إنشاء متجر/مستودع أولاً قبل إضافة منتجات" });
        }
        const {
            name,
            description,
            price,
            image,
            isWholesale,
            freeDelivery,
        } = req.body;
        if (!name || price == null) {
            return res.status(400).json({
                message: "اسم المنتج والسعر مطلوبان",
            });
        }
        if (!image?.trim()) {
            return res.status(400).json({ message: "صورة المنتج مطلوبة" });
        }

        const product = await Product.create({
            name: cleanString(name, { field: "name", max: 120, required: true }),
            description: cleanString(description, { field: "description", max: 1000 }),
            price: numberInRange(price, { field: "price", min: 0, max: 10_000_000, required: true }),
            image: await processDataUrlImage(image.trim()),
            isWholesale: !!isWholesale,
            freeDelivery: !!freeDelivery,
            store: store._id,
        });

        res.json({ message: "تم إنشاء المنتج بنجاح", product });

    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

// ================= جلب منتجات متجر معين (للزبائن) =================
exports.getStoreProducts = async (req, res) => {
    try {
        const storeId = requireObjectId(req.params.storeId, "storeId");
        const products = await Product.find({ 
            store: storeId,
            isActive: true,
            isWholesale: false // عرض المنتجات العادية فقط للزبائن
        })
            .select(PRODUCT_LIST_SELECT)
            .lean();
        res.json({ products: products.map(stripBase64Image) });

    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

// ================= جلب منتجات الجملة (حصرياً لأصحاب المحلات) =================
exports.getWholesaleProducts = async (req, res) => {
    try {
        const products = await Product.find({ 
            isWholesale: true,
            isActive: true 
        })
            .select(PRODUCT_LIST_SELECT)
            .populate("store", "name phone whatsapp region")
            .lean();

        res.json({
            count: products.length,
            products: products.map(stripBase64Image)
        });

    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ================= البحث عن المنتجات =================
exports.searchProducts = async (req, res) => {
    try {
        const q = cleanString(req.query.q, { field: "q", max: 80 });

        if (!q || q.trim().length < 2) {
            return res.status(400).json({
                message: "يجب إدخال حرفين على الأقل للبحث"
            });
        }
        const rx = safeRegex(q, { field: "q", max: 80 });

        const products = await Product.find({
            name: rx,
            isActive: true,
            isWholesale: false
        })
            .select(PRODUCT_LIST_SELECT)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json({
            count: products.length,
            products: products.map(stripBase64Image)
        });

    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ================= حذف منتج (إخفاء) =================
exports.deleteProduct = async (req, res) => {
    try {
        const productId = requireObjectId(req.params.id, "id");
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "المنتج غير موجود" });
        }

        product.isActive = false;
        await product.save();

        res.json({ message: "تم حذف المنتج بنجاح" });

    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
// ================= جلب منتجات المتجر الخاص بصاحب الحساب =================
exports.getMyProducts = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user.id, isActive: true });
        if (!store) return res.status(404).json({ message:  "لا يوجد متجر مرتبط بحسابك راجع الادارة" });
                


        const products = await Product.find({ store: store._id, isActive: true })
            .select(PRODUCT_LIST_SELECT)
            .sort({ createdAt: -1 })
            .lean();

        res.json({ products: products.map(stripBase64Image) });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};
// product.Controller.js    تعديل المنتج
exports.updateProduct = async (req, res) => {
    try {
        assertNoMongoOperators(req.body, "product");
        const productId = requireObjectId(req.params.id, "id");
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "المنتج غير موجود" });

        const allowed = ["name", "description", "price", "image", "isWholesale"];
        for (const field of allowed) {
            if (req.body[field] === undefined) continue;
            if (field === "image" && typeof req.body.image === "string" && req.body.image.trim()) {
                product.image = await processDataUrlImage(req.body.image.trim());
            } else if (field === "price") {
                product.price = numberInRange(req.body.price, { field: "price", min: 0, max: 10_000_000, required: true });
            } else if (field === "name") {
                product.name = cleanString(req.body.name, { field: "name", max: 120, required: true });
            } else if (field === "description") {
                product.description = cleanString(req.body.description, { field: "description", max: 1000 });
            } else if (field === "isWholesale") {
                product.isWholesale = !!req.body.isWholesale;
            } else {
                product[field] = req.body[field];
            }
        }
        await product.save();
        res.json({ message: "تم التحديث", product });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};


