import React, { useCallback, useEffect, useState } from 'react';
import SpotlightTour from './SpotlightTour';
import { MARKETPLACE_ONBOARDING_STEPS } from './onboardingSteps';
import {
  isMarketplaceTourComplete,
  markMarketplaceTourComplete,
  ONBOARDING_RESET_EVENT,
} from '../../utils/onboardingTour';

export default function MarketplaceOnboardingTourHost({ activePage = false }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const tryStart = useCallback(() => {
    if (!activePage || isMarketplaceTourComplete()) return;
    setStepIndex(0);
    setActive(true);
  }, [activePage]);

  useEffect(() => {
    if (!activePage || isMarketplaceTourComplete()) return undefined;
    const timer = window.setTimeout(tryStart, 700);
    return () => window.clearTimeout(timer);
  }, [activePage, tryStart]);

  useEffect(() => {
    const onReset = () => {
      if (!activePage) return;
      setStepIndex(0);
      setActive(true);
    };
    window.addEventListener(ONBOARDING_RESET_EVENT, onReset);
    return () => window.removeEventListener(ONBOARDING_RESET_EVENT, onReset);
  }, [activePage]);

  const finish = useCallback(() => {
    markMarketplaceTourComplete();
    setActive(false);
  }, []);

  const step = MARKETPLACE_ONBOARDING_STEPS[stepIndex];

  return (
    <SpotlightTour
      open={active}
      step={step}
      stepIndex={stepIndex}
      totalSteps={MARKETPLACE_ONBOARDING_STEPS.length}
      onNext={() => {
        if (stepIndex >= MARKETPLACE_ONBOARDING_STEPS.length - 1) finish();
        else setStepIndex((i) => i + 1);
      }}
      onPrev={() => setStepIndex((i) => Math.max(0, i - 1))}
      onSkip={finish}
      onFinish={finish}
    />
  );
}
