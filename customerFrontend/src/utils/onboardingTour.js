const MAIN_TOUR_KEY = 'win_golden_app_onboarding_v1';
const MARKETPLACE_TOUR_KEY = 'win_golden_marketplace_onboarding_v1';

export const ONBOARDING_RESET_EVENT = 'app-onboarding-reset';
export const ONBOARDING_START_EVENT = 'app-onboarding-start';

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
