import React from 'react';
import useCenterSnapCarousel from '../../hooks/useCenterSnapCarousel';
import { mergeRefs } from '../../hooks/useSmartHorizontalScroll';

/**
 * Centered snap horizontal offer rail with smart vertical/horizontal touch resolution.
 */
export default function OfferRailTrack({ children, trackRef, className = '' }) {
  const smartRef = useCenterSnapCarousel();

  return (
    <div className={`home-offers-rail ${className}`.trim()}>
      <div
        ref={mergeRefs(smartRef, trackRef)}
        className="home-offers-rail__track horizontal-swipe"
      >
        {children}
      </div>
    </div>
  );
}
