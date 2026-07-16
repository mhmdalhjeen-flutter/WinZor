import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Ticket, Trophy, ShoppingBag, Coins, Sparkles, X, Eye, ShoppingCart, Package } from 'lucide-react';

const blockedItems = [
  { icon: Ticket, text: 'إدخال أكواد العروض' },
  { icon: Trophy, text: 'الاشتراك بالمسابقات والسحوبات' },
  { icon: ShoppingBag, text: 'نشر إعلاناتك في السوق' },
  { icon: Coins, text: 'استخدام النقاط والجوائز التفاعلية' },
];

const cartBlockedItems = [
  { icon: ShoppingCart, text: 'إضافة المنتجات إلى السلة' },
  { icon: Package, text: 'إضافة العروض إلى السلة' },
  { icon: ShoppingBag, text: 'إتمام الطلبات والشراء' },
];

const allowedItems = ['تصفح الموقع', 'مشاهدة العروض', 'مشاهدة المنتجات', 'مشاهدة المتاجر'];

const VerificationPromptModal = ({ open, config = {}, onVerifyNow, onLater }) => {
  const isCart = config.feature === 'cart';
  const title = config.title || (isCart ? 'يجب توثيق الحساب أولاً' : 'وثّق حسابك للمتابعة');
  const message =
    config.message ||
    (isCart
      ? 'يجب توثيق الحساب أولاً لتتمكن من استخدام هذه الميزة'
      : 'التوثيق اختياري — لكن هذه الميزة تحتاج حساباً موثّقاً لحمايتك ومنع إساءة الاستخدام.');
  const blocked = isCart ? cartBlockedItems : blockedItems;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[85] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={onLater}
          role="dialog"
          aria-modal="true"
          aria-labelledby="verify-prompt-title"
        >
          <motion.div
            initial={{ y: 48, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-[32px] bg-white text-right shadow-2xl"
            dir="rtl"
          >
            <div className="relative bg-gradient-to-br from-[#1e1b4b] via-primary to-orange-500 px-6 pb-8 pt-6 text-white">
              <button
                type="button"
                onClick={onLater}
                className="absolute left-4 top-4 rounded-full bg-white/15 p-2 text-white/80 hover:bg-white/25"
                aria-label="Later"
              >
                <X size={18} />
              </button>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-white/15 backdrop-blur">
                {isCart ? (
                  <motion.div
                    animate={{ y: [0, -4, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    className="relative"
                  >
                    <ShoppingCart size={28} className="text-amber-300" />
                    <ShieldCheck
                      size={14}
                      className="absolute -bottom-1 -left-1 rounded-full bg-emerald-500 p-0.5 text-white"
                    />
                  </motion.div>
                ) : (
                  <ShieldCheck size={32} className="text-amber-300" />
                )}
              </div>
              <h3 id="verify-prompt-title" className="text-center text-xl font-black">
                {title}
              </h3>
              <p className="mt-2 text-center text-xs font-bold leading-relaxed text-white/75">
                {message}
              </p>
            </div>

            <div className="space-y-3 px-6 py-5">
              <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3">
                <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black text-green-700">
                  <Eye size={12} /> متاح لك الآن بدون توثيق
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allowedItems.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-green-800"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {blocked.map(({ icon: Icon, text }, index) => (
                <motion.div
                  key={text}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
                >
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Icon size={18} />
                  </div>
                  <span className="text-sm font-black text-gray-800">{text}</span>
                </motion.div>
              ))}

              <p className="flex items-center justify-center gap-1 pt-1 text-[10px] font-black text-amber-600">
                <Sparkles size={12} /> +5 نقاط مجانية بعد التوثيق
              </p>

              <button
                type="button"
                onClick={onVerifyNow}
                className="w-full rounded-2xl bg-gradient-to-l from-red-600 to-red-500 py-4 text-sm font-black text-white shadow-lg shadow-red-500/25"
              >
                <span className="block">وثّق الآن</span>
                <span className="mt-0.5 block text-[10px] font-bold text-white/70">Verify Now</span>
              </button>
              <button
                type="button"
                onClick={onLater}
                className="w-full rounded-2xl border-2 border-gray-100 py-3.5 text-sm font-black text-gray-500 transition hover:bg-gray-50"
              >
                <span className="block">لاحقاً</span>
                <span className="mt-0.5 block text-[10px] font-bold text-gray-600">Later</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VerificationPromptModal;
