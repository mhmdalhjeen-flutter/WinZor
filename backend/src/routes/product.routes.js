// 🟢 Product Routes - إدارة المنتجات وسوق الجملة

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");

const {
    createProduct,
    getStoreProducts,
    getWholesaleProducts,
    searchProducts,
    deleteProduct
} = require("../controllers/product.Controller");

// ➕ إضافة منتج (صاحب متجر أو تاجر)
router.post("/", authMiddleware, createProduct);

// 🏪 عرض منتجات متجر معين (للزبائن)
router.get("/store/:storeId", getStoreProducts);

// 📦 سوق الجملة (حصرياً لأصحاب المتاجر المعتمدين)
router.get("/wholesale", authMiddleware, getWholesaleProducts);

// 🔍 بحث في المنتجات (للزباين)
router.get("/search", searchProducts);

// 🗑 حذف منتج
router.delete("/:id", authMiddleware, deleteProduct);

module.exports = router;
