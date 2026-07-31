import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Loader2 } from 'lucide-react';
import { queryKeys } from '../lib/queryClient';
import { fetchOrderById } from '../services/orderService';
import { useOrderStatusPolling } from '../hooks/useOrderStatusPolling';
import OrderInvoiceDetails from '../components/orders/OrderInvoiceDetails';
import '../styles/orders.css';

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useOrderStatusPolling(true, 30000);

  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.orderDetail(orderId),
    queryFn: () => fetchOrderById(orderId),
    enabled: Boolean(orderId),
    staleTime: 20 * 1000,
  });

  return (
    <div className="order-details-page text-right" dir="rtl">
      <header className="orders-page__header">
        <button type="button" className="orders-page__back" onClick={() => navigate(-1)}>
          <ArrowRight size={14} />
          رجوع
        </button>
        <h1 className="orders-page__title">تفاصيل الطلب</h1>
      </header>

      {isLoading && (
        <div className="orders-loading">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      )}

      {isError && (
        <div className="orders-error">
          <p>تعذّر تحميل تفاصيل الطلب</p>
          <button
            type="button"
            className="orders-page__action-btn orders-page__action-btn--primary mt-3"
            onClick={() => refetch()}
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {!isLoading && !isError && order && (
        <OrderInvoiceDetails order={order} showTimeline />
      )}

      {!isLoading && !isError && order && (
        <div className="order-details__bottom-bar">
          <button
            type="button"
            className="order-details__bottom-btn"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.myOrders });
              queryClient.invalidateQueries({ queryKey: queryKeys.myOrderHistory });
              navigate('/orders/history');
            }}
          >
            كل الطلبات السابقة
          </button>
        </div>
      )}
    </div>
  );
}
