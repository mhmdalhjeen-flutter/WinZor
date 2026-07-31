import React, { useState } from 'react';
import { X, Coins, Ticket, Trophy, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HELP_ITEMS = [
  {
    icon: Coins,
    tone: 'emerald',
    title: 'كيف تعمل النقاط؟',
    body: 'مكافآت تحصل عليها مع كل عملية شراء من المتاجر المعتمدة — عبر التطبيق أو في المتجر.',
  },
  {
    icon: Sparkles,
    tone: 'amber',
    title: 'كيف تجمع النقاط؟',
    body: 'اطلب بطاقة النقاط من المتجر بعد الشراء، ثم أدخل الكود أو امسح QR من زر «ادخل الكود».',
  },
  {
    icon: Ticket,
    tone: 'violet',
    title: 'كيف تصبح فرصاً؟',
    body: 'استخدم نقاطك للدخول في المسابقات — كل فرصة تكلف عدداً محدداً من النقاط حسب كل سحب.',
  },
  {
    icon: Trophy,
    tone: 'rose',
    title: 'كلما زادت فرصك…',
    body: 'كلما زاد عدد فرصك في السحب، ارتفعت احتمالات الفوز. يمكنك زيادة فرصك في أي وقت.',
  },
];

const TONE_CLASSES = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
};

function PointsHelpDialog({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/45 backdrop-blur-[3px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 480, damping: 32, mass: 0.75 }}
            className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 text-right overflow-hidden"
            dir="rtl"
          >
            <div className="bg-gradient-to-l from-emerald-50 via-white to-amber-50 px-5 pt-4 pb-3 border-b border-gray-100/80">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-500 shadow-sm"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>
              <h3 className="text-base font-black text-gray-900 pr-1">دليل النقاط السريع</h3>
              <p className="text-[11px] font-bold text-gray-400 mt-0.5">كل ما تحتاج معرفته في دقيقة</p>
            </div>

            <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
              {HELP_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl bg-gray-50/80 border border-gray-100/80 p-3"
                >
                  <span className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full ring-1 ${TONE_CLASSES[item.tone]}`}>
                    <item.icon size={15} strokeWidth={2.5} />
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-[13px] font-black text-gray-900">{item.title}</p>
                    <p className="text-[12px] font-bold text-gray-500 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function HomeHero() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <section className="home-hero max-w-6xl mx-auto px-1.5 sm:px-2" dir="rtl">
        <div className="home-hero__inner">
          <div className="home-hero__glow home-hero__glow--violet" aria-hidden />
          <div className="home-hero__glow home-hero__glow--amber" aria-hidden />

          <div className="relative z-10 home-hero__content py-3.5 sm:py-4 px-3 sm:px-4">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <p className="home-hero__message text-sm sm:text-base font-black text-gray-900 leading-snug text-center">
                اطلب نقاطك في كل عملية شراء
              </p>
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-gradient-to-l from-emerald-50 to-amber-50 text-emerald-700 text-[11px] sm:text-xs font-black ring-1 ring-emerald-200/80 shadow-sm hover:from-emerald-100 hover:to-amber-100 active:scale-95 transition-all whitespace-nowrap"
                aria-label="حول النقاط؟"
              >
                حول النقاط؟
              </button>
            </div>
          </div>
        </div>
      </section>

      <PointsHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
