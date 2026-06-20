const express = require("express");
const router = express.Router();
const honorController = require("../controllers/honor-board.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// مسار عام للجميع لرؤية لوحة الشرف
router.get("/active", honorController.getActiveHonorItems);

// مسارات الأدمن فقط للإدارة
router.post("/add", authMiddleware, roleMiddleware(["admin"]), honorController.addToHonorBoard);
router.patch("/toggle/:id", authMiddleware, roleMiddleware(["admin"]), honorController.toggleStatus);

module.exports = router;
