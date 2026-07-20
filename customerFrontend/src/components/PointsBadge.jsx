import React, { useEffect, useRef, useState } from 'react';

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
 * Header rewards badge — points box first, then «تسوق واربح».
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
      aria-label={`${displayPoints.toLocaleString('en-US')} نقطة — تسوق واربح`}
      className={`flex items-center gap-2.5 sm:gap-3 min-w-0 max-w-[68%] sm:max-w-none active:scale-95 transition-transform ${
        isUp || isDown ? 'animate-pulse' : ''
      }`}
      dir="rtl"
    >
      <span
        className={`relative flex items-center justify-center min-w-[4.25rem] sm:min-w-[5rem] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl overflow-hidden border border-white/80 shadow-md home-rewards-badge shrink-0 ${
          isUp || isDown ? 'animate-pulse' : ''
        }`}
      >
        <span className="pointer-events-none absolute inset-0 home-rewards-badge__gradient" aria-hidden />
        <span
          className="pointer-events-none absolute -left-3 -bottom-3 w-12 h-9 rounded-full home-rewards-badge__glow home-rewards-badge__glow--gold"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -right-2 -top-2.5 w-10 h-8 rounded-full home-rewards-badge__glow home-rewards-badge__glow--sky"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute right-4 -bottom-2 w-8 h-6 rounded-full home-rewards-badge__glow home-rewards-badge__glow--mint"
          aria-hidden
        />
        <span
          className={`relative text-[17px] sm:text-[19px] font-black tabular-nums tracking-tight leading-none ${
            isDown ? 'text-rose-700' : 'text-[#1e3a8a]'
          }`}
        >
          {displayPoints.toLocaleString('en-US')}
        </span>
      </span>

      <span className="text-[12px] sm:text-[13px] font-black text-gray-900 tracking-tight whitespace-nowrap shrink-0">
        تسوق واربح
      </span>
    </button>
  );
}
