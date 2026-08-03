export const PURCHASE_MODES = Object.freeze(['quantity', 'price', 'both']);
export const PURCHASE_METHODS = Object.freeze(['quantity', 'price']);

export function normalizePurchaseMode(value) {
  const v = String(value || 'quantity').toLowerCase().trim();
  return PURCHASE_MODES.includes(v) ? v : 'quantity';
}

export function normalizePurchaseMethod(value) {
  const v = String(value || 'quantity').toLowerCase().trim();
  return PURCHASE_METHODS.includes(v) ? v : 'quantity';
}

export function getDefaultPurchaseMethod(purchaseMode) {
  const mode = normalizePurchaseMode(purchaseMode);
  if (mode === 'price') return 'price';
  return 'quantity';
}

export function supportsQuantity(purchaseMode) {
  const mode = normalizePurchaseMode(purchaseMode);
  return mode === 'quantity' || mode === 'both';
}

export function supportsPrice(purchaseMode) {
  const mode = normalizePurchaseMode(purchaseMode);
  return mode === 'price' || mode === 'both';
}

export function purchaseModeLabel(mode) {
  switch (normalizePurchaseMode(mode)) {
    case 'price': return 'بالقيمة';
    case 'both': return 'بالكمية أو بالقيمة';
    default: return 'بالكمية';
  }
}

export function purchaseMethodLabel(method) {
  return normalizePurchaseMethod(method) === 'price' ? 'بالقيمة' : 'بالكمية';
}

export function formatOrderLineMeta(item, currency = 'ILS') {
  const method = normalizePurchaseMethod(item?.purchaseMethod);
  if (method === 'price') {
    const amount = item.requestedAmount ?? item.subtotal ?? item.price ?? 0;
    return `${Number(amount).toFixed(2)} ₪ (بالقيمة)`;
  }
  const price = item.price ?? 0;
  const qty = item.quantity ?? 0;
  return `${price.toFixed(2)} ₪ × ${qty}`;
}

export function parseRequestedAmountInput(raw) {
  const amount = typeof raw === 'number' ? raw : parseFloat(String(raw || '').replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}
