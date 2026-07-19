import { useEffect, useState } from 'react';

/** Local 1s tick for countdown UI — no API refetch. */
export function useSecondTick(enabled = true) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);

  return undefined;
}
