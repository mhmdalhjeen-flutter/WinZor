import { ENTER_CARD_EVENT } from '../utils/pointsGuideEvents';
import { AUTH_GATE_MESSAGES } from '../utils/authGateMessages';

export const PWA_ACTION_CODE = 'code';
export const PENDING_ACTION_KEY = 'winzor_pwa_pending_action';

export function setPendingPwaAction(action) {
  try {
    sessionStorage.setItem(PENDING_ACTION_KEY, action);
  } catch {
    /* ignore */
  }
}

export function peekPendingPwaAction() {
  try {
    return sessionStorage.getItem(PENDING_ACTION_KEY);
  } catch {
    return null;
  }
}

export function consumePendingPwaAction() {
  const action = peekPendingPwaAction();
  try {
    sessionStorage.removeItem(PENDING_ACTION_KEY);
  } catch {
    /* ignore */
  }
  return action;
}

/** After login — open code entry if that was the pending shortcut action. */
export function completePendingPwaAction(navigate) {
  const action = consumePendingPwaAction();
  if (action !== PWA_ACTION_CODE) return false;

  navigate('/', { replace: true });
  window.setTimeout(() => {
    window.dispatchEvent(new CustomEvent(ENTER_CARD_EVENT));
  }, 650);
  return true;
}

export function openCodeEntry(navigate, isAuth, runWithAuth) {
  const open = () => {
    navigate('/', { replace: true });
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(ENTER_CARD_EVENT));
    }, 400);
  };

  if (!isAuth) {
    setPendingPwaAction(PWA_ACTION_CODE);
    if (runWithAuth) {
      runWithAuth(open, AUTH_GATE_MESSAGES.activationCode);
      return;
    }
    navigate('/');
    return;
  }
  open();
}
