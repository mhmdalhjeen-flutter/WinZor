import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

const AUTO_CLOSE_MS = {
  win: 3200,
  no_win: 2500,
  locked: 2800,
};

const STYLES = {
  win: {
    ring: 'border-emerald-200',
    bg: 'bg-gradient-to-br from-white to-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
    icon: '🎉',
    title: 'مبروك!',
  },
  no_win: {
    ring: 'border-slate-200',
    bg: 'bg-gradient-to-br from-white to-slate-50',
    badge: 'bg-slate-100 text-slate-600',
    icon: '😔',
    title: 'حظ أوفر!',
  },
  locked: {
    ring: 'border-amber-200',
    bg: 'bg-gradient-to-br from-white to-amber-50',
    badge: 'bg-amber-100 text-amber-700',
    icon: '🔒',
    title: 'جائزة مقفلة',
  },
};

function getSubtitle(result) {
  if (!result) return '';
  if (result.outcome === 'win') {
    const name = result.prize?.name || result.message?.replace(/^مبروك! فزت بـ\s*/, '') || 'جائزة';
    return `لقد ربحت: ${name}`;
  }
  if (result.outcome === 'no_win') return 'حاول مرة أخرى — قد يبتسم الحظ قريباً';
  if (result.outcome === 'locked') {
    return result.message || 'ارفع نقاطك لفتح هذه الجائزة';
  }
  return result.message || '';
}

export default function WheelResultPopup({ open, result, onClose, onViewInventory }) {
  const outcome = result?.outcome;
  const theme = STYLES[outcome] || STYLES.no_win;

  useEffect(() => {
    if (!open || !outcome) return undefined;
    const ms = AUTO_CLOSE_MS[outcome] || 2500;
    const timer = setTimeout(onClose, ms);
    return () => clearTimeout(timer);
  }, [open, outcome, onClose]);

  return (
    <AnimatePresence>
      {open && result && (
        <>
          <motion.button
            type="button"
            aria-label="إغلاق"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] cursor-default bg-black/25 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            role="alertdialog"
            aria-live="polite"
            aria-modal="true"
            initial={{ opacity: 0, y: -12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', damping: 22, stiffness: 360 }}
            className="fixed left-1/2 top-[18%] z-[70] w-[min(92vw,340px)] -translate-x-1/2"
            dir="rtl"
          >
            <div
              className={`relative overflow-hidden rounded-3xl border-2 p-5 text-center shadow-2xl ${theme.ring} ${theme.bg}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute left-3 top-3 rounded-full p-1 text-gray-400 transition hover:bg-black/5 hover:text-gray-600"
                aria-label="إغلاق"
              >
                <X size={16} />
              </button>

              {outcome === 'win' && (
                <motion.div
                  initial={{ opacity: 0.6, scale: 0.8 }}
                  animate={{ opacity: 0, scale: 1.6 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="pointer-events-none absolute inset-0 rounded-3xl bg-emerald-300/20"
                />
              )}

              <motion.div
                initial={{ scale: 0.5, rotate: outcome === 'win' ? -8 : 0 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 260 }}
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-md"
              >
                {result.prize?.icon || theme.icon}
              </motion.div>

              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black ${theme.badge}`}>
                {outcome === 'win' && <Sparkles size={12} />}
                {theme.title}
              </span>

              <p className="mt-3 text-base font-black leading-relaxed text-gray-900">
                {getSubtitle(result)}
              </p>

              {result.charged && (
                <p className="mt-2 text-[11px] font-bold text-gray-500">
                  تم خصم {result.pointsCost} نقاط — رصيدك: {result.userPoints}
                </p>
              )}

              {!result.charged && outcome === 'locked' && (
                <p className="mt-2 text-[11px] font-bold text-amber-600">
                  لم تُخصم نقاط — جرّب مجدداً
                </p>
              )}

              {outcome === 'win' && onViewInventory && (
                <button
                  type="button"
                  onClick={() => {
                    onViewInventory();
                    onClose();
                  }}
                  className="mt-4 w-full rounded-2xl bg-primary py-2.5 text-xs font-black text-white shadow-md active:scale-[0.98]"
                >
                  مخزن جوائزي
                </button>
              )}

              <p className="mt-3 text-[10px] font-bold text-gray-400">
                يُغلق تلقائياً...
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
