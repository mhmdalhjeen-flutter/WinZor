const TUTORIAL_KEY = 'winzor_offer_viewer_tutorial_done';

export function isTutorialDone() {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1';
  } catch {
    return true;
  }
}

export function markTutorialDone() {
  try {
    localStorage.setItem(TUTORIAL_KEY, '1');
  } catch {
    /* ignore */
  }
}
