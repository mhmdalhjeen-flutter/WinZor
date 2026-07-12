import { useCallback, useRef } from 'react';
import useSmartHorizontalScroll from './useSmartHorizontalScroll';

function getSlideScrollTarget(track, slide) {
  return slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2;
}

function snapToNearestSlide(track, behavior = 'smooth') {
  const slides = track.querySelectorAll('.home-offers-rail__slide');
  if (!slides.length) return;

  const viewportCenter = track.scrollLeft + track.clientWidth / 2;
  let bestSlide = slides[0];
  let bestDist = Infinity;

  slides.forEach((slide) => {
    const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
    const dist = Math.abs(slideCenter - viewportCenter);
    if (dist < bestDist) {
      bestDist = dist;
      bestSlide = slide;
    }
  });

  const target = getSlideScrollTarget(track, bestSlide);
  if (Math.abs(track.scrollLeft - target) > 1) {
    track.scrollTo({ left: target, behavior });
  }
}

/**
 * Centered mandatory snap carousel — one card per swipe, active card centered.
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

    let scrollEndTimer = null;

    const onScroll = () => {
      if (scrollEndTimer) clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => snapToNearestSlide(node), 80);
    };

    const onScrollEnd = () => snapToNearestSlide(node);

    node.addEventListener('scroll', onScroll, { passive: true });
    node.addEventListener('scrollend', onScrollEnd, { passive: true });

    cleanupRef.current = () => {
      if (scrollEndTimer) clearTimeout(scrollEndTimer);
      node.removeEventListener('scroll', onScroll);
      node.removeEventListener('scrollend', onScrollEnd);
    };
  }, [smartRef]);

  return setRef;
}

export { getSlideScrollTarget, snapToNearestSlide };
