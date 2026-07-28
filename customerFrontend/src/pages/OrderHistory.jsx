import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Loader2, ChevronLeft, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';
import { formatPrice } from '../utils/currency';
import { orderStatusLabel, orderStatusColors } from '../utils/orderStatus';
import OrderDetailSheet from '../components/orders/OrderDetailSheet';
import OrderVerificationBadge from '../components/orders/OrderVerificationBadge';

export default function OrderHistory() {
  const navigate = useNavigate();
  const [detailOrder, setDetailOrder] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: queryKeys.myOrderHistory,
    queryFn: async () => {
      const { data } = await api.get('/orders/my/history');
      return data.orders || [];
    },
    staleTime: 60 * 1000,
  });

  return (
    <div className="pb-24 space-y-4 text-right" dir="rtl">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-2 text-xs font-bold text-gray-500"
        >
          ← رجوع
        </button>
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <History className="text-primary" /> الطلبات السابقة
        </h1>
        <p className="mt-1 text-xs font-bold text-gray-500">
          تُحفظ الطلبات المكتملة لمدة 7 أيام ثم تُحذف تلقائياً
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="text-center py-16 text-gray-400 font-bold">
          <History size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد طلبات سابقة</p>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => {
            const colors = orderStatusColors(order.status);
            return (
              <button
                key={order._id}
                type="button"
                onClick={() => setDetailOrder(order)}
                className="w-full text-right bg-white rounded-2xl p-4 border border-gray-100 shadow-sm active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-primary">
                    <Store size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-black text-sm text-gray-900">{order.store?.name || 'متجر'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${colors.bg} ${colors.text}`}>
                        {orderStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div>
                        <p className="text-primary font-black">{formatPrice(order.total, order.currency)}</p>
                        {order.orderNumber && (
                          <p className="text-[10px] text-gray-400 font-bold mt-0.5">#{order.orderNumber}</p>
                        )}
                        <OrderVerificationBadge code={order.verificationCode} className="mt-1.5" />
                      </div>
                      <ChevronLeft size={16} className="text-gray-300" />
                    </div>
                  </div>
                </div>
              </button>
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
