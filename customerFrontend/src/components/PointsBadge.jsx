import React, { useEffect, useRef, useState } from 'react';
import { BRAND_LOGO_64 } from '../utils/brandAssets';

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
 * Header rewards badge — soft wavy gradient, «تسوق واربح» + points (matches Flutter).
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
      data-onboarding="points"
      aria-label={`تسوق واربح ${displayPoints.toLocaleString('en-US')} نقطة`}
      className={`relative flex items-center gap-1.5 sm:gap-2 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg sm:rounded-xl min-w-0 max-w-[48%] sm:max-w-none overflow-hidden border border-white/55 shadow-md home-rewards-badge max-h-[2.55rem] sm:max-h-[3rem] active:scale-95 transition-transform ${
        isUp || isDown ? 'animate-pulse' : ''
      }`}
    >
      <span className="pointer-events-none absolute inset-0 home-rewards-badge__gradient" aria-hidden />
      <span
        className="pointer-events-none absolute -left-2 -bottom-2.5 w-10 h-7 rounded-full bg-red-400/20 blur-[1px]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute -right-1.5 -top-2 w-9 h-6 rounded-full bg-blue-400/20 blur-[1px]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute right-7 -bottom-1.5 w-7 h-5 rounded-full bg-green-400/15 blur-[1px]"
        aria-hidden
      />

      <span className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-md sm:rounded-lg bg-white/35 backdrop-blur-sm border border-white/50 shadow-sm shrink-0 overflow-hidden">
        <img
          src={BRAND_LOGO_64}
          alt=""
          className="w-full h-full object-contain p-0.5"
          width={36}
          height={36}
          loading="eager"
          decoding="async"
        />
      </span>

      <div className="relative flex flex-col items-start leading-none min-w-0">
        <span className="text-[9px] sm:text-[10px] font-bold text-gray-800 tracking-tight">
          تسوق واربح
        </span>
        <span
          className={`text-[14px] sm:text-[16px] font-black tabular-nums tracking-tight truncate max-w-full leading-none ${
            isDown ? 'text-red-700' : 'text-gray-900'
          }`}
        >
          {displayPoints.toLocaleString('en-US')}
        </span>
      </div>
    </button>
  );
}
