import api from '../api/axios';

export async function fetchMyActiveOrders() {
  const { data } = await api.get('/orders/my');
  return data.orders || [];
}

export async function fetchMyOrderHistory() {
  const { data } = await api.get('/orders/my/history');
  return data.orders || [];
}

export async function fetchOrderById(orderId) {
  const { data } = await api.get(`/orders/${orderId}`);
  return data.order;
}

export async function cancelOrder(orderId) {
  const { data } = await api.patch(`/orders/${orderId}/cancel`);
  return data;
}
