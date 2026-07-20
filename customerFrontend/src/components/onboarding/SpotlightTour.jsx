import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { findOnboardingElement, ONBOARDING_TOUR_BODY_CLASS } from '../../utils/onboardingTour';

const PAD = 10;
const TOOLTIP_GAP = 14;
const MIN_HOLE = 24;

function clampRectToViewport(rect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const top = Math.max(0, rect.top);
  const left = Math.max(0, rect.left);
  const right = Math.min(vw, rect.left + rect.width);
  const bottom = Math.min(vh, rect.top + rect.height);

  return {
    top,
    left,
    width: Math.max(MIN_HOLE, right - left),
    height: Math.max(MIN_HOLE, bottom - top),
  };
}

function DimPanels({ rect }) {
  if (!rect) {
    return <div className="onboarding-tour-backdrop onboarding-tour-backdrop--full" aria-hidden />;
  }

  const { top, left, width, height } = rect;
  const bottom = top + height;
  const right = left + width;
  const panelClass = 'onboarding-tour-dim-panel';

  return (
    <>
      <div className={panelClass} style={{ top: 0, left: 0, right: 0, height: top }} aria-hidden />
      <div className={panelClass} style={{ top: bottom, left: 0, right: 0, bottom: 0 }} aria-hidden />
      <div className={panelClass} style={{ top, left: 0, width: left, height }} aria-hidden />
      <div className={panelClass} style={{ top, left: right, right: 0, height }} aria-hidden />
    </>
  );
}

function SpotlightTour({
  open,
  layoutKey = '',
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onFinish,
  onTargetMissing,
}) {
  const [rect, setRect] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({ top: 0, left: 0, maxWidth: 320 });
  const activeTargetRef = useRef(null);
  const cardRef = useRef(null);
  const missingReportedRef = useRef(false);

  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= totalSteps - 1;

  const clearActiveTarget = useCallback(() => {
    if (activeTargetRef.current) {
      activeTargetRef.current.classList.remove('onboarding-tour-target-active');
      activeTargetRef.current = null;
    }
  }, []);

  const updateTooltipPosition = useCallback((box) => {
    const cardEl = cardRef.current;
    const tooltipW = Math.min(320, window.innerWidth - 24);
    const tooltipH = cardEl?.offsetHeight || 180;
    const spaceBelow = window.innerHeight - (box.top + box.height);
    const placeBelow = spaceBelow > tooltipH + TOOLTIP_GAP || box.top < window.innerHeight / 2;
    const top = placeBelow
      ? box.top + box.height + TOOLTIP_GAP
      : box.top - TOOLTIP_GAP - tooltipH;
    const left = Math.min(
      Math.max(12, box.left + box.width / 2 - tooltipW / 2),
      window.innerWidth - tooltipW - 12,
    );

    setTooltipStyle({
      top: Math.max(12, Math.min(top, window.innerHeight - tooltipH - 12)),
      left,
      maxWidth: tooltipW,
    });
  }, []);

  const measure = useCallback(() => {
    if (!open || !step?.target) {
      clearActiveTarget();
      setRect(null);
      return null;
    }

    const el = findOnboardingElement(step.target);
    if (!el) {
      clearActiveTarget();
      setRect(null);
      return null;
    }

    missingReportedRef.current = false;

    if (activeTargetRef.current !== el) {
      clearActiveTarget();
      el.classList.add('onboarding-tour-target-active');
      activeTargetRef.current = el;
    }

    if (step.scroll !== false) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }

    const raw = el.getBoundingClientRect();
    if (raw.width <= 0 && raw.height <= 0) return null;

    const box = clampRectToViewport({
      top: raw.top - PAD,
      left: raw.left - PAD,
      width: raw.width + PAD * 2,
      height: raw.height + PAD * 2,
    });

    setRect(box);
    updateTooltipPosition(box);
    return el;
  }, [open, step, clearActiveTarget, onTargetMissing, updateTooltipPosition]);

  useLayoutEffect(() => {
    missingReportedRef.current = false;
    measure();
  }, [measure, stepIndex, open, layoutKey]);

  useEffect(() => {
    if (!open) {
      document.body.classList.remove(ONBOARDING_TOUR_BODY_CLASS);
      return undefined;
    }
    document.body.classList.add(ONBOARDING_TOUR_BODY_CLASS);
    return () => document.body.classList.remove(ONBOARDING_TOUR_BODY_CLASS);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !rect) return undefined;
    updateTooltipPosition(rect);
  }, [open, rect, updateTooltipPosition]);

  useEffect(() => {
    if (!open) {
      clearActiveTarget();
      return undefined;
    }

    const runMeasure = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(measure);
      });
    };

    runMeasure();

    const onReflow = () => runMeasure();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    window.visualViewport?.addEventListener('resize', onReflow);
    window.visualViewport?.addEventListener('scroll', onReflow);

    const retryTimers = [120, 420, 900].map((ms) => window.setTimeout(runMeasure, ms));
    const missingTimer = window.setTimeout(() => {
      if (!findOnboardingElement(step?.target) && !missingReportedRef.current) {
        missingReportedRef.current = true;
        onTargetMissing?.(step);
      }
    }, 1200);

    let resizeObserver;
    const el = findOnboardingElement(step?.target);
    if (el && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(onReflow);
      resizeObserver.observe(el);
    }

    return () => {
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
      window.visualViewport?.removeEventListener('resize', onReflow);
      window.visualViewport?.removeEventListener('scroll', onReflow);
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(missingTimer);
      resizeObserver?.disconnect();
    };
  }, [open, measure, step?.target, onTargetMissing, layoutKey]);

  useEffect(() => {
    if (!open) {
      clearActiveTarget();
    }
  }, [open, clearActiveTarget]);

  useEffect(() => () => clearActiveTarget(), [clearActiveTarget]);

  if (!open || !step) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="onboarding-root"
          className="onboarding-tour-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-tour-title"
        >
          <DimPanels rect={rect} />

          {rect && (
            <motion.div
              className="onboarding-tour-spotlight"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
              }}
            />
          )}

          <motion.div
            ref={cardRef}
            className="onboarding-tour-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.28, delay: 0.05 }}
            style={tooltipStyle}
          >
            <div className="onboarding-tour-card__head">
              <div>
                <p className="onboarding-tour-card__step">
                  {stepIndex + 1} / {totalSteps}
                </p>
                <h2 id="onboarding-tour-title" className="onboarding-tour-card__title">
                  {step.title}
                </h2>
              </div>
              <button
                type="button"
                className="onboarding-tour-card__close"
                onClick={onSkip}
                aria-label="تخطي الجولة"
              >
                <X size={18} />
              </button>
            </div>

            <p className="onboarding-tour-card__body">{step.body}</p>

            {!rect && (
              <p className="onboarding-tour-card__hint text-amber-700 bg-amber-50 rounded-xl px-3 py-2 text-xs font-bold mb-3">
                جاري تحديد العنصر…
              </p>
            )}

            <div className="onboarding-tour-card__actions">
              <button type="button" className="onboarding-tour-btn onboarding-tour-btn--ghost" onClick={onSkip}>
                تخطي
              </button>
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button type="button" className="onboarding-tour-btn onboarding-tour-btn--secondary" onClick={onPrev}>
                    <ChevronRight size={16} />
                    السابق
                  </button>
                )}
                {isLast ? (
                  <button type="button" className="onboarding-tour-btn onboarding-tour-btn--primary" onClick={onFinish}>
                    إنهاء
                  </button>
                ) : (
                  <button type="button" className="onboarding-tour-btn onboarding-tour-btn--primary" onClick={onNext}>
                    التالي
                    <ChevronLeft size={16} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export default SpotlightTour;
