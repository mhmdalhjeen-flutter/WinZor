const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");

// حماية جميع المسارات التالية: يجب أن يكون المستخدم مسجلاً ودوره "admin"
router.use(authMiddleware);
router.use(roleMiddleware(["admin"]));

// --- إحصائيات عامة ---
router.get("/stats", adminController.getStats);

// --- إدارة الأكواد ---
router.post("/generate-activation-code", adminController.generateActivationCode);
router.post("/generate-bulk-codes", adminController.generateBulkCodes);

// --- إدارة المتاجر ---
router.get("/stores", adminController.getAllStores);
router.patch("/stores/:storeId/toggle-status", adminController.toggleStoreStatus);

// --- إدارة التصنيفات ---
router.get("/categories", adminController.getCategories);
router.post("/categories", adminController.addCategory);
router.delete("/categories/:id", adminController.deleteCategory);

// --- إدارة المناطق ---
router.get("/regions", adminController.getRegions);
router.post("/regions", adminController.addRegion);
router.patch("/regions/:id", adminController.updateRegion);

// --- إدارة السحوبات (Draws) ---
router.get("/draws", adminController.getAllDraws);
router.post("/draws", adminController.createDraw);
router.patch("/draws/:id", adminController.updateDraw);

// --- سجل النشاطات (Activity Logs) ---
router.get("/activity-logs", adminController.getActivityLogs);

module.exports = router;
