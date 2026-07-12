const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/product");
const Offer = require("../models/offer");
const Store = require("../models/store");
const Order = require("../models/order");
const pricingService = require("./pricing.service");
const cache = require("../utils/responseCache.util");
const { assertNoMongoOperators, requireObjectId, cleanString } = require("../utils/inputSecurity.util");

function invalidateCartCache(userId) {
  if (userId) cache.invalidate(`cart:${userId}`);
}

const TYPE_MAP = {
  product: "Product",
  Product: "Product",
  offer: "Offer",
  Offer: "Offer",
};

function normalizeItemType(itemType) {
  return TYPE_MAP[itemType] || null;
}

/** stock > 0 = مخزون مُدار؛ stock === 0 = بدون حد (منتجات قديمة) */
function isStockManaged(stock) {
  return typeof stock === "number" && stock > 0;
}

function parsePositiveQuantity(quantity, label = "الكمية") {
  const qty = parseInt(quantity, 10);
  if (!Number.isFinite(qty) || qty < 1) {
    const err = new Error(`${label} يجب أن تكون 1 على الأقل`);
    err.status = 400;
    throw err;
  }
  return qty;
}

async function getProductStockInfo(productId) {
  const product = await Product.findById(productId).select("name stock isActive");
  if (!product) {
    const err = new Error("المنتج غير موجود");
    err.status = 404;
    throw err;
  }
  if (product.isActive === false) {
    const err = new Error("هذا المنتج غير متاح");
    err.status = 400;
    throw err;
  }
  return product;
}

async function assertProductsStockAvailable(productQty) {
  if (productQty.size === 0) return;
  const ids = [...productQty.keys()];
  const products = await Product.find({ _id: { $in: ids } }).select("name stock isActive").lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  for (const [productId, qty] of productQty) {
    const product = productMap.get(productId);
    if (!product) {
      const err = new Error("المنتج غير موجود");
      err.status = 404;
      throw err;
    }
    if (product.isActive === false) {
      const err = new Error("هذا المنتج غير متاح");
      err.status = 400;
      throw err;
    }
    if (!isStockManaged(product.stock)) continue;
    if (qty > product.stock) {
      const err = new Error(
        `الكمية المطلوبة (${qty}) أكبر من المتوفر (${product.stock}) — ${product.name}`
      );
      err.status = 400;
      throw err;
    }
  }
}

async function assertProductStockAvailable(productId, quantityNeeded) {
  await assertProductsStockAvailable(new Map([[productId.toString(), quantityNeeded]]));
  return getProductStockInfo(productId);
}

async function deductProductStock(productId, quantity, session) {
  const opts = session ? { session, new: true } : { new: true };
  const updated = await Product.findOneAndUpdate(
    { _id: productId, stock: { $gte: quantity } },
    { $inc: { stock: -quantity } },
    opts
  );
  if (!updated) {
    const product = await Product.findById(productId).select("name stock");
    const err = new Error(
      product
        ? `الكمية المطلوبة (${quantity}) أكبر من المتوفر (${product.stock ?? 0}) — ${product.name}`
        : "المنتج غير موجود"
    );
    err.status = 400;
    throw err;
  }
  return updated;
}

async function restoreProductStock(productId, quantity, session) {
  const opts = session ? { session } : {};
  await Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } }, opts);
}

async function restoreStockForOrderItems(orderItems, session) {
  const opts = session ? { session } : {};
  const productQty = new Map();
  for (const oi of orderItems) {
    if (oi.itemType !== "Product") continue;
    const id = oi.item.toString();
    productQty.set(id, (productQty.get(id) || 0) + oi.quantity);
  }
  for (const [productId, qty] of productQty) {
    await Product.findByIdAndUpdate(productId, { $inc: { stock: qty } }, opts);
  }
}

async function deductStockForOrderItems(items, session) {
  const productQty = new Map();
  for (const item of items) {
    if (item.itemType !== "Product") continue;
    const id = item.item.toString();
    productQty.set(id, (productQty.get(id) || 0) + item.quantity);
  }

  const deducted = [];
  if (productQty.size === 0) return deducted;

  const ids = [...productQty.keys()];
  let productQuery = Product.find({ _id: { $in: ids } }).select("stock name");
  if (session) productQuery = productQuery.session(session);
  const products = await productQuery.lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  for (const [productId, qty] of productQty) {
    const product = productMap.get(productId);
    if (!product || !isStockManaged(product.stock)) continue;
    await deductProductStock(productId, qty, session);
    deducted.push({ productId, qty });
  }
  return deducted;
}

async function restoreStockDeductions(deductions, session) {
  for (const { productId, qty } of deductions) {
    await restoreProductStock(productId, qty, session);
  }
}

function enrichCartItemDoc(doc, itemType) {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : { ...doc };

  if (itemType === "Offer") {
    const pricing = pricingService.buildOfferPricingDTO(plain);
    plain.pricing = pricing;
    plain.price = pricing.unitPrice;
  }

  return plain;
}

async function populateCartItems(items) {
  if (!items?.length) return [];

  const productIds = [];
  const offerIds = [];
  for (const cartItem of items) {
    const id = cartItem.item?.toString?.() ?? String(cartItem.item);
    if (cartItem.itemType === "Product") productIds.push(id);
    else if (cartItem.itemType === "Offer") offerIds.push(id);
  }

  const [products, offers] = await Promise.all([
    productIds.length
      ? Product.find({ _id: { $in: productIds } })
          .select("name price currency image images description isActive store stock")
          .lean()
      : [],
    offerIds.length
      ? Offer.find({ _id: { $in: offerIds } })
          .select(
            "title finalPrice price image images description isActive store value offerType originalPrice currency"
          )
          .lean()
      : [],
  ]);

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));
  const offerMap = new Map(offers.map((o) => [o._id.toString(), o]));

  const storeIds = new Set();
  for (const doc of [...products, ...offers]) {
    if (doc.store) storeIds.add(doc.store.toString());
  }

  const stores = storeIds.size
    ? await Store.find({ _id: { $in: [...storeIds] } })
        .select("name region phone owner")
        .populate({ path: "owner", select: "role name" })
        .lean()
    : [];
  const storeMap = new Map(stores.map((s) => [s._id.toString(), s]));

  function attachStore(doc) {
    if (!doc?.store) return doc;
    const store = storeMap.get(doc.store.toString());
    return store ? { ...doc, store } : doc;
  }

  return items.map((cartItem) => {
    try {
      const id = cartItem.item?.toString?.() ?? String(cartItem.item);
      let doc = null;

      if (cartItem.itemType === "Product") {
        doc = attachStore(productMap.get(id) || null);
      } else if (cartItem.itemType === "Offer") {
        doc = enrichCartItemDoc(attachStore(offerMap.get(id) || null), "Offer");
      }

      const unitPrice =
        cartItem.itemType === "Offer"
          ? pricingService.getOfferUnitPrice(doc)
          : doc?.price ?? 0;
      const lineTotal =
        cartItem.itemType === "Offer"
          ? pricingService.computeOfferLineTotal(doc, cartItem.quantity)
          : Math.round(unitPrice * cartItem.quantity * 100) / 100;

      return {
        item: doc,
        itemType: cartItem.itemType,
        quantity: cartItem.quantity,
        unitPrice,
        lineTotal,
      };
    } catch {
      return {
        item: null,
        itemType: cartItem.itemType,
        quantity: cartItem.quantity,
        unitPrice: 0,
        lineTotal: 0,
      };
    }
  });
}

function calculateCartTotal(populatedItems) {
  return populatedItems.reduce((sum, row) => {
    if (!row.item || row.item.isActive === false) return sum;
    return sum + (row.lineTotal ?? (row.unitPrice || 0) * row.quantity);
  }, 0);
}

function filterValidCheckoutItems(populatedItems, userRole = "customer") {
  return populatedItems.filter((row) => {
    if (!row.item || row.item.isActive === false) return false;
    const ownerRole = row.item.store?.owner?.role;
    if (userRole === "store" || userRole === "supplier") {
      return ownerRole === "store" || ownerRole === "supplier";
    }
    return ownerRole === "store";
  });
}

async function restoreCartSnapshot(userId, cartItems, session) {
  if (!cartItems?.length) return;
  const opts = session ? { session } : {};
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }
  for (const ci of cartItems) {
    const idx = cart.items.findIndex(
      (i) => i.item.toString() === ci.item.toString() && i.itemType === ci.itemType
    );
    if (idx >= 0) {
      cart.items[idx].quantity += ci.quantity;
    } else {
      cart.items.push({
        item: ci.item,
        itemType: ci.itemType,
        quantity: ci.quantity,
      });
    }
  }
  await cart.save(opts);
}

const CHECKOUT_DEDUP_MS = 60_000;

async function assertNoRecentDuplicateOrders(userId, orderPayloads, session) {
  if (!orderPayloads.length) return;
  const since = new Date(Date.now() - CHECKOUT_DEDUP_MS);
  const queryOpts = session ? { session } : {};
  const duplicate = await Order.findOne(
    {
      customer: userId,
      status: "pending",
      createdAt: { $gte: since },
      $or: orderPayloads.map((p) => ({ store: p.store, total: p.total })),
    },
    null,
    queryOpts
  );
  if (duplicate) {
    const err = new Error("طلب مكرر — تم استلام طلبك مسبقاً");
    err.status = 409;
    err.code = "DUPLICATE_ORDER";
    throw err;
  }
}

async function buildOrdersFromCartItems(userId, cartItems, session, userRole = "customer") {
  const populatedItems = await populateCartItems(cartItems);
  const validItems = filterValidCheckoutItems(populatedItems, userRole);

  if (validItems.length === 0) {
    const err = new Error(
      userRole === "customer"
        ? "لا توجد منتجات متاحة في السلة (عروض أصحاب المحلات فقط)"
        : "لا توجد منتجات متاحة في السلة"
    );
    err.status = 400;
    throw err;
  }

  const storeMap = {};
  for (const ci of validItems) {
    const storeId = ci.item.store?._id?.toString();
    if (!storeId) continue;
    if (!storeMap[storeId]) storeMap[storeId] = { storeId, items: [] };

    const lineTotal = ci.lineTotal ?? (ci.unitPrice || 0) * ci.quantity;
    const effectiveUnit =
      ci.quantity > 0
        ? Math.round((lineTotal / ci.quantity) * 100) / 100
        : ci.unitPrice ?? 0;

    storeMap[storeId].items.push({
      item: ci.item._id,
      itemType: ci.itemType,
      quantity: ci.quantity,
      price: effectiveUnit,
      name: ci.item.name || ci.item.title || "",
      _lineTotal: lineTotal,
    });
  }

  const productQty = new Map();
  for (const ci of validItems) {
    if (ci.itemType !== "Product") continue;
    const id = ci.item._id.toString();
    productQty.set(id, (productQty.get(id) || 0) + ci.quantity);
  }
  await assertProductsStockAvailable(productQty);

  const orderPayloads = Object.values(storeMap).map(({ storeId, items }) => {
    const storeTotal = items.reduce((s, i) => s + i._lineTotal, 0);
    return {
      store: storeId,
      total: Math.round(storeTotal * 100) / 100,
    };
  });
  await assertNoRecentDuplicateOrders(userId, orderPayloads, session);

  let stockDeductions = [];
  try {
    stockDeductions = await deductStockForOrderItems(
      validItems.map((ci) => ({
        item: ci.item._id,
        itemType: ci.itemType,
        quantity: ci.quantity,
      })),
      session
    );

    const orders = [];
    for (const { storeId, items } of Object.values(storeMap)) {
      const storeTotal = items.reduce((s, i) => s + i._lineTotal, 0);
      const orderItems = items.map(({ _lineTotal, ...rest }) => rest);
      const payload = {
        customer: userId,
        store: storeId,
        items: orderItems,
        total: Math.round(storeTotal * 100) / 100,
        status: "pending",
      };
      if (session) {
        const created = await Order.create([payload], { session });
        orders.push(created[0]);
      } else {
        orders.push(await Order.create(payload));
      }
    }

    return orders;
  } catch (err) {
    await restoreStockDeductions(stockDeductions, session);
    throw err;
  }
}

async function checkoutCore(userId, session, userRole = "customer") {
  let cartQuery = Cart.findOneAndUpdate(
    { user: userId, "items.0": { $exists: true } },
    { $set: { items: [] } },
    { new: false }
  );
  if (session) cartQuery = cartQuery.session(session);

  const cart = await cartQuery;
  if (!cart || !cart.items.length) {
    const err = new Error("السلة فارغة");
    err.status = 400;
    throw err;
  }

  const snapshot = cart.items.map((i) => ({
    item: i.item,
    itemType: i.itemType,
    quantity: i.quantity,
  }));

  try {
    const orders = await buildOrdersFromCartItems(userId, snapshot, session, userRole);
    return {
      ordersCount: orders.length,
      orders: orders.map((o) => ({
        id: o._id,
        store: o.store,
        total: o.total,
        status: o.status,
      })),
    };
  } catch (err) {
    if (!session) {
      await restoreCartSnapshot(userId, snapshot, null);
    }
    throw err;
  }
}

async function getCartForUser(userId) {
  const cart = await Cart.findOne({ user: userId }).lean();
  if (!cart || cart.items.length === 0) {
    return { items: [], total: 0 };
  }

  const populatedItems = await populateCartItems(cart.items);
  const validItems = populatedItems.filter((i) => i.item && i.item.isActive !== false);
  const total = calculateCartTotal(validItems);

  return { items: validItems, total };
}

async function addToCart(user, body) {
  assertNoMongoOperators(body, "cart");
  const itemId = requireObjectId(body.itemId, "itemId");
  const itemType = cleanString(body.itemType, { field: "itemType", max: 20, required: true });
  const quantity = body.quantity ?? 1;

  const normalizedType = normalizeItemType(itemType);
  if (!normalizedType) {
    const err = new Error("itemType غير صحيح");
    err.status = 400;
    throw err;
  }

  const Model = normalizedType === "Product" ? Product : Offer;
  const exists = await Model.findById(itemId)
    .select("_id isActive store stock")
    .populate({ path: "store", populate: { path: "owner", select: "role" } });

  if (!exists) {
    const err = new Error("العنصر غير موجود");
    err.status = 404;
    throw err;
  }
  if (exists.isActive === false) {
    const err = new Error("هذا العنصر غير متاح");
    err.status = 400;
    throw err;
  }
  if (user.role === "customer" && exists.store?.owner?.role === "supplier") {
    const err = new Error("هذا العرض/المنتج غير متاح للزبائن — أصحاب المحلات فقط");
    err.status = 403;
    throw err;
  }

  let cart = await Cart.findOne({ user: user.id });
  if (!cart) cart = new Cart({ user: user.id, items: [] });

  const qty = parsePositiveQuantity(quantity);
  const idx = cart.items.findIndex(
    (i) => i.item.toString() === itemId && i.itemType === normalizedType
  );

  const nextQty = idx >= 0 ? cart.items[idx].quantity + qty : qty;
  if (normalizedType === "Product") {
    await assertProductStockAvailable(itemId, nextQty);
  }

  if (idx >= 0) {
    cart.items[idx].quantity += qty;
  } else {
    cart.items.push({ item: itemId, itemType: normalizedType, quantity: qty });
  }

  await cart.save();
  invalidateCartCache(user.id);

  const populatedItems = await populateCartItems(cart.items);
  const total = calculateCartTotal(
    populatedItems.filter((i) => i.item && i.item.isActive !== false)
  );

  return { items: populatedItems, total };
}

async function updateCartItem(userId, body) {
  assertNoMongoOperators(body, "cart");
  const itemId = requireObjectId(body.itemId, "itemId");
  const itemType = cleanString(body.itemType, { field: "itemType", max: 20, required: true });
  const qty = parsePositiveQuantity(body.quantity);

  const normalizedType = normalizeItemType(itemType);
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    const err = new Error("السلة غير موجودة");
    err.status = 404;
    throw err;
  }

  const idx = cart.items.findIndex(
    (i) => i.item.toString() === itemId && i.itemType === normalizedType
  );
  if (idx === -1) {
    const err = new Error("العنصر غير موجود في السلة");
    err.status = 404;
    throw err;
  }

  if (normalizedType === "Product") {
    await assertProductStockAvailable(itemId, qty);
  }

  cart.items[idx].quantity = qty;
  await cart.save();
  invalidateCartCache(userId);

  return getCartForUser(userId);
}

async function removeFromCart(userId, body) {
  assertNoMongoOperators(body, "cart");
  const itemId = requireObjectId(body.itemId, "itemId");
  const itemType = cleanString(body.itemType, { field: "itemType", max: 20, required: true });

  const normalizedType = normalizeItemType(itemType);
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    const err = new Error("السلة غير موجودة");
    err.status = 404;
    throw err;
  }

  cart.items = cart.items.filter(
    (i) => !(i.item.toString() === itemId && i.itemType === normalizedType)
  );
  await cart.save();
  invalidateCartCache(userId);

  return getCartForUser(userId);
}

async function clearCart(userId) {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) return { items: [], total: 0 };
  cart.items = [];
  await cart.save();
  invalidateCartCache(userId);
  return { items: [], total: 0 };
}

async function checkout(userId, userRole = "customer") {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await checkoutCore(userId, session, userRole);
    await session.commitTransaction();
    invalidateCartCache(userId);
    return result;
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    if (
      err.message?.includes("Transaction numbers") ||
      err.code === 20 ||
      err.code === 251 ||
      err.code === 263
    ) {
      const result = await checkoutCore(userId, null, userRole);
      invalidateCartCache(userId);
      return result;
    }
    throw err;
  } finally {
    session.endSession();
  }
}

module.exports = {
  populateCartItems,
  calculateCartTotal,
  getCartForUser,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  checkout,
  restoreStockForOrderItems,
};
