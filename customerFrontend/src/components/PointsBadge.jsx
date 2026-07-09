import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
 * Premium compact rewards badge — logo, brand, English points.
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
      aria-label={`${displayPoints.toLocaleString('en-US')} points`}
      animate={
        isUp
          ? { scale: [1, 1.06, 1] }
          : isDown
            ? { scale: [1, 0.97, 1] }
            : {}
      }
      transition={{ duration: 0.5 }}
      whileTap={{ scale: 0.96 }}
      className="relative flex items-center gap-2 px-2.5 py-1 rounded-xl shrink-0 overflow-hidden border border-white/40 shadow-sm home-rewards-badge"
    >
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 opacity-100"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/5"
        aria-hidden
      />

      <span className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 shrink-0">
        <span className="text-white text-[9px] font-black tracking-tight">WZ</span>
      </span>

      <div className="relative flex flex-col items-start leading-none min-w-0">
        <span className="text-[10px] font-black text-white tracking-tight truncate max-w-[5rem] sm:max-w-none">
          Winzor
        </span>
        <span className="text-[9px] font-semibold text-white/90 mt-0.5">⭐ Rewards</span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={displayPoints}
            initial={{ y: isUp ? 4 : isDown ? -4 : 0, opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: isUp ? -4 : 4, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`text-[11px] font-black tabular-nums tracking-tight mt-0.5 ${
              isDown ? 'text-red-100' : 'text-white'
            }`}
          >
            {displayPoints.toLocaleString('en-US')} points
          </motion.span>
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
