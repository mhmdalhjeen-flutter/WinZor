// routes/codeOrder.routes.js
const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/auth.middleware");
const role    = require("../middleware/role.middleware");
const ctrl    = require("../controllers/codeOrder.controller");

router.post("/",                   auth, role(["store", "supplier"]), ctrl.createCodeOrder);
router.get("/my",                  auth, role(["store", "supplier"]), ctrl.getMyOrders);
router.delete("/my/:id",           auth, role(["store", "supplier"]), ctrl.deleteMyOrder);
router.get("/admin/all",           auth, role(["admin"]),             ctrl.getAllOrders);
router.post("/admin/configure/:id",auth, role(["admin"]),             ctrl.configureOrder);
router.post("/admin/receive/:id", auth, role(["admin"]), ctrl.markAsReceived);
// في codeOrder.routes.js أضف:
router.get("/admin/export/:id", auth, role(["admin"]), ctrl.exportOrderCodes);

module.exports = router;