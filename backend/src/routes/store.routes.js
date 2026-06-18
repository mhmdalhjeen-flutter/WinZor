// 🟢 Store Routes - إدارة المتاجر + Dashboard

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");

const {
    createStore,
    getStoreById,
    getAllStores,
    getStoreDashboard
} = require("../controllers/store.controller");


// 🏪 إنشاء متجر (فقط أصحاب المتاجر)
router.post("/", authMiddleware, createStore);

// 📊 Dashboard المتجر (disabled: getStoreDashboard is missing from store.controller.js)
// router.get("/dashboard", authMiddleware, getStoreDashboard);


// 📦 جميع المتاجر
router.get("/", getAllStores);

// 🔍 متجر بواسطة ID
router.get("/:id", getStoreById);

module.exports = router;