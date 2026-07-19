import React, { useEffect, useRef } from 'react';
import useSmartHorizontalScroll from '../../hooks/useSmartHorizontalScroll';
import { mergeRefs } from '../../hooks/useSmartHorizontalScroll';

/**
 * Horizontal offer/product rail — renders every child slide; native overflow scroll.
 */
export default function OfferRailTrack({ children, trackRef, className = '', resetKey = '' }) {
  const smartRef = useSmartHorizontalScroll();
  const localRef = useRef(null);

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: 'auto' });
  }, [resetKey]);

  return (
    <div className={`home-offers-rail ${className}`.trim()}>
      <div
        ref={mergeRefs(smartRef, trackRef, localRef)}
        className="home-offers-rail__track touch-scroll-smart"
      >
        <div className="home-offers-rail__inner">
          {children}
        </div>
      </div>
    </div>
  );
}
