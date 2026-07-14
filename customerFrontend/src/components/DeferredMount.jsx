import React, { useEffect, useRef, useState } from 'react';

/**
 * Mount children only after the sentinel enters (near) the viewport.
 * Keeps below-fold Home sections off the critical path.
 */
export default function DeferredMount({
  children,
  rootMargin = '120px',
  placeholder = null,
  once = true,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          if (once) obs.disconnect();
        }
      },
      { rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, rootMargin, once]);

  return (
    <div ref={ref}>
      {visible ? children : placeholder}
    </div>
  );
}
