import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Minus } from 'lucide-react';
import { getPointsAnchorRect, POINTS_FLOAT_EVENT } from '../utils/pointsAnimation';

const PREMIUM_EASE = [0.22, 1, 0.36, 1];
const DURATION = 2.35;

function FloatChip({ item, onDone }) {
  const isGain = item.delta > 0;
  const anchor = getPointsAnchorRect();
  const x = anchor.x;

  const startY = isGain
    ? (item.origin?.y ?? Math.min(window.innerHeight - 72, anchor.y + Math.min(180, window.innerHeight * 0.28)))
    : anchor.y;

  const endY = isGain
    ? Math.max(64, anchor.y - 4)
    : Math.min(window.innerHeight - 48, anchor.y + 88);

  const label = isGain ? `+${item.delta}` : `${item.delta}`;

  return (
    <motion.div
      className="fixed z-[180] pointer-events-none -translate-x-1/2"
      style={{ left: x, top: startY }}
      initial={{ opacity: 0, y: 0, scale: 0.82, filter: 'blur(4px)' }}
      animate={{
        opacity: [0, 0.95, 0.88, 0],
        y: endY - startY,
        scale: isGain ? [0.82, 1.06, 1, 0.94] : [1, 0.96, 0.9, 0.86],
        filter: ['blur(4px)', 'blur(0px)', 'blur(0px)', 'blur(2px)'],
      }}
      transition={{ duration: DURATION, ease: PREMIUM_EASE, times: [0, 0.18, 0.72, 1] }}
      onAnimationComplete={onDone}
    >
      <div
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-sm shadow-lg backdrop-blur-sm border ${
          isGain
            ? 'bg-gradient-to-l from-amber-400/95 to-orange-500/95 text-white border-amber-200/40 shadow-amber-500/25'
            : 'bg-gradient-to-l from-rose-500/90 to-red-600/90 text-white border-rose-200/30 shadow-rose-500/20'
        }`}
      >
        {isGain ? <Sparkles size={14} className="opacity-90" /> : <Minus size={14} strokeWidth={3} />}
        <span className="tabular-nums tracking-tight">{label}</span>
        {isGain && <span className="text-[10px] opacity-80 font-bold">نقطة</span>}
      </div>
    </motion.div>
  );
}

export default function PointsFloatLayer() {
  const [items, setItems] = useState([]);

  const pushItem = useCallback((detail) => {
    const delta = Number(detail?.delta);
    if (!delta || Number.isNaN(delta)) return;
    setItems((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, delta, origin: detail.origin }]);
  }, []);

  useEffect(() => {
    const handler = (e) => pushItem(e.detail);
    window.addEventListener(POINTS_FLOAT_EVENT, handler);
    return () => window.removeEventListener(POINTS_FLOAT_EVENT, handler);
  }, [pushItem]);

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <AnimatePresence>
      {items.map((item) => (
        <FloatChip key={item.id} item={item} onDone={() => removeItem(item.id)} />
      ))}
    </AnimatePresence>
  );
}
