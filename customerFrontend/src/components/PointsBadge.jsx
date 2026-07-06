import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins } from 'lucide-react';

function useAnimatedCounter(target, duration = 650) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef(null);

  useEffect(() => {
    if (target === fromRef.current) return undefined;

    const from = fromRef.current;
    const to = target;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return display;
}

/**
 * شارة النقاط — العنصر الأبرز في الـ Header.
 */
export default function PointsBadge({ points = 0, onClick, pulse = null }) {
  const displayPoints = useAnimatedCounter(points);
  const isUp = pulse === 'up';
  const isDown = pulse === 'down';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      id="points-header-anchor"
      aria-label={`${points} نقطة`}
      animate={
        isUp
          ? {
              scale: [1, 1.14, 1],
              boxShadow: [
                '0 0 12px rgba(251,191,36,0.45), 0 4px 20px rgba(245,158,11,0.35)',
                '0 0 28px rgba(252,211,77,0.95), 0 8px 32px rgba(245,158,11,0.55)',
                '0 0 14px rgba(251,191,36,0.5), 0 4px 22px rgba(245,158,11,0.4)',
              ],
            }
          : isDown
            ? {
                scale: [1, 0.96, 1],
                boxShadow: [
                  '0 0 10px rgba(251,191,36,0.35)',
                  '0 0 16px rgba(239,68,68,0.35)',
                  '0 0 10px rgba(251,191,36,0.35)',
                ],
              }
            : {
                boxShadow: [
                  '0 0 10px rgba(251,191,36,0.35), 0 4px 18px rgba(245,158,11,0.25)',
                  '0 0 18px rgba(252,211,77,0.55), 0 4px 22px rgba(245,158,11,0.35)',
                  '0 0 10px rgba(251,191,36,0.35), 0 4px 18px rgba(245,158,11,0.25)',
                ],
              }
      }
      transition={{
        duration: isUp || isDown ? 0.75 : 2.8,
        repeat: isUp || isDown ? 0 : Infinity,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: 0.94 }}
      className="relative flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shrink-0 overflow-hidden"
    >
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/25 via-transparent to-white/10 opacity-60"
        aria-hidden
      />

      <motion.span
        animate={isUp ? { rotate: [0, -12, 12, 0], scale: [1, 1.15, 1] } : {}}
        transition={{ duration: 0.6 }}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-amber-950/15 border border-amber-950/10"
      >
        <Coins size={20} className="text-amber-950 drop-shadow-sm" strokeWidth={2.25} />
      </motion.span>

      <div className="relative flex flex-col items-start leading-none min-w-[2.5rem]">
        <span className="text-[9px] font-black text-amber-950/65 tracking-wide">نقاطي</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayPoints}
            initial={{ y: isUp ? 8 : isDown ? -6 : 0, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isUp ? -8 : 6, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`text-xl font-black tabular-nums tracking-tight ${
              isDown ? 'text-red-950/90' : 'text-amber-950'
            }`}
          >
            {displayPoints.toLocaleString('ar-EG')}
          </motion.span>
        </AnimatePresence>
      </div>

      {isUp && (
        <motion.span
          initial={{ opacity: 0, y: 4, scale: 0.8 }}
          animate={{ opacity: [0, 1, 0], y: -10 }}
          transition={{ duration: 0.9 }}
          className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] font-black text-green-700 pointer-events-none"
        >
          +
        </motion.span>
      )}
      {isDown && (
        <motion.span
          initial={{ opacity: 0, y: -4, scale: 0.8 }}
          animate={{ opacity: [0, 1, 0], y: 10 }}
          transition={{ duration: 0.9 }}
          className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] font-black text-red-700 pointer-events-none"
        >
          −
        </motion.span>
      )}
    </motion.button>
  );
}
