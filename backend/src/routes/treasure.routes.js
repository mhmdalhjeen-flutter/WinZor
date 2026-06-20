const express = require("express");
const router = express.Router();
const treasureController = require("../controllers/treasure.controller");
const authMiddleware = require("../middleware/auth.middleware");

// جميع هذه المسارات تحتاج لتسجيل دخول
router.use(authMiddleware);

// جلب الصناديق المتاحة للمستخدم
router.get("/available", treasureController.getAvailableBoxes);

// فتح صندوق معين
router.post("/open/:boxId", treasureController.openBox);

module.exports = router;
