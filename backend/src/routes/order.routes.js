const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const orderService = require("../services/order.service");
const auditService = require("../services/audit.service");
const { requireObjectId, assertNoMongoOperators } = require("../utils/inputSecurity.util");

router.use(authMiddleware);

function handleServiceError(res, err) {
  const status = err.status || 500;
  const body = { message: err.message || "حدث خطأ في الخادم" };
  if (err.noCards) body.noCards = true;
  return res.status(status).json(body);
}

router.get("/store/pending-count", roleMiddleware.business, async (req, res) => {
  try {
    const count = await orderService.getStorePendingCount(req.user.id);
    res.json({ count });
  } catch (err) {
    handleServiceError(res, err);
  }
});

router.get("/store", roleMiddleware.business, async (req, res) => {
  try {
    const data = await orderService.getStoreOrders(req.user.id);
    res.json(data);
  } catch (err) {
    handleServiceError(res, err);
  }
});

router.get("/my", roleMiddleware.customer, async (req, res) => {
  try {
    const orders = await orderService.getCustomerOrders(req.user.id);
    res.json({ orders });
  } catch (err) {
    handleServiceError(res, err);
  }
});

router.patch("/:id/status", roleMiddleware.business, async (req, res) => {
  try {
    assertNoMongoOperators(req.body, "order");
    const orderId = requireObjectId(req.params.id, "id");
    const result = await orderService.updateOrderStatus(
      req.user.id,
      orderId,
      req.body.status
    );
    if (["confirmed", "rejected", "cancelled"].includes(req.body.status)) {
      await auditService.logSensitiveOperation(req, {
        action: `تحديث حالة طلب — ${req.body.status}`,
        details: `طلب ${orderId}`,
        metadata: { orderId: String(orderId), status: req.body.status },
      });
    }
    if (result.deleted) {
      return res.json({ message: result.message, deleted: true });
    }
    res.json(result);
  } catch (err) {
    handleServiceError(res, err);
  }
});

router.patch("/admin/bypass/:storeId", roleMiddleware.admin, async (req, res) => {
  try {
    assertNoMongoOperators(req.body, "order");
    const storeId = requireObjectId(req.params.storeId, "storeId");
    if (typeof req.body.bypass !== "boolean") {
      return res.status(400).json({ message: "يجب إرسال bypass: true أو false" });
    }
    const result = await orderService.setStoreBypassCards(
      req.user.id,
      storeId,
      req.body.bypass
    );
    res.json(result);
  } catch (err) {
    handleServiceError(res, err);
  }
});

router.patch("/:id/cancel", roleMiddleware.customer, async (req, res) => {
  try {
    const orderId = requireObjectId(req.params.id, "id");
    const order = await orderService.cancelOrderByCustomer(req.user.id, orderId);
    await auditService.logSensitiveOperation(req, {
      action: "إلغاء طلب من الزبون",
      details: `طلب ${orderId}`,
      metadata: { orderId: String(orderId) },
    });
    res.json({ message: "تم إلغاء الطلب", order });
  } catch (err) {
    handleServiceError(res, err);
  }
});

module.exports = router;
