const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth.middleware");
const { getStoreAnalytics } = require("../controllers/store.controller");

// 📊 Dashboard
router.get("/dashboard", auth, getStoreAnalytics);

module.exports = router;