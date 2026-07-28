import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, Calendar, Hash, CreditCard, MessageSquare, Clock, ShieldCheck, Copy } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import { orderStatusLabel, orderStatusColors, PAYMENT_STATUS_LABELS } from '../../utils/orderStatus';
import { overlayFade, sheetSpring } from '../../utils/motionPresets';
import { useToast } from '../../shared/Toast';

function formatDateTime(iso) {
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
    return iso;
  }
}

export default function OrderDetailSheet({ order, open, onClose }) {
  const { toast } = useToast();
  if (!order) return null;

  const colors = orderStatusColors(order.status);
  const timeline = Array.isArray(order.statusTimeline) ? order.statusTimeline : [];

  const copyVerificationCode = async () => {
    if (!order.verificationCode) return;
    try {
      await navigator.clipboard.writeText(order.verificationCode);
      toast('تم نسخ الرمز', 'success');
    } catch {
      toast('تعذّر النسخ', 'error');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true">
          <motion.button
            type="button"
            aria-label="إغلاق"
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayFade}
            onClick={onClose}
          />
          <motion.div
            dir="rtl"
            className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-[1.75rem] bg-white shadow-[0_-12px_48px_rgba(15,23,42,0.18)] max-w-lg mx-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={sheetSpring}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
              <h2 className="text-base font-black text-gray-900">تفاصيل الطلب</h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-black text-gray-900">
                    <Store size={16} className="text-primary" />
                    {order.store?.name || 'متجر'}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <Hash size={12} />
                    {order.orderNumber || order._id?.slice(-8)}
                  </p>
                </div>
                <span className={`rounded-lg px-2.5 py-1 text-[11px] font-black ${colors.bg} ${colors.text}`}>
                  {orderStatusLabel(order.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="font-bold text-gray-500">تاريخ الطلب</p>
                  <p className="mt-1 font-black text-gray-900">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="font-bold text-gray-500">الإجمالي</p>
                  <p className="mt-1 font-black text-primary">{formatPrice(order.total, order.currency)}</p>
                </div>
                {order.confirmedAt && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="font-bold text-gray-500">تاريخ التأكيد</p>
                    <p className="mt-1 font-black text-gray-900">{formatDateTime(order.confirmedAt)}</p>
                  </div>
                )}
                {order.completedAt && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="font-bold text-gray-500">تاريخ التسليم</p>
                    <p className="mt-1 font-black text-gray-900">{formatDateTime(order.completedAt)}</p>
                  </div>
                )}
              </div>

              {order.verificationCode && (
                <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
                    <ShieldCheck size={15} /> رمز التحقق الخاص
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-emerald-700/80">
                    احتفظ بهذا الرمز — ستحتاجه عند استلام طلبك فقط.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <p className="flex-1 text-center text-xl font-black tracking-[0.18em] text-emerald-700">
                      {order.verificationCode}
                    </p>
                    <button
                      type="button"
                      onClick={copyVerificationCode}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm"
                      aria-label="نسخ رمز التحقق"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-2 text-sm font-black text-gray-900">المنتجات</h3>
                <div className="space-y-2">
                  {(order.items || []).map((item, idx) => (
                    <div key={`${item.item}-${idx}`} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2.5">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.name || '—'}</p>
                        <p className="text-xs text-gray-500">×{item.quantity ?? 0}</p>
                      </div>
                      <p className="text-sm font-black text-gray-800">
                        {formatPrice((item.price ?? 0) * (item.quantity ?? 1), order.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              {(order.customerNotes || order.storeNotes) && (
                <section className="space-y-2">
                  {order.customerNotes && (
                    <div className="rounded-xl bg-blue-50 p-3">
                      <p className="flex items-center gap-1 text-xs font-black text-blue-800">
                        <MessageSquare size={13} /> ملاحظاتك
                      </p>
                      <p className="mt-1 text-sm text-blue-900">{order.customerNotes}</p>
                    </div>
                  )}
                  {order.storeNotes && (
                    <div className="rounded-xl bg-amber-50 p-3">
                      <p className="flex items-center gap-1 text-xs font-black text-amber-800">
                        <MessageSquare size={13} /> ملاحظات المتجر
                      </p>
                      <p className="mt-1 text-sm text-amber-900">{order.storeNotes}</p>
                    </div>
                  )}
                </section>
              )}

              <section className="rounded-xl border border-gray-100 p-3">
                <p className="flex items-center gap-1 text-xs font-black text-gray-700">
                  <CreditCard size={14} /> الدفع
                </p>
                <p className="mt-1 text-sm font-bold text-gray-900">
                  {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus || '—'}
                </p>
                {order.paymentProof && (
                  <a href={order.paymentProof} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-primary underline">
                    عرض إثبات الدفع
                  </a>
                )}
              </section>

              {timeline.length > 0 && (
                <section>
                  <h3 className="mb-2 flex items-center gap-1 text-sm font-black text-gray-900">
                    <Clock size={15} /> مسار الطلب
                  </h3>
                  <ol className="space-y-2 border-r-2 border-gray-100 pr-3">
                    {timeline.map((entry, idx) => (
                      <li key={`${entry.status}-${idx}`} className="relative">
                        <span className="absolute -right-[calc(0.75rem+1px)] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white" />
                        <p className="text-sm font-bold text-gray-900">{orderStatusLabel(entry.status)}</p>
                        <p className="text-[11px] text-gray-500">{formatDateTime(entry.at)}</p>
                        {entry.note && <p className="text-xs text-gray-600">{entry.note}</p>}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
