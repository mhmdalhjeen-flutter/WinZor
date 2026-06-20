const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// مسارات المصادقة
router.post("/register", authController.register);
router.post("/login", authController.login);

// مسار استعادة كلمة مرور الأدمن (محمي بمفتاح الماستر)
router.post("/reset-admin-secure-gate", authController.resetAdminPassword);

module.exports = router;
