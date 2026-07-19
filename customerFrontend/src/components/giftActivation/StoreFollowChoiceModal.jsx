import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, BellOff, Store, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../shared/Toast';
import { clearStoreNotifyOptOut, markStoreNotifyOptOut } from '../../utils/giftActivationFlow';

export default function StoreFollowChoiceModal({
  open,
  storeId,
  storeName,
  onComplete,
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!open || !storeId) return null;

  const finish = (followed) => {
    onComplete?.({ storeId, storeName, followed });
  };

  const followStore = async () => {
    setLoading(true);
    try {
      clearStoreNotifyOptOut(storeId);
      await api.post(`/stores/${storeId}/follow`);
      toast('تمت متابعة المتجر — ستصلك الإشعارات', 'success');
      finish(true);
    } catch (err) {
      toast(err.response?.data?.message || 'تعذّر متابعة المتجر', 'error');
    } finally {
      setLoading(false);
    }
  };

  const skipNotifications = () => {
    markStoreNotifyOptOut(storeId);
    toast('انضممت للمتجر بدون إشعارات — يمكنك تفعيلها لاحقاً', 'success');
    finish(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6" dir="rtl">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-10 w-full max-w-sm rounded-t-[28px] sm:rounded-[28px] bg-white p-6 shadow-2xl text-right"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <Store size={28} />
        </div>
        <h3 className="text-center text-lg font-black text-gray-900">انضممت لمتجر {storeName}</h3>
        <p className="mt-2 text-center text-[11px] font-bold leading-relaxed text-gray-500">
          هل تريد متابعة المتجر واستقبال إشعارات العروض؟
        </p>

        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={followStore}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-black text-white shadow-lg disabled:opacity-60"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Bell size={18} />}
            متابعة المتجر
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={skipNotifications}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 py-3.5 text-sm font-black text-gray-700"
          >
            <BellOff size={18} />
            عدم استقبال إشعارات المتجر
          </button>
        </div>
      </motion.div>
    </div>
  );
}
