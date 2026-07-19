import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { onboardingTarget } from '../../utils/onboardingTour';

const PAD = 10;
const TOOLTIP_GAP = 14;

function clampRect(rect) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    top: Math.max(PAD, rect.top),
    left: Math.max(PAD, rect.left),
    width: Math.min(rect.width, vw - PAD * 2),
    height: Math.min(rect.height, vh - PAD * 2),
  };
}

function SpotlightTour({
  open,
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onFinish,
}) {
  const [rect, setRect] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({ top: 0, left: 0, maxWidth: 320 });
  const activeTargetRef = useRef(null);

  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= totalSteps - 1;

  const clearActiveTarget = useCallback(() => {
    if (activeTargetRef.current) {
      activeTargetRef.current.classList.remove('onboarding-tour-target-active');
      activeTargetRef.current = null;
    }
  }, []);

  const measure = useCallback(() => {
    if (!open || !step?.target) {
      clearActiveTarget();
      setRect(null);
      return;
    }

    const el = document.querySelector(onboardingTarget(step.target));
    if (!el) {
      clearActiveTarget();
      setRect(null);
      return;
    }

    if (activeTargetRef.current !== el) {
      clearActiveTarget();
      el.classList.add('onboarding-tour-target-active');
      activeTargetRef.current = el;
    }

    if (step.scroll !== false) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }

    const updateRect = () => {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 && r.height <= 0) return;

      const box = clampRect({
        top: r.top - PAD,
        left: r.left - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      });
      setRect(box);

      const tooltipW = Math.min(320, window.innerWidth - 24);
      const spaceBelow = window.innerHeight - (box.top + box.height);
      const placeBelow = spaceBelow > 180 || box.top < window.innerHeight / 2;
      const top = placeBelow
        ? box.top + box.height + TOOLTIP_GAP
        : box.top - TOOLTIP_GAP - 160;
      const left = Math.min(
        Math.max(12, box.left + box.width / 2 - tooltipW / 2),
        window.innerWidth - tooltipW - 12,
      );

      setTooltipStyle({
        top: Math.max(12, Math.min(top, window.innerHeight - 180)),
        left,
        maxWidth: tooltipW,
      });
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(updateRect);
    });
  }, [open, step, clearActiveTarget]);

  useLayoutEffect(() => {
    measure();
  }, [measure, stepIndex, open]);

  useEffect(() => {
    if (!open) {
      clearActiveTarget();
      return undefined;
    }

    const onReflow = () => measure();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    const retry = window.setTimeout(measure, 420);

    return () => {
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
      window.clearTimeout(retry);
      clearActiveTarget();
    };
  }, [open, measure, clearActiveTarget]);

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
          <div className="onboarding-tour-backdrop" aria-hidden />

          {rect && (
            <motion.div
              className="onboarding-tour-spotlight"
              initial={{ opacity: 0, scale: 0.96 }}
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
                جاري تحديد العنصر… انتقل للصفحة المناسبة أو اضغط «التالي».
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
