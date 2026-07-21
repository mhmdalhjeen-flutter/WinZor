import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';
import { formatPrice } from '../utils/currency';

const STATUS_LABELS = {
  pending: 'بانتظار التأكيد',
  confirmed: 'مؤكّد',
  rejected: 'مرفوض',
  delivered: 'تم التسليم',
  cancelled: 'ملغى',
  completed_off_platform: 'اكتمل خارج المنصة',
};

const Orders = () => {
  const qc = useQueryClient();

  const { data: ordersData = [], isLoading } = useQuery({
    queryKey: ['orders', 'my'],
    queryFn: async () => {
      const { data: d } = await api.get('/orders/my');
      return d.orders || [];
    },
    staleTime: 30 * 1000,
  });

  const cancelOrder = async (orderId) => {
    if (!window.confirm('إلغاء هذا الطلب؟')) return;
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      await qc.invalidateQueries({ queryKey: ['orders', 'my'] });
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر الإلغاء');
    }
  };

  return (
    <div className="pb-24 space-y-4 text-right" dir="rtl">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
        <Package className="text-primary" /> طلباتي
      </h1>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={28} />
        </div>
      )}

      {!isLoading && ordersData.length === 0 && (
        <div className="text-center py-16 text-gray-400 font-bold">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد طلبات بعد</p>
          <p className="mt-2 text-xs text-gray-400 font-medium">ستظهر طلباتك هنا بعد إرسالها من صفحة المنتج أو العرض</p>
        </div>
      )}

      {!isLoading && ordersData.length > 0 && (
        <div className="space-y-3">
          {ordersData.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start mb-2 gap-2">
                <div>
                  <p className="font-black text-sm">{order.store?.name}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('ar')}</p>
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${
                    order.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : order.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              {order.items?.length > 0 && (
                <p className="text-xs text-gray-500 mb-1">
                  {(order.items || []).map((i) => `${i.name ?? '—'} ×${i.quantity ?? 0}`).join(' · ')}
                </p>
              )}
              <p className="text-primary font-black">{formatPrice(order.total, order.currency)}</p>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
