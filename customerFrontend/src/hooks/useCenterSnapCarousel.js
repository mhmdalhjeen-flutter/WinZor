import { useCallback, useRef } from 'react';
import useSmartHorizontalScroll from './useSmartHorizontalScroll';

function getSlideScrollTarget(track, slide) {
  return slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
}

function snapToNearestSlide(track) {
  const slides = track.querySelectorAll('.home-offers-rail__slide');
  if (!slides.length) return;

  const viewportCenter = track.scrollLeft + track.clientWidth / 2;
  let bestSlide = slides[0];
  let bestDist = Infinity;

  for (let i = 0; i < slides.length; i += 1) {
    const slide = slides[i];
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const dist = Math.abs(slideCenter - viewportCenter);
    if (dist < bestDist) {
      bestDist = dist;
      bestSlide = slide;
    }
  }

  const target = getSlideScrollTarget(track, bestSlide);
  if (Math.abs(track.scrollLeft - target) > 2) {
    track.scrollTo({ left: target, behavior: 'auto' });
  }
}

/**
 * Centered mandatory snap carousel — CSS snap during swipe; correct only on scrollend.
 */
export default function useCenterSnapCarousel() {
  const smartRef = useSmartHorizontalScroll();
  const cleanupRef = useRef(null);

  const setRef = useCallback((node) => {
    smartRef(node);

    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (!node) return;

    const onScrollEnd = () => {
      snapToNearestSlide(node);
    };

    node.addEventListener('scrollend', onScrollEnd, { passive: true });

    cleanupRef.current = () => {
      node.removeEventListener('scrollend', onScrollEnd);
    };
  }, [smartRef]);

  return setRef;
}

export { getSlideScrollTarget, snapToNearestSlide };
