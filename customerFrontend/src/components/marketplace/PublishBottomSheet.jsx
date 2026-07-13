import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Tag, Repeat, Home, Megaphone } from 'lucide-react';
import { PUBLISH_OPTIONS } from '../../utils/marketplaceTabs';

const ICON_MAP = {
  tag: Tag,
  repeat: Repeat,
  home: Home,
  megaphone: Megaphone,
};

export default function PublishBottomSheet({ open, onClose, onSelect }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm"
            aria-label="إغلاق"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[71] bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 px-3 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] max-w-lg mx-auto"
            dir="rtl"
          >
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h2 className="text-base font-black text-gray-900 font-cairo">بيع أو نشر</h2>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">اختر نوع الإعلان</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {PUBLISH_OPTIONS.map((opt) => {
                const Icon = ICON_MAP[opt.icon];
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelect(opt.transactionType)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50/80 hover:bg-gray-100 border border-gray-100 active:scale-[0.99] transition-all text-right"
                  >
                    <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${opt.color}`}>
                      <Icon size={20} strokeWidth={2.2} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-black text-gray-900">{opt.label}</span>
                      <span className="block text-[11px] font-bold text-gray-400 mt-0.5">{opt.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
