import { getPaymentMethodLabel, getDeliveryMethodLabel } from './checkoutConstants';

/** Normalize API status (legacy or canonical) into display group. */
export function resolveOrderStatusGroup(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'pending_review' || s === 'pending') return 'pending_review';
  if (['store_accepted', 'confirmed', 'preparing', 'delivered_to_driver'].includes(s)) return 'confirmed';
  if (s === 'rejected') return 'rejected';
  if (['delivered_to_customer', 'delivered', 'completed', 'completed_off_platform'].includes(s)) return 'completed';
  if (s === 'cancelled') return 'cancelled';
  return 'pending_review';
}

export function getOrderId(order) {
  return order?.id || order?._id;
}

export function getOrderStoreName(order) {
  return order?.storeName || order?.store?.name || order?.containerName || 'متجر';
}

export function getOrderStoreImage(order) {
  return order?.store?.logo || order?.store?.coverImage || '';
}

export function getOrderItemName(item) {
  return item?.productName || item?.name || '—';
}

export function getOrderItemImage(item) {
  return item?.productImage || item?.image || '';
}

export function getOrderItemSubtotal(item) {
  if (typeof item?.subtotal === 'number') return item.subtotal;
  return (item?.price ?? 0) * (item?.quantity ?? 0);
}

export function getOrderTotal(order) {
  return order?.totalAmount ?? order?.total ?? 0;
}

export function getOrderSubtotal(order) {
  return order?.subtotal ?? getOrderTotal(order);
}

export function getOrderPaymentMethodLabel(order) {
  const method = order?.paymentMethod;
  if (!method) return '—';
  if (method === 'bank' || method === 'bank_palestine') return getPaymentMethodLabel('bank_palestine');
  return getPaymentMethodLabel(method);
}

export function getOrderDeliveryMethodLabel(order) {
  const method = order?.deliveryMethod;
  if (!method) return '—';
  if (method === 'nearby_store') return getDeliveryMethodLabel('nearby');
  return getDeliveryMethodLabel(method);
}

export function getOrderDeliveryAddress(order) {
  return order?.deliveryAddress || order?.locationDetails || '';
}

export function getOrderCustomerNotes(order) {
  return order?.deliveryNotes || order?.customerNotes || '';
}

export function getOrderPaymentProof(order) {
  return order?.paymentProofImage || order?.paymentProof || '';
}

export function getOrderTransferInfo(order) {
  const transfer = order?.transferInformation || {};
  return {
    name: order?.transferName || transfer.senderName || '',
    phone: order?.transferPhone || transfer.contactNumber || '',
    reference: order?.transferNumber || transfer.referenceNumber || '',
    notes: order?.paymentNotes || transfer.note || '',
  };
}

export function formatOrderDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function formatOrderDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export function getOrderLastUpdate(order) {
  const timeline = Array.isArray(order?.statusTimeline) ? order.statusTimeline : [];
  if (timeline.length > 0) {
    return timeline[timeline.length - 1]?.at || order.updatedAt;
  }
  return order?.updatedAt || order?.createdAt;
}

export function summarizeOrderItems(items = []) {
  const names = items.map(getOrderItemName);
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const preview = names.slice(0, 2).join(' · ');
  const extra = names.length > 2 ? ` +${names.length - 2}` : '';
  return {
    names,
    itemCount,
    preview: preview ? `${preview}${extra}` : '—',
  };
}

export function mergeOrders(active = [], history = []) {
  const map = new Map();
  for (const order of [...active, ...history]) {
    const id = getOrderId(order);
    if (id) map.set(String(id), order);
  }
  return [...map.values()].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

export function navigateToOrder(navigate, orderId) {
  if (!orderId) return;
  navigate(`/orders/${orderId}`);
}
