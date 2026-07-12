import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Share2, Gift } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../shared/Toast';

const ReferralCardsModal = ({ open, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const code = user?.referralCode || '';
  const link = `${window.location.origin}/intro?ref=${encodeURIComponent(code)}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast('تم نسخ رابط الإحالة', 'success');
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Win GoldenStore', text: 'انضم عبر رابطي واحصل على مزايا!', url: link });
      } catch { /* cancelled */ }
    } else {
      copy();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[65] flex items-end sm:items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="relative bg-white w-full max-w-sm rounded-[32px] p-6 text-right space-y-4"
            dir="rtl"
          >
            <button type="button" onClick={onClose} className="absolute top-4 left-4 text-gray-400"><X size={20} /></button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center"><Gift className="text-amber-600" /></div>
              <div>
                <h3 className="font-black text-gray-900">كروت مجانية</h3>
                <p className="text-[11px] text-gray-500 font-bold">3 نقاط لكل تسجيل ناجح عبر رابطك</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              شارك رابط الموقع مع أصدقائك، وكل مستخدم جديد يسجل من خلال رابطك يمنحك 3 نقاط.
            </p>
            <div className="bg-gray-50 rounded-2xl p-3 text-xs font-mono break-all border border-gray-100">{link}</div>
            <div className="flex gap-2">
              <button type="button" onClick={copy} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary text-white font-black text-sm">
                <Copy size={16} /> نسخ
              </button>
              <button type="button" onClick={share} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 font-black text-sm">
                <Share2 size={16} /> مشاركة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReferralCardsModal;
