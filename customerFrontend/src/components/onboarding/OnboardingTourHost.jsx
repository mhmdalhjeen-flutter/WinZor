import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SpotlightTour from './SpotlightTour';
import { MAIN_ONBOARDING_STEPS } from './onboardingSteps';
import {
  isMainTourComplete,
  markMainTourComplete,
  ONBOARDING_RESET_EVENT,
  ONBOARDING_START_EVENT,
  waitForTourShellReady,
} from '../../utils/onboardingTour';
import { isGiftActivationFlowActive } from '../../utils/giftActivationFlow';

function getBlockedReason() {
  if (isGiftActivationFlowActive()) return 'gift';
  if (document.body.classList.contains('offer-viewer-open')) return 'offer-viewer';
  if (document.body.classList.contains('points-guide-open')) return 'points-guide';
  return null;
}

export default function OnboardingTourHost({ enabled = true }) {
  const { isAuth } = useAuth();
  const location = useLocation();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const autoStartedRef = useRef(false);
  const startingRef = useRef(false);

  const finish = useCallback(() => {
    markMainTourComplete();
    setActive(false);
  }, []);

  const advanceStep = useCallback(() => {
    setStepIndex((current) => {
      if (current >= MAIN_ONBOARDING_STEPS.length - 1) return current;
      return current + 1;
    });
  }, []);

  const tryStart = useCallback(async () => {
    if (!enabled || !isAuth || isMainTourComplete() || startingRef.current) return;
    if (getBlockedReason()) return;

    startingRef.current = true;
    try {
      const ready = await waitForTourShellReady(
        MAIN_ONBOARDING_STEPS.map((item) => item.target),
        { timeout: 6000 },
      );
      if (!ready || getBlockedReason() || isMainTourComplete()) return;

      setStepIndex(0);
      setActive(true);
    } finally {
      startingRef.current = false;
    }
  }, [enabled, isAuth]);

  useEffect(() => {
    if (!isAuth || isMainTourComplete() || autoStartedRef.current) return undefined;
    if (getBlockedReason()) return undefined;

    const splashDone = sessionStorage.getItem('app-startup-splash-done') === '1';
    const delay = splashDone ? 900 : 3200;
    const timer = window.setTimeout(() => {
      if (autoStartedRef.current || isMainTourComplete() || getBlockedReason()) return;
      autoStartedRef.current = true;
      tryStart();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [isAuth, tryStart]);

  useEffect(() => {
    const onReset = () => {
      autoStartedRef.current = false;
      setStepIndex(0);
      waitForTourShellReady(
        MAIN_ONBOARDING_STEPS.map((item) => item.target),
        { timeout: 4000 },
      ).then((ready) => {
        if (ready) setActive(true);
      });
    };
    const onStart = () => {
      autoStartedRef.current = true;
      tryStart();
    };

    window.addEventListener(ONBOARDING_RESET_EVENT, onReset);
    window.addEventListener(ONBOARDING_START_EVENT, onStart);
    return () => {
      window.removeEventListener(ONBOARDING_RESET_EVENT, onReset);
      window.removeEventListener(ONBOARDING_START_EVENT, onStart);
    };
  }, [tryStart]);

  const step = MAIN_ONBOARDING_STEPS[stepIndex];

  const onSkip = finish;

  const onNext = () => {
    if (stepIndex >= MAIN_ONBOARDING_STEPS.length - 1) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const onPrev = () => setStepIndex((i) => Math.max(0, i - 1));

  const onTargetMissing = useCallback(() => {
    if (stepIndex >= MAIN_ONBOARDING_STEPS.length - 1) {
      finish();
      return;
    }
    advanceStep();
  }, [advanceStep, finish, stepIndex]);

  if (!isAuth) return null;

  return (
    <SpotlightTour
      open={active}
      layoutKey={location.pathname}
      step={step}
      stepIndex={stepIndex}
      totalSteps={MAIN_ONBOARDING_STEPS.length}
      onNext={onNext}
      onPrev={onPrev}
      onSkip={onSkip}
      onFinish={finish}
      onTargetMissing={onTargetMissing}
    />
  );
}
