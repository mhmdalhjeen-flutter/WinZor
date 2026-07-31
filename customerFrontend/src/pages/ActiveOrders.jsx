import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Loader2, ShoppingBag, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { queryKeys } from '../lib/queryClient';
import { fetchMyActiveOrders, cancelOrder } from '../services/orderService';
import { getOrderId, navigateToOrder } from '../utils/orderHelpers';
import { useOrderStatusPolling } from '../hooks/useOrderStatusPolling';
import OrderHistoryCard from '../components/orders/OrderHistoryCard';
import '../styles/orders.css';

export default function ActiveOrders() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  useOrderStatusPolling(true);

  const { data: orders = [], isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.myOrders,
    queryFn: fetchMyActiveOrders,
    staleTime: 20 * 1000,
  });

  const handleCancel = async (orderId) => {
    if (!window.confirm('إلغاء هذا الطلب؟')) return;
    try {
      await cancelOrder(orderId);
      await qc.invalidateQueries({ queryKey: queryKeys.myOrders });
      await qc.invalidateQueries({ queryKey: queryKeys.myOrderHistory });
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر الإلغاء');
    }
  };

  return (
    <div className="orders-page text-right" dir="rtl">
      <header className="orders-page__header">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="orders-page__title">
              <Package className="text-primary" size={26} />
              طلباتي النشطة
            </h1>
            <p className="orders-page__subtitle">
              تظهر هنا حتى يتم التأكيد أو الرفض — السجل الكامل في «كل الطلبات السابقة»
            </p>
          </div>
        </div>
        <div className="orders-page__actions">
          <button
            type="button"
            className="orders-page__action-btn orders-page__action-btn--ghost"
            onClick={() => navigate('/orders/history')}
          >
            <History size={16} />
            كل الطلبات السابقة
          </button>
          <button
            type="button"
            className="orders-page__action-btn orders-page__action-btn--primary"
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
          <Package size={48} className="orders-empty__icon" />
          <p>لا توجد طلبات نشطة</p>
          <p className="mt-2 text-xs font-medium text-gray-400">
            أضف منتجات للسلة ثم أكّد الطلب من صفحة السلة
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
          {orders.map((order) => {
            const id = getOrderId(order);
            const isPending = order.status === 'pending' || order.status === 'pending_review';
            return (
              <div key={id}>
                <OrderHistoryCard
                  order={order}
                  onClick={() => navigateToOrder(navigate, id)}
                />
                {isPending && (
                  <button
                    type="button"
                    onClick={() => handleCancel(id)}
                    className="mt-1 mb-1 w-full py-2 text-sm font-black text-red-600"
                  >
                    إلغاء الطلب
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
