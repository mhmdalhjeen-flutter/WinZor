const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

const {
    createPromoCode,
    redeemCode,
    redeemActivationCode,
    getCodeStats
} = require("../controllers/promoCode.Controller");

// ➕ إنشاء كود (لأصحاب المتاجر أو الأدمن)
router.post("/create", authMiddleware, createPromoCode);

// 🎟️ استخدام كود عادي (للحصول على نقاط/فرص وتوجيه للمحل)
router.post("/redeem", authMiddleware, redeemCode);

// 🔑 استخدام كود تفعيل (لتحويل نوع الحساب لمتجر أو تاجر)
router.post("/redeem-activation", authMiddleware, redeemActivationCode);

// 📊 إحصائيات الأكواد
router.get("/stats", authMiddleware, getCodeStats);

module.exports = router;
