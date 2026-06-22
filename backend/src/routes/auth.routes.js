const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// مسارات المصادقة
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleAuth);

module.exports = router;