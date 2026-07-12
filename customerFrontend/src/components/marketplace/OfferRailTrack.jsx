import React, { useEffect, useRef } from 'react';
import useCenterSnapCarousel from '../../hooks/useCenterSnapCarousel';
import { mergeRefs } from '../../hooks/useSmartHorizontalScroll';

/**
 * Centered mandatory snap horizontal offer rail with smart vertical/horizontal touch resolution.
 */
export default function OfferRailTrack({ children, trackRef, className = '', resetKey = '' }) {
  const smartRef = useCenterSnapCarousel();
  const localRef = useRef(null);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    el.scrollLeft = 0;
  }, [resetKey]);

  return (
    <div className={`home-offers-rail ${className}`.trim()}>
      <div
        ref={mergeRefs(smartRef, trackRef, localRef)}
        className="home-offers-rail__track horizontal-swipe"
      >
        {children}
      </div>
    </div>
  );
}
