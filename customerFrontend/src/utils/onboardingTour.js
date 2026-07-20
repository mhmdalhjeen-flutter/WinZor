const MAIN_TOUR_KEY = 'win_golden_app_onboarding_v1';
const MARKETPLACE_TOUR_KEY = 'win_golden_marketplace_onboarding_v1';

export const ONBOARDING_RESET_EVENT = 'app-onboarding-reset';
export const ONBOARDING_START_EVENT = 'app-onboarding-start';
export const ONBOARDING_TOUR_BODY_CLASS = 'onboarding-tour-active';

export function isMainTourComplete() {
  try {
    return localStorage.getItem(MAIN_TOUR_KEY) === '1';
  } catch {
    return true;
  }
}

export function markMainTourComplete() {
  try {
    localStorage.setItem(MAIN_TOUR_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function isMarketplaceTourComplete() {
  try {
    return localStorage.getItem(MARKETPLACE_TOUR_KEY) === '1';
  } catch {
    return true;
  }
}

export function markMarketplaceTourComplete() {
  try {
    localStorage.setItem(MARKETPLACE_TOUR_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function resetAllOnboardingTours() {
  try {
    localStorage.removeItem(MAIN_TOUR_KEY);
    localStorage.removeItem(MARKETPLACE_TOUR_KEY);
  } catch {
    /* ignore */
  }
}

export function onboardingTarget(selector) {
  return `[data-onboarding="${selector}"]`;
}

export function findOnboardingElement(target) {
  if (!target) return null;
  return document.querySelector(onboardingTarget(target));
}

export function isOnboardingTargetReady(target) {
  const el = findOnboardingElement(target);
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

export function waitForOnboardingTarget(target, { timeout = 4000, interval = 80 } = {}) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeout;

    const tick = () => {
      if (isOnboardingTargetReady(target)) {
        resolve(findOnboardingElement(target));
        return;
      }
      if (Date.now() >= deadline) {
        resolve(null);
        return;
      }
      window.setTimeout(tick, interval);
    };

    tick();
  });
}

export async function waitForTourShellReady(stepTargets = [], { timeout = 5000 } = {}) {
  if (typeof document === 'undefined') return false;

  if (document.readyState !== 'complete') {
    await new Promise((resolve) => {
      window.addEventListener('load', resolve, { once: true });
      window.setTimeout(resolve, timeout);
    });
  }

  const uniqueTargets = [...new Set(stepTargets.filter(Boolean))];
  await Promise.all(
    uniqueTargets.map((target) => waitForOnboardingTarget(target, { timeout })),
  );

  await new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });

  return uniqueTargets.some((target) => isOnboardingTargetReady(target));
}
