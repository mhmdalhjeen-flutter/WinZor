import { useCallback, useRef } from 'react';

const MOVE_THRESHOLD = 6;
const VERTICAL_RATIO = 1.15;
const HORIZONTAL_RATIO = 1.15;

/**
 * Resolves diagonal touches on overflow-x rails: vertical drags scroll the page,
 * horizontal drags scroll the rail (Instagram / Play Store style).
 */
export default function useSmartHorizontalScroll() {
  const cleanupRef = useRef(null);

  const setRef = useCallback((node) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (!node || typeof window === 'undefined') return;

    let gesture = null;

    const reset = () => {
      gesture = null;
      node.style.removeProperty('touch-action');
      node.style.removeProperty('overscroll-behavior-x');
    };

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      gesture = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        locked: null,
      };
    };

    const onTouchMove = (e) => {
      if (!gesture || e.touches.length !== 1) return;
      if (gesture.locked === 'vertical') return;

      const dx = e.touches[0].clientX - gesture.startX;
      const dy = e.touches[0].clientY - gesture.startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < MOVE_THRESHOLD && absY < MOVE_THRESHOLD) return;

      if (absY > absX * VERTICAL_RATIO) {
        gesture.locked = 'vertical';
        node.style.touchAction = 'pan-y pinch-zoom';
        return;
      }

      if (absX > absY * HORIZONTAL_RATIO && !gesture.locked) {
        gesture.locked = 'horizontal';
        node.style.touchAction = 'pan-x pinch-zoom';
        node.style.overscrollBehaviorX = 'contain';
      }
    };

    const onTouchEnd = () => reset();

    node.addEventListener('touchstart', onTouchStart, { passive: true });
    node.addEventListener('touchmove', onTouchMove, { passive: true });
    node.addEventListener('touchend', onTouchEnd, { passive: true });
    node.addEventListener('touchcancel', onTouchEnd, { passive: true });

    cleanupRef.current = () => {
      reset();
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', onTouchEnd);
      node.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  return setRef;
}

/** Merge smart-scroll ref with an optional secondary ref (e.g. scrollByDir). */
export function mergeRefs(...refs) {
  return (node) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    });
  };
}
