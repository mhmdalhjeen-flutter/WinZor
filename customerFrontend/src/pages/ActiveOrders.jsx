import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Loader2, ChevronLeft, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';
import { formatPrice } from '../utils/currency';
import { orderStatusLabel, orderStatusColors } from '../utils/orderStatus';
import OrderDetailSheet from '../components/orders/OrderDetailSheet';
import OrderVerificationBadge from '../components/orders/OrderVerificationBadge';

export default function ActiveOrders() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [detailOrder, setDetailOrder] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: queryKeys.myOrders,
    queryFn: async () => {
      const { data } = await api.get('/orders/my');
      return data.orders || [];
    },
    staleTime: 30 * 1000,
  });

  const cancelOrder = async (orderId) => {
    if (!window.confirm('إلغاء هذا الطلب؟')) return;
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      await qc.invalidateQueries({ queryKey: queryKeys.myOrders });
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر الإلغاء');
    }
  };

  return (
    <div className="pb-24 space-y-4 text-right" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Package className="text-primary" /> طلباتي النشطة
          </h1>
          <p className="mt-1 text-xs font-bold text-gray-500">
            تظهر هنا حتى يتم التسليم — السجل السابق في «الطلبات السابقة»
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/cart')}
          className="shrink-0 flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-2 text-xs font-black text-primary"
        >
          <ShoppingBag size={16} />
          السلة
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="text-center py-16 text-gray-400 font-bold">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد طلبات نشطة</p>
          <p className="mt-2 text-xs text-gray-400 font-medium">
            أضف منتجات للسلة ثم أكّد الطلب من صفحة السلة
          </p>
          <button
            type="button"
            onClick={() => navigate('/cart')}
            className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white"
          >
            فتح السلة
          </button>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => {
            const colors = orderStatusColors(order.status);
            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setDetailOrder(order)}
                  className="w-full text-right active:scale-[0.99] transition-transform"
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div>
                      <p className="font-black text-sm">{order.store?.name}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                        {order.orderNumber ? ` · #${order.orderNumber}` : ''}
                      </p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${colors.bg} ${colors.text}`}>
                      {orderStatusLabel(order.status)}
                    </span>
                  </div>
                  {order.items?.length > 0 && (
                    <p className="text-xs text-gray-500 mb-1">
                      {(order.items || []).map((i) => `${i.name ?? '—'} ×${i.quantity ?? 0}`).join(' · ')}
                    </p>
                  )}
                  <OrderVerificationBadge code={order.verificationCode} />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-primary font-black">{formatPrice(order.total, order.currency)}</p>
                    <ChevronLeft size={16} className="text-gray-300" />
                  </div>
                </button>
                {order.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => cancelOrder(order._id)}
                    className="mt-2 text-xs text-red-500 font-bold"
                  >
                    إلغاء الطلب
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <OrderDetailSheet
        order={detailOrder}
        open={Boolean(detailOrder)}
        onClose={() => setDetailOrder(null)}
      />
    </div>
  );
}
