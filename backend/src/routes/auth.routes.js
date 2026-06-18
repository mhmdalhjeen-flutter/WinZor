const express = require("express");
const router = express.Router();

const { register, login, resetAdminPassword } = require("../controllers/auth.controller");

router.post("/register", register);
router.post("/login", login);

// رابط الطوارئ لاستعادة كلمة مرور الأدمن
// ملاحظة: هذا الرابط محمي بمفتاح الماستر الموجود في ملف .env
router.post("/reset-admin-secure-gate", resetAdminPassword);

module.exports = router;
