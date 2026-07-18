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
      className={`flex items-center gap-2 sm:gap-2.5 min-w-0 max-w-[58%] sm:max-w-none active:scale-95 transition-transform ${
        isUp || isDown ? 'animate-pulse' : ''
      }`}
    >
      <span className="text-[11px] sm:text-xs font-black text-gray-900 tracking-tight whitespace-nowrap shrink-0">
        تسوق واربح
      </span>

      <span
        className={`relative flex items-center justify-center min-w-[3.25rem] sm:min-w-[3.75rem] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl overflow-hidden border border-white/55 shadow-md home-rewards-badge max-h-[2.55rem] sm:max-h-[3rem] shrink-0 ${
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
          className="pointer-events-none absolute right-3 -bottom-1.5 w-7 h-5 rounded-full bg-green-400/15 blur-[1px]"
          aria-hidden
        />
        <span
          className={`relative text-[14px] sm:text-[16px] font-black tabular-nums tracking-tight leading-none ${
            isDown ? 'text-red-700' : 'text-gray-900'
          }`}
        >
          {displayPoints.toLocaleString('en-US')}
        </span>
      </span>
    </button>
  );
}
