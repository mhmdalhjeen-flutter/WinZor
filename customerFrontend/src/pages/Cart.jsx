import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart, Trash2, Plus, Minus, Loader2, Send, Package,
} from 'lucide-react';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';
import { useVerificationGate } from '../context/VerificationGateContext';
import { CART_VERIFICATION } from '../utils/verificationGateConfig';

const STATUS_LABELS = {
  pending: 'بانتظار التأكيد',
  confirmed: 'مؤكّد',
  rejected: 'مرفوض',
  delivered: 'تم التسليم',
  cancelled: 'ملغى',
  completed_off_platform: 'اكتمل خارج المنصة',
};

const getItemPrice = (row) => row?.unitPrice ?? row?.item?.price ?? row?.item?.pricing?.unitPrice ?? 0;

const itemKey = (itemId, itemType) => `${itemType}:${itemId}`;

const Cart = () => {
  const qc = useQueryClient();
  const { runWithVerification, handleApiVerificationError, verified } = useVerificationGate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [updatingKey, setUpdatingKey] = useState(null);
  const [tab, setTab] = useState('cart');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.cart,
    queryFn: async () => {
      const { data: d } = await api.get('/cart');
      return d;
    },
    staleTime: 30 * 1000,
  });

  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ['orders', 'my'],
    queryFn: async () => {
      const { data: d } = await api.get('/orders/my');
      return d.orders || [];
    },
    enabled: tab === 'orders',
    staleTime: 30 * 1000,
  });

  const items = data?.items || [];
  const total = data?.total ?? 0;

  const patchCart = (updater) => {
    qc.setQueryData(queryKeys.cart, (old) => {
      const base = old || { items: [], total: 0 };
      const nextItems = updater(base.items || []);
      return { ...base, items: nextItems };
    });
  };

  const updateQty = async (itemId, itemType, quantity) => {
    if (quantity < 1) return;
    const key = itemKey(itemId, itemType);
    const previous = qc.getQueryData(queryKeys.cart);

    patchCart((list) =>
      (Array.isArray(list) ? list : []).map((row) =>
        String(row.item?._id) === String(itemId) && row.itemType === itemType
          ? { ...row, quantity }
          : row
      )
    );

    setUpdatingKey(key);
    try {
      const { data: updated } = await api.patch('/cart/update', { itemId, itemType, quantity });
      qc.setQueryData(queryKeys.cart, updated);
    } catch (err) {
      qc.setQueryData(queryKeys.cart, previous);
      if (handleApiVerificationError(err, () => updateQty(itemId, itemType, quantity), CART_VERIFICATION)) return;
      alert(err.response?.data?.message || 'تعذّر تحديث الكمية');
    } finally {
      setUpdatingKey(null);
    }
  };

  const removeItem = async (itemId, itemType) => {
    const key = itemKey(itemId, itemType);
    const previous = qc.getQueryData(queryKeys.cart);

    patchCart((list) =>
      (Array.isArray(list) ? list : []).filter((row) => !(String(row.item?._id) === String(itemId) && row.itemType === itemType))
    );

    setUpdatingKey(key);
    try {
      const { data: updated } = await api.delete('/cart/remove', { data: { itemId, itemType } });
      qc.setQueryData(queryKeys.cart, updated);
    } catch (err) {
      qc.setQueryData(queryKeys.cart, previous);
      if (handleApiVerificationError(err, () => removeItem(itemId, itemType), CART_VERIFICATION)) return;
      alert(err.response?.data?.message || 'تعذّر الحذف');
    } finally {
      setUpdatingKey(null);
    }
  };

  const performCheckout = async () => {
    setCheckingOut(true);
    const previous = qc.getQueryData(queryKeys.cart);
    try {
      const { data: res } = await api.post('/cart/checkout');
      qc.setQueryData(queryKeys.cart, { items: [], total: 0 });
      await qc.invalidateQueries({ queryKey: queryKeys.cart });
      await refetchOrders();
      setTab('orders');
      alert(res.message || 'تم إرسال الطلب — بانتظار تأكيد المحل');
    } catch (err) {
      qc.setQueryData(queryKeys.cart, previous);
      if (handleApiVerificationError(err, performCheckout, CART_VERIFICATION)) return;
      alert(err.response?.data?.message || 'تعذّر إرسال الطلب');
    } finally {
      setCheckingOut(false);
    }
  };

  const checkout = () => runWithVerification(performCheckout, CART_VERIFICATION);

  const guardedUpdateQty = (itemId, itemType, quantity) =>
    runWithVerification(() => updateQty(itemId, itemType, quantity), CART_VERIFICATION);

  const guardedRemoveItem = (itemId, itemType) =>
    runWithVerification(() => removeItem(itemId, itemType), CART_VERIFICATION);

  const cancelOrder = async (orderId) => {
    if (!window.confirm('إلغاء هذا الطلب؟ ستُعاد العناصر إلى سلتك.')) return;
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      await qc.invalidateQueries({ queryKey: queryKeys.cart });
      refetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'تعذّر الإلغاء');
    }
  };

  const getItemTitle = (item) => item?.title || item?.name || 'عنصر';

  return (
    <div className="pb-24 space-y-4 text-right" dir="rtl">
      <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
        <ShoppingCart className="text-primary" /> السلة والطلبات
      </h1>

      <div className="flex gap-2">
        {['cart', 'orders'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-black ${tab === t ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            {t === 'cart' ? 'السلة' : 'طلباتي'}
          </button>
        ))}
      </div>

      {tab === 'cart' && (
        <>
          {isLoading && (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" size={28} /></div>
          )}
          {!isLoading && items.length === 0 && (
            <div className="text-center py-16 text-gray-400 font-bold">
              <Package size={40} className="mx-auto mb-2 opacity-40" />
              السلة فارغة
              {!verified && (
                <p className="mt-3 text-[11px] text-amber-600 font-black px-6 leading-relaxed">
                  يمكنك التصفّح ومشاهدة المنتجات والعروض — إضافة للسلة والشراء يتطلب توثيق الحساب
                </p>
              )}
            </div>
          )}
          {!isLoading && items.length > 0 && (
            <div className="space-y-3">
              {items.map(({ item, itemType, quantity, unitPrice }) => {
                if (!item) return null;
                const ownerRole = item.store?.owner?.role;
                const isSupplier = ownerRole === 'supplier';
                const rowKey = itemKey(item._id, itemType);
                const isUpdating = updatingKey === rowKey;
                return (
                  <div key={rowKey} className={`bg-white rounded-2xl p-4 border shadow-sm ${isSupplier ? 'opacity-50 border-red-100' : 'border-gray-100'}`}>
                    <div className="flex gap-3">
                      <img
                        src={item.image || item.images?.[0] || 'https://via.placeholder.com/80'}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-sm text-gray-900 truncate">{getItemTitle(item)}</h3>
                        <p className="text-xs text-gray-400">{item.store?.name}</p>
                        {isSupplier && (
                          <p className="text-[10px] text-red-500 font-bold">غير متاح — عروض أصحاب المحلات فقط</p>
                        )}
                        <p className="text-primary font-black mt-1">{getItemPrice({ item, unitPrice })} ₪</p>
                      </div>
                    </div>
                    {!isSupplier && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isUpdating || quantity <= 1}
                            onClick={() => guardedUpdateQty(item._id, itemType, quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center disabled:opacity-50"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="font-black w-8 text-center tabular-nums">{quantity}</span>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => guardedUpdateQty(item._id, itemType, quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center disabled:opacity-50"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button type="button" disabled={isUpdating} onClick={() => guardedRemoveItem(item._id, itemType)} className="text-red-400 p-2 disabled:opacity-50">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="bg-primary/5 rounded-2xl p-4 flex justify-between items-center">
                <span className="font-black text-gray-700">الإجمالي</span>
                <span className="text-xl font-black text-primary tabular-nums">{total} ₪</span>
              </div>

              <button
                type="button"
                onClick={checkout}
                disabled={checkingOut}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {checkingOut ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                إرسال الطلب
              </button>
              <p className="text-[10px] text-gray-400 text-center font-bold leading-relaxed">
                يُنشأ طلب بحالة «بانتظار التأكيد». تُفرغ السلة عند الإرسال فقط.
                <br />
                يتحول إلى «مؤكّد» بعد موافقة صاحب المحل.
              </p>
            </div>
          )}
        </>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {(ordersData || []).length === 0 && (
            <p className="text-center text-gray-400 py-12 font-bold">لا توجد طلبات</p>
          )}
          {(ordersData || []).map((order) => (
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
              <p className="text-primary font-black">{order.total} ₪</p>
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

export default Cart;