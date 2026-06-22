const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const boxAdminController = require("../controllers/box-admin.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const adminMiddleware = require("../middleware/admin.middleware");


const  {createStoreActivationCode}  = require("../controllers/activation.controller");
// حماية المسارات
router.use(authMiddleware);


console.log({
    authMiddleware,
    roleMiddleware,
    createStoreActivationCode
});
// 🟢 إنشاء كود تفعيل للمتجر (ADMIN فقط)
router.post(
    "/create-code",
    authMiddleware,
    roleMiddleware(["admin"]),
    createStoreActivationCode
);


// --- إعدادات الفيديو والإدهاش (جديد) ---
router.post("/settings/home-video", adminController.updateSystemSettings);
router.get("/settings", adminController.getSystemSettings);

// --- إدارة أنواع البطاقات الملونة ---
router.post("/cards", boxAdminController.createCardType);
router.get("/cards", boxAdminController.getCardTypes);

// --- إدارة صناديق الكنز ---
router.post("/treasure-boxes", boxAdminController.createTreasureBox);
router.get("/treasure-boxes", boxAdminController.getTreasureBoxes);

// --- إحصائيات عامة وتنبيهات الأمان ---
router.get("/stats", adminController.getStats);
router.get("/security-alerts", adminController.getSecurityAlerts);

// --- إدارة المستخدمين ---
router.get("/users/search", adminController.searchUsers);
router.patch("/users/update-manual", adminController.updateUserManually);

// --- إدارة الأكواد ---
router.post("/generate-bulk-codes", adminController.generateBulkCodes);

// --- إدارة المتاجر ---
router.get("/stores", adminController.getAllStores);
router.patch("/stores/:storeId/toggle-status", adminController.toggleStoreStatus);

// --- إدارة التصنيفات ---
router.get("/categories", adminController.getCategories);
router.post("/categories", adminController.addCategory);

// --- إدارة الفعاليات (Events/Draws) ---
router.get("/draws", adminController.getAllDraws);
router.post("/draws", adminController.createDraw);
router.patch("/draws/:drawId/approve", adminController.approveDraw);

// --- سجل النشاطات ---
router.get("/activity-logs", adminController.getActivityLogs);

router.get("/users", authMiddleware, adminController.getAllUsers);
router.delete("/users/:id", authMiddleware, adminMiddleware, adminController.deleteUser);
router.patch("/users/:id/ban", authMiddleware, adminMiddleware, adminController.banUser);
router.get("/users/count", authMiddleware, adminMiddleware, adminController.getUsersCount);

module.exports = router;
