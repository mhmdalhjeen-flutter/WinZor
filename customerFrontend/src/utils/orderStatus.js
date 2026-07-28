export const ORDER_STATUS_LABELS = {
  pending: 'بانتظار التأكيد',
  store_accepted: 'تم قبول المتجر',
  confirmed: 'تم قبول المتجر',
  preparing: 'قيد التحضير',
  delivered_to_driver: 'تم التسليم للسائق',
  delivered_to_customer: 'تم التسليم للزبون',
  delivered: 'تم التسليم للزبون',
  rejected: 'مرفوض',
  cancelled: 'ملغى',
  completed_off_platform: 'اكتمل خارج المنصة',
};

export const ORDER_STATUS_COLORS = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
  store_accepted: { bg: 'bg-blue-100', text: 'text-blue-800' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800' },
  preparing: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  delivered_to_driver: { bg: 'bg-violet-100', text: 'text-violet-800' },
  delivered_to_customer: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  cancelled: { bg: 'bg-gray-100', text: 'text-gray-600' },
  completed_off_platform: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export const ACTIVE_ORDER_STATUSES = new Set([
  'pending',
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

export function orderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status || '—';
}

export function orderStatusColors(status) {
  return ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.pending;
}

export function isActiveOrder(status) {
  return ACTIVE_ORDER_STATUSES.has(status);
}
