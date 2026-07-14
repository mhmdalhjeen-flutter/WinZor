import React, { useEffect, useRef, useState } from 'react';
import logoImg from '../assets/logo/win-goldenstore-logo.png';

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
 * Premium compact rewards badge — Arabic label, English digit points.
 * CSS-only feedback (no framer-motion) for a lighter Home critical path.
 */
export default function PointsBadge({ points = 0, onClick, pulse = null }) {
  const displayPoints = useAnimatedCounter(points);
  const isUp = pulse === 'up';
  const isDown = pulse === 'down';

  return (
    <button
      type="button"
      onClick={onClick}
      id="points-header-anchor"
      aria-label={`نقاطك ${displayPoints.toLocaleString('en-US')}`}
      className={`relative flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl min-w-0 max-w-[48%] sm:max-w-none overflow-hidden border border-white/50 shadow-md home-rewards-badge max-h-[2.55rem] sm:max-h-[3rem] active:scale-95 transition-transform ${
        isUp || isDown ? 'animate-pulse' : ''
      }`}
    >
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/5"
        aria-hidden
      />

      <span className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-md sm:rounded-lg bg-white/25 backdrop-blur-sm border border-white/40 shadow-sm shrink-0 overflow-hidden">
        <img
          src={logoImg}
          alt=""
          className="w-full h-full object-contain p-0.5"
          width={36}
          height={36}
          loading="eager"
          decoding="async"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />
      </span>

      <div className="relative flex flex-col items-start leading-none min-w-0">
        <span className="text-[9px] sm:text-[10px] font-bold text-white tracking-tight">
          نقاطك
        </span>
        <span
          className={`text-[14px] sm:text-[16px] font-black tabular-nums tracking-tight truncate max-w-full leading-none ${
            isDown
              ? 'text-red-100'
              : 'text-white [text-shadow:0_0_12px_rgba(255,255,255,0.65),0_1px_0_rgba(255,255,255,0.9),0_0_24px_rgba(251,191,36,0.35)]'
          }`}
        >
          {displayPoints.toLocaleString('en-US')}
        </span>
      </div>
    </button>
  );
}
