import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, History, Loader2, Package, ShoppingBag } from 'lucide-react';
import { queryKeys } from '../lib/queryClient';
import { fetchMyActiveOrders, fetchMyOrderHistory } from '../services/orderService';
import { mergeOrders, getOrderId, navigateToOrder } from '../utils/orderHelpers';
import { useOrderStatusPolling } from '../hooks/useOrderStatusPolling';
import OrderHistoryCard from '../components/orders/OrderHistoryCard';
import '../styles/orders.css';

export default function OrderHistory() {
  const navigate = useNavigate();
  useOrderStatusPolling(true);

  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.myOrderHistory, 'all'],
    queryFn: async () => {
      const [active, history] = await Promise.all([
        fetchMyActiveOrders(),
        fetchMyOrderHistory(),
      ]);
      return mergeOrders(active, history);
    },
    staleTime: 30 * 1000,
  });

  const openOrder = (order) => {
    const id = getOrderId(order);
    if (id) navigateToOrder(navigate, id);
  };

  return (
    <div className="orders-page text-right" dir="rtl">
      <header className="orders-page__header">
        <button type="button" className="orders-page__back" onClick={() => navigate(-1)}>
          <ArrowRight size={14} />
          رجوع
        </button>
        <h1 className="orders-page__title">
          <History className="text-primary" size={26} />
          كل الطلبات السابقة
        </h1>
        <p className="orders-page__subtitle">
          جميع طلباتك في مكان واحد — الطلبات النشطة والمكتملة خلال آخر 7 أيام
        </p>
        <div className="orders-page__actions">
          <button
            type="button"
            className="orders-page__action-btn orders-page__action-btn--primary"
            onClick={() => navigate('/orders')}
          >
            <Package size={16} />
            الطلبات النشطة
          </button>
          <button
            type="button"
            className="orders-page__action-btn orders-page__action-btn--ghost"
            onClick={() => navigate('/cart')}
          >
            <ShoppingBag size={16} />
            السلة
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="orders-loading">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      )}

      {isError && (
        <div className="orders-error">
          <p>تعذّر تحميل الطلبات</p>
          <button
            type="button"
            className="orders-page__action-btn orders-page__action-btn--primary mt-3"
            onClick={() => refetch()}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <div className="orders-empty">
          <History size={48} className="orders-empty__icon" />
          <p>لا توجد طلبات بعد</p>
          <p className="mt-2 text-xs font-medium text-gray-400">
            أضف منتجات للسلة ثم أكّد طلبك
          </p>
          <button
            type="button"
            className="orders-empty__cta"
            onClick={() => navigate('/cart')}
          >
            فتح السلة
          </button>
        </div>
      )}

      {!isLoading && !isError && orders.length > 0 && (
        <div className="orders-list">
          {orders.map((order) => (
            <OrderHistoryCard
              key={getOrderId(order)}
              order={order}
              onClick={() => openOrder(order)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
