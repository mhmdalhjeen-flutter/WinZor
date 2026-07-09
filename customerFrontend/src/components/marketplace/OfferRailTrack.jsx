import React from 'react';
import useSmartHorizontalScroll, { mergeRefs } from '../../hooks/useSmartHorizontalScroll';

/**
 * Netflix-style horizontal offer rail with smart vertical/horizontal touch resolution.
 */
export default function OfferRailTrack({ children, trackRef, className = '' }) {
  const smartRef = useSmartHorizontalScroll();

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
