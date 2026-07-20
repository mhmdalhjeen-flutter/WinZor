import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, ShoppingBag, Coins, ChevronLeft } from 'lucide-react';

function QuickAccessCard({ icon: Icon, title, description, iconBg, iconColor, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="quick-access-card group w-full text-right"
    >
      <span className={`quick-access-card__icon ${iconBg}`}>
        <Icon size={24} className={iconColor} strokeWidth={2.2} />
      </span>
      <span className="quick-access-card__body">
        <span className="quick-access-card__title">{title}</span>
        {description ? (
          <span className="quick-access-card__desc">{description}</span>
        ) : null}
      </span>
      <ChevronLeft size={18} className="quick-access-card__chevron text-gray-300 group-hover:text-gray-500 shrink-0" />
    </button>
  );
}

export default function QuickAccessSheet({ open, onClose, onEnterCode, onMarketplace, onPoints, showMarketplace = true }) {
  const items = [
    {
      id: 'code',
      icon: QrCode,
      title: 'إدخال الكود',
      description: 'فعّل بطاقتك واحصل على نقاطك',
      iconBg: 'bg-red-50 ring-1 ring-red-100',
      iconColor: 'text-primary',
      onClick: () => {
        onClose();
        onEnterCode();
      },
    },
    showMarketplace && {
      id: 'marketplace',
      icon: ShoppingBag,
      title: 'السوق العام',
      description: 'بيع واشتري بسهولة',
      iconBg: 'bg-emerald-50 ring-1 ring-emerald-100',
      iconColor: 'text-emerald-600',
      onClick: () => {
        onClose();
        onMarketplace();
      },
    },
    {
      id: 'points',
      icon: Coins,
      title: 'نقاطي',
      description: 'تابع نقاطك وفرص الفوز',
      iconBg: 'bg-amber-50 ring-1 ring-amber-100',
      iconColor: 'text-amber-600',
      onClick: () => {
        onClose();
        onPoints();
      },
    },
  ].filter(Boolean);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-sm"
            aria-label="إغلاق الوصول السريع"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 px-4 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] max-w-lg mx-auto"
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-access-title"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 id="quick-access-title" className="text-base font-black text-gray-900">
                  الوصول السريع
                </h2>
                <p className="text-[11px] font-bold text-gray-400 mt-0.5">
                  اختصر الطريق إلى أهم الإجراءات
                </p>
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

            <div className="flex flex-col gap-2.5">
              {items.map((item) => (
                <QuickAccessCard key={item.id} {...item} />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
