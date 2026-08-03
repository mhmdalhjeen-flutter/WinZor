/** Normalize cart item type for API calls (backend accepts Product/Offer or product/offer). */
export function normalizeCartItemType(type) {
  const t = (type || '').toLowerCase();
  if (t === 'product') return 'Product';
  if (t === 'offer') return 'Offer';
  return type || 'Product';
}

export function cartItemMatches(row, itemId, itemType, purchaseMethod) {
  const id = row?.item?._id ?? row?.item?.id;
  if (!id || String(id) !== String(itemId)) return false;
  const rowType = normalizeCartItemType(row?.itemType);
  if (rowType !== normalizeCartItemType(itemType)) return false;
  if (purchaseMethod == null) return true;
  const rowMethod = row?.purchaseMethod || 'quantity';
  return rowMethod === (purchaseMethod === 'price' ? 'price' : 'quantity');
}

export function findCartRow(cartStats, itemId, itemType, purchaseMethod) {
  for (const container of cartStats?.containers || []) {
    for (const row of container.items || []) {
      if (cartItemMatches(row, itemId, itemType, purchaseMethod)) return row;
    }
  }
  return null;
}

export function getCartRowId(row) {
  return row?.item?._id ?? row?.item?.id ?? '';
}

export function getCartRowName(row) {
  return row?.item?.name || row?.item?.title || '—';
}

export function getCartRowImage(row) {
  return row?.item?.image || row?.item?.images?.[0] || '';
}

export function getStoreIdFromContainer(container) {
  return container?.store?._id ?? container?.store ?? '';
}
