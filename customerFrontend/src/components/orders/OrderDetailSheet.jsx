import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { overlayFade, sheetSpring } from '../../utils/motionPresets';
import OrderInvoiceDetails from './OrderInvoiceDetails';

/** Quick preview sheet — full details live at /orders/:orderId */
export default function OrderDetailSheet({ order, open, onClose }) {
  if (!order) return null;

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
            className="absolute bottom-0 left-0 right-0 max-h-[92vh] overflow-y-auto rounded-t-[1.75rem] bg-[#f7f5f2] shadow-[0_-12px_48px_rgba(15,23,42,0.18)] max-w-lg mx-auto"
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
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
              <OrderInvoiceDetails order={order} showTimeline={false} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
