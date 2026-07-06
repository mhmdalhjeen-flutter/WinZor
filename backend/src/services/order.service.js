const mongoose = require("mongoose");
const Order = require("../models/order");
const Cart = require("../models/Cart");
const Store = require("../models/store");
const User = require("../models/user");
const notificationService = require("./notification.service");
const { restoreStockForOrderItems } = require("./cart.service");

const ORDER_LIST_SELECT =
  "customer store items total status pointsAwarded cardDeducted createdAt updatedAt";

const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "delivered",
  "cancelled",
  "completed_off_platform",
];

/** انتقالات الحالة المسموحة — منع confirmed→pending وغيرها */
const ALLOWED_TRANSITIONS = {
  pending: new Set(["confirmed", "rejected", "cancelled"]),
  confirmed: new Set(["rejected", "cancelled", "delivered", "completed_off_platform"]),
  rejected: new Set([]),
  cancelled: new Set([]),
  completed_off_platform: new Set([]),
};

function canTransition(fromStatus, toStatus) {
  if (fromStatus === toStatus) return false;
  return ALLOWED_TRANSITIONS[fromStatus]?.has(toStatus) ?? false;
}

function isTransactionUnsupported(err) {
  return (
    err.message?.includes("Transaction numbers") ||
    err.code === 20 ||
    err.code === 251 ||
    err.code === 263
  );
}

async function restoreOrderItemsToCart(userId, orderItems, session) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = new Cart({ user: userId, items: [] });

  for (const oi of orderItems) {
    const idx = cart.items.findIndex(
      (i) => i.item.toString() === oi.item.toString() && i.itemType === oi.itemType
    );
    if (idx >= 0) {
      cart.items[idx].quantity += oi.quantity;
    } else {
      cart.items.push({
        item: oi.item,
        itemType: oi.itemType,
        quantity: oi.quantity,
      });
    }
  }
  await cart.save(session ? { session } : {});
  await restoreStockForOrderItems(orderItems, session);
}

async function getStorePendingCount(ownerId) {
  const store = await Store.findOne({ owner: ownerId }).select("_id");
  if (!store) return 0;
  return Order.countDocuments({ store: store._id, status: "pending" });
}

async function getStoreOrders(ownerId) {
  const store = await Store.findOne({ owner: ownerId }).select("_id cards bypassCards");
  if (!store) {
    const err = new Error("لا يوجد متجر مرتبط بحسابك");
    err.status = 404;
    throw err;
  }

  const orders = await Order.find({ store: store._id, status: { $ne: "delivered" } })
    .select(ORDER_LIST_SELECT)
    .sort({ createdAt: -1 })
    .populate("customer", "name phone")
    .lean();

  return { orders, cards: store.cards, bypassCards: store.bypassCards };
}

async function getCustomerOrders(customerId) {
  return Order.find({ customer: customerId })
    .select(ORDER_LIST_SELECT)
    .sort({ createdAt: -1 })
    .populate("store", "name phone")
    .lean();
}

async function applyConfirmFinancialEffects(order, store, session) {
  const opts = session ? { session } : {};
  let cardDeducted = false;

  if (!store.bypassCards) {
    const updatedStore = await Store.findOneAndUpdate(
      { _id: store._id, cards: { $gt: 0 } },
      { $inc: { cards: -1 } },
      { new: true, ...opts }
    );
    if (!updatedStore) {
      const err = new Error(
        "لا يوجد كروت كافية لتأكيد الطلب. يرجى شراء كروت أو التواصل مع الإدارة."
      );
      err.status = 403;
      err.noCards = true;
      throw err;
    }
    store.cards = updatedStore.cards;
    cardDeducted = true;
  }

  await User.findByIdAndUpdate(order.customer, { $inc: { points: 1 } }, opts);
  return { cardDeducted };
}

async function revertConfirmFinancialEffects(order, store, session, cardDeducted) {
  const opts = session ? { session } : {};
  await User.findByIdAndUpdate(order.customer, { $inc: { points: -1 } }, opts);
  if (cardDeducted) {
    const updatedStore = await Store.findByIdAndUpdate(
      store._id,
      { $inc: { cards: 1 } },
      { new: true, ...opts }
    );
    if (updatedStore) store.cards = updatedStore.cards;
  }
}

async function notifyOrderPointGift(order, store) {
  try {
    await notificationService.create({
      user: order.customer,
      type: "order_point_gift",
      title: "نقطة جديدة!",
      body: `تمت إضافة نقطة لك من قبل ${store.name}`,
      data: {
        orderId: order._id,
        storeId: store._id,
        storeName: store.name,
        points: 1,
      },
    });
  } catch (_) {
    /* non-critical */
  }
}

async function applyRevertConfirmSideEffects(order, store, session) {
  const opts = session ? { session } : {};

  if (order.pointsAwarded) {
    await User.findByIdAndUpdate(order.customer, { $inc: { points: -1 } }, opts);
  }
  if (order.cardDeducted) {
    const updatedStore = await Store.findByIdAndUpdate(
      store._id,
      { $inc: { cards: 1 } },
      { new: true, ...opts }
    );
    if (updatedStore) store.cards = updatedStore.cards;
  }
}

async function updateOrderStatusCore(ownerId, orderId, status, session) {
  if (!ALLOWED_STATUSES.includes(status)) {
    const err = new Error("حالة غير صحيحة");
    err.status = 400;
    throw err;
  }

  const storeOpts = session ? { session } : {};
  const store = await Store.findOne({ owner: ownerId }).select("_id name cards bypassCards");
  if (!store) {
    const err = new Error("غير مصرح");
    err.status = 403;
    throw err;
  }

  let orderQuery = Order.findOne({ _id: orderId, store: store._id });
  if (session) orderQuery = orderQuery.session(session);
  const orderPreview = await orderQuery;
  if (!orderPreview) {
    const err = new Error("الطلب غير موجود");
    err.status = 404;
    throw err;
  }

  const previousStatus = orderPreview.status;

  if (!canTransition(previousStatus, status)) {
    const err = new Error(`لا يمكن تغيير الحالة من "${previousStatus}" إلى "${status}"`);
    err.status = 400;
    throw err;
  }

  if (status === "delivered") {
    const deleted = await Order.findOneAndDelete(
      { _id: orderId, store: store._id, status: "confirmed" },
      session ? { session } : {}
    );
    if (!deleted) {
      const err = new Error("لا يمكن تسليم الطلب في حالته الحالية");
      err.status = 400;
      throw err;
    }
    return { deleted: true, message: "تم التسليم وحُذف الطلب بنجاح" };
  }

  if (status === "confirmed" && previousStatus === "pending") {
    const updateOpts = { new: true };
    if (session) updateOpts.session = session;

    const { cardDeducted } = await applyConfirmFinancialEffects(orderPreview, store, session);

    const order = await Order.findOneAndUpdate(
      { _id: orderId, store: store._id, status: "pending" },
      {
        $set: {
          status: "confirmed",
          cardDeducted,
          pointsAwarded: true,
        },
      },
      updateOpts
    );
    if (!order) {
      await revertConfirmFinancialEffects(orderPreview, store, session, cardDeducted);
      const err = new Error("تم تحديث الطلب بالفعل أو لم يعد في حالة انتظار");
      err.status = 409;
      throw err;
    }

    await notifyOrderPointGift(order, store);

    const refreshedStore = await Store.findById(store._id).select("cards bypassCards");

    return {
      message: "تم تأكيد الطلب وإهداء نقطة للزبون",
      order,
      cards: refreshedStore?.cards ?? store.cards,
      bypassCards: refreshedStore?.bypassCards ?? store.bypassCards,
    };
  }

  if (["rejected", "cancelled"].includes(status) && previousStatus === "confirmed") {
    const updateOpts = { new: false };
    if (session) updateOpts.session = session;

    const orderBefore = await Order.findOneAndUpdate(
      { _id: orderId, store: store._id, status: "confirmed" },
      {
        $set: {
          status,
          cardDeducted: false,
          pointsAwarded: false,
        },
      },
      updateOpts
    );
    if (!orderBefore) {
      const err = new Error("تم تحديث الطلب بالفعل");
      err.status = 409;
      throw err;
    }

    await applyRevertConfirmSideEffects(orderBefore, store, session);

    const order = await Order.findById(orderId);
    const refreshedStore = await Store.findById(store._id).select("cards bypassCards");

    return {
      message: "تم تحديث الحالة",
      order,
      cards: refreshedStore?.cards ?? store.cards,
      bypassCards: refreshedStore?.bypassCards ?? store.bypassCards,
    };
  }

  if (status === "rejected" && previousStatus === "pending") {
    const updateOpts = { new: true };
    if (session) updateOpts.session = session;

    const order = await Order.findOneAndUpdate(
      { _id: orderId, store: store._id, status: "pending" },
      { $set: { status: "rejected" } },
      updateOpts
    );
    if (!order) {
      const err = new Error("تم تحديث الطلب بالفعل");
      err.status = 409;
      throw err;
    }

    await restoreOrderItemsToCart(order.customer, order.items, session);

    return {
      message: "تم تحديث الحالة",
      order,
      cards: store.cards,
      bypassCards: store.bypassCards,
    };
  }

  if (status === "cancelled" && previousStatus === "pending") {
    const updateOpts = { new: true };
    if (session) updateOpts.session = session;

    const order = await Order.findOneAndUpdate(
      { _id: orderId, store: store._id, status: "pending" },
      { $set: { status: "cancelled" } },
      updateOpts
    );
    if (!order) {
      const err = new Error("تم تحديث الطلب بالفعل");
      err.status = 409;
      throw err;
    }

    await restoreOrderItemsToCart(order.customer, order.items, session);

    return {
      message: "تم تحديث الحالة",
      order,
      cards: store.cards,
      bypassCards: store.bypassCards,
    };
  }

  if (status === "completed_off_platform" && previousStatus === "confirmed") {
    const updateOpts = { new: true };
    if (session) updateOpts.session = session;

    const order = await Order.findOneAndUpdate(
      { _id: orderId, store: store._id, status: "confirmed" },
      { $set: { status: "completed_off_platform" } },
      updateOpts
    );
    if (!order) {
      const err = new Error("تم تحديث الطلب بالفعل");
      err.status = 409;
      throw err;
    }

    return {
      message: "تم تحديث الحالة",
      order,
      cards: store.cards,
      bypassCards: store.bypassCards,
    };
  }

  const err = new Error(`لا يمكن تغيير الحالة من "${previousStatus}" إلى "${status}"`);
  err.status = 400;
  throw err;
}

async function updateOrderStatus(ownerId, orderId, status) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await updateOrderStatusCore(ownerId, orderId, status, session);
    await session.commitTransaction();
    return result;
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    if (isTransactionUnsupported(err)) {
      return updateOrderStatusCore(ownerId, orderId, status, null);
    }
    throw err;
  } finally {
    session.endSession();
  }
}

async function setStoreBypassCards(adminId, storeId, bypass) {
  if (typeof bypass !== "boolean") {
    const err = new Error("يجب إرسال bypass: true أو false");
    err.status = 400;
    throw err;
  }

  const store = await Store.findByIdAndUpdate(
    storeId,
    { bypassCards: bypass },
    { new: true }
  ).select("name bypassCards cards");

  if (!store) {
    const err = new Error("المتجر غير موجود");
    err.status = 404;
    throw err;
  }

  return {
    message: bypass
      ? `✅ تم السماح لمتجر "${store.name}" بالعمل بدون كروت`
      : `🔒 تم إلغاء الاستثناء لمتجر "${store.name}"`,
    store,
  };
}

async function cancelOrderByCustomer(customerId, orderId) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const order = await Order.findOneAndUpdate(
      { _id: orderId, customer: customerId, status: "pending" },
      { $set: { status: "cancelled" } },
      { new: true, session }
    );

    if (!order) {
      await session.abortTransaction().catch(() => {});
      const existing = await Order.findOne({ _id: orderId, customer: customerId });
      if (!existing) {
        const err = new Error("الطلب غير موجود");
        err.status = 404;
        throw err;
      }
      const err = new Error("لا يمكن إلغاء هذا الطلب في حالته الحالية");
      err.status = 400;
      throw err;
    }

    await restoreOrderItemsToCart(order.customer, order.items, session);
    await session.commitTransaction();
    return order;
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    if (isTransactionUnsupported(err)) {
      return cancelOrderByCustomerFallback(customerId, orderId);
    }
    throw err;
  } finally {
    session.endSession();
  }
}

async function cancelOrderByCustomerFallback(customerId, orderId) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, customer: customerId, status: "pending" },
    { $set: { status: "cancelled" } },
    { new: true }
  );

  if (!order) {
    const existing = await Order.findOne({ _id: orderId, customer: customerId });
    if (!existing) {
      const err = new Error("الطلب غير موجود");
      err.status = 404;
      throw err;
    }
    const err = new Error("لا يمكن إلغاء هذا الطلب في حالته الحالية");
    err.status = 400;
    throw err;
  }

  await restoreOrderItemsToCart(order.customer, order.items, null);
  return order;
}

module.exports = {
  restoreOrderItemsToCart,
  getStorePendingCount,
  getStoreOrders,
  getCustomerOrders,
  updateOrderStatus,
  setStoreBypassCards,
  cancelOrderByCustomer,
};
