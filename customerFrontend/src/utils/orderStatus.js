/** Customer-facing order status labels (Arabic). */
export const ORDER_STATUS_LABELS = {
  pending: 'قيد المراجعة',
  pending_review: 'قيد المراجعة',
  store_accepted: 'تم التأكيد',
  confirmed: 'تم التأكيد',
  preparing: 'تم التأكيد',
  delivered_to_driver: 'تم التأكيد',
  delivered_to_customer: 'مكتمل',
  delivered: 'مكتمل',
  completed: 'مكتمل',
  rejected: 'مرفوض',
  cancelled: 'ملغى',
  completed_off_platform: 'مكتمل',
};

/** Grouped badge styles for the four main customer statuses. */
export const ORDER_STATUS_GROUP_STYLES = {
  pending_review: { label: 'قيد المراجعة', className: 'order-status-badge--pending_review' },
  confirmed: { label: 'تم التأكيد', className: 'order-status-badge--confirmed' },
  rejected: { label: 'مرفوض', className: 'order-status-badge--rejected' },
  completed: { label: 'مكتمل', className: 'order-status-badge--completed' },
  cancelled: { label: 'ملغى', className: 'order-status-badge--cancelled' },
};

export const ORDER_STATUS_COLORS = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
  pending_review: { bg: 'bg-amber-100', text: 'text-amber-800' },
  store_accepted: { bg: 'bg-blue-100', text: 'text-blue-800' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  preparing: { bg: 'bg-blue-100', text: 'text-blue-800' },
  delivered_to_driver: { bg: 'bg-blue-100', text: 'text-blue-800' },
  delivered_to_customer: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600' },
  completed_off_platform: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
};

export const ACTIVE_ORDER_STATUSES = new Set([
  'pending',
  'pending_review',
  'store_accepted',
  'confirmed',
  'preparing',
  'delivered_to_driver',
]);

export const PAYMENT_STATUS_LABELS = {
  unpaid: 'غير مدفوع',
  pending: 'بانتظار التأكيد',
  paid: 'مدفوع',
};

function resolveStatusGroup(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending_review' || s === 'pending') return 'pending_review';
  if (['store_accepted', 'confirmed', 'preparing', 'delivered_to_driver'].includes(s)) return 'confirmed';
  if (s === 'rejected') return 'rejected';
  if (['delivered_to_customer', 'delivered', 'completed', 'completed_off_platform'].includes(s)) return 'completed';
  if (s === 'cancelled') return 'cancelled';
  return 'pending_review';
}

export function orderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || ORDER_STATUS_LABELS[resolveStatusGroup(status)] || status || '—';
}

export function orderStatusGroup(status) {
  return resolveStatusGroup(status);
}

export function orderStatusGroupMeta(status) {
  const group = resolveStatusGroup(status);
  return ORDER_STATUS_GROUP_STYLES[group] || ORDER_STATUS_GROUP_STYLES.pending_review;
}

export function orderStatusColors(status) {
  return ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS[resolveStatusGroup(status)] || ORDER_STATUS_COLORS.pending;
}

export function isActiveOrder(status) {
  return ACTIVE_ORDER_STATUSES.has(status) || ACTIVE_ORDER_STATUSES.has(resolveStatusGroup(status));
}
