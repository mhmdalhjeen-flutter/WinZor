import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SpotlightTour from './SpotlightTour';
import { MAIN_ONBOARDING_STEPS } from './onboardingSteps';
import {
  isMainTourComplete,
  markMainTourComplete,
  ONBOARDING_RESET_EVENT,
  ONBOARDING_START_EVENT,
} from '../../utils/onboardingTour';

export default function OnboardingTourHost({ enabled = true }) {
  const { isAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const tryStart = useCallback(() => {
    if (!enabled || !isAuth || isMainTourComplete()) return;
    if (document.body.classList.contains('offer-viewer-open')) return;
    if (document.body.classList.contains('points-guide-open')) return;
    setStepIndex(0);
    setActive(true);
  }, [enabled, isAuth]);

  useEffect(() => {
    if (!enabled || !isAuth || isMainTourComplete()) return undefined;

    const splashDone = sessionStorage.getItem('app-startup-splash-done') === '1';
    const delay = splashDone ? 900 : 5500;
    const timer = window.setTimeout(tryStart, delay);

    return () => window.clearTimeout(timer);
  }, [enabled, isAuth, tryStart]);

  useEffect(() => {
    const onReset = () => {
      setStepIndex(0);
      setActive(true);
    };
    const onStart = () => tryStart();

    window.addEventListener(ONBOARDING_RESET_EVENT, onReset);
    window.addEventListener(ONBOARDING_START_EVENT, onStart);
    return () => {
      window.removeEventListener(ONBOARDING_RESET_EVENT, onReset);
      window.removeEventListener(ONBOARDING_START_EVENT, onStart);
    };
  }, [tryStart]);

  const step = MAIN_ONBOARDING_STEPS[stepIndex];

  useEffect(() => {
    if (!active || !step?.route) return;
    if (location.pathname !== step.route) {
      navigate(step.route);
    }
  }, [active, step, location.pathname, navigate]);

  const finish = useCallback(() => {
    markMainTourComplete();
    setActive(false);
  }, []);

  const onSkip = finish;

  const onNext = () => {
    if (stepIndex >= MAIN_ONBOARDING_STEPS.length - 1) {
      finish();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const onPrev = () => setStepIndex((i) => Math.max(0, i - 1));

  if (!isAuth) return null;

  return (
    <SpotlightTour
      open={active}
      step={step}
      stepIndex={stepIndex}
      totalSteps={MAIN_ONBOARDING_STEPS.length}
      onNext={onNext}
      onPrev={onPrev}
      onSkip={onSkip}
      onFinish={finish}
    />
  );
}
