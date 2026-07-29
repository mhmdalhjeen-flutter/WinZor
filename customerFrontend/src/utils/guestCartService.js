import { normalizeCartItemType, cartItemMatches, getStoreIdFromContainer } from './cartHelpers';

const GUEST_CART_KEY = 'winzor_guest_cart';

function emptyCart() {
  return { containers: [], total: 0 };
}

export function readGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.containers)) return emptyCart();
    return parsed;
  } catch {
    return emptyCart();
  }
}

function writeGuestCart(cart) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch {
    /* ignore quota errors */
  }
}

export function clearGuestCart() {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch {
    /* ignore */
  }
}

function computeTotal(containers) {
  let total = 0;
  for (const c of containers) {
    for (const row of c.items || []) {
      total += row.lineTotal ?? (row.unitPrice ?? 0) * (row.quantity ?? 0);
    }
  }
  return total;
}

function resolveStoreFromItem(item) {
  const store = item?.store || {};
  const storeId = store._id || store.id || item?.storeId || '';
  return {
    storeId: String(storeId),
    storeName: store.name || item?.storeName || 'متجر',
    store,
  };
}

function buildRow(item, itemType, quantity) {
  const unitPrice = item?.price ?? item?.finalPrice ?? item?.priceAfterDiscount ?? 0;
  return {
    item,
    itemType: normalizeCartItemType(itemType),
    quantity,
    unitPrice,
    lineTotal: unitPrice * quantity,
  };
}

export function addToGuestCart({ item, itemType, quantity = 1 }) {
  if (!item?._id) return readGuestCart();

  const cart = readGuestCart();
  const { storeId, storeName, store } = resolveStoreFromItem(item);
  const containers = [...(cart.containers || [])];
  let container = containers.find((c) => String(getStoreIdFromContainer(c)) === storeId);

  if (!container) {
    container = {
      store: storeId ? { _id: storeId, name: storeName, logo: store.logo } : store,
      storeName,
      items: [],
    };
    containers.push(container);
  }

  const items = [...(container.items || [])];
  const existingIdx = items.findIndex((row) => cartItemMatches(row, item._id, itemType));

  if (existingIdx >= 0) {
    const existing = items[existingIdx];
    const nextQty = Math.min(99, (existing.quantity || 0) + quantity);
    items[existingIdx] = buildRow(existing.item || item, itemType, nextQty);
  } else {
    items.push(buildRow(item, itemType, quantity));
  }

  container = { ...container, items };
  const nextContainers = containers.map((c) =>
    String(getStoreIdFromContainer(c)) === storeId ? container : c,
  );
  const nextCart = { containers: nextContainers, total: computeTotal(nextContainers) };
  writeGuestCart(nextCart);
  return nextCart;
}

export function updateGuestCartQty({ itemId, itemType, quantity }) {
  const cart = readGuestCart();
  const containers = (cart.containers || [])
    .map((container) => {
      const items = (container.items || [])
        .map((row) => {
          if (!cartItemMatches(row, itemId, itemType)) return row;
          if (quantity <= 0) return null;
          return buildRow(row.item, itemType, quantity);
        })
        .filter(Boolean);
      return items.length ? { ...container, items } : null;
    })
    .filter(Boolean);

  const nextCart = { containers, total: computeTotal(containers) };
  writeGuestCart(nextCart);
  return nextCart;
}

export function removeFromGuestCart({ itemId, itemType }) {
  return updateGuestCartQty({ itemId, itemType, quantity: 0 });
}

export function hasGuestCartItems() {
  const cart = readGuestCart();
  return (cart.containers || []).some((c) => (c.items || []).length > 0);
}
