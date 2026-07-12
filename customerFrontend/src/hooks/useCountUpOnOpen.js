import { useEffect, useRef, useState } from 'react';

/**
 * Premium count-up when `active` becomes true (e.g. modal open).
 */
export function useCountUpOnOpen(target = 0, active = false, duration = 1100) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setDisplay(0);
      fromRef.current = 0;
      return undefined;
    }

    const from = 0;
    const to = Math.max(0, Number(target) || 0);
    const start = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 4;
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
  }, [active, target, duration]);

  return display;
}
