const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");

// جلب بياناتي الشخصية
router.get("/me", authMiddleware, userController.getMe);

// تحديث ملفي الشخصي (الاسم، الأيقونة)
router.patch("/update-profile", authMiddleware, userController.updateProfile);

// تبديل البطاقة بنقاط XP
router.post("/redeem-card", authMiddleware, userController.redeemCard);

module.exports = router;
