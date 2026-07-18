export const PWA_ACTION_SETTINGS = 'settings';
export const PENDING_ACTION_KEY = 'admin_pwa_pending_action';

export function setPendingPwaAction(action) {
  try {
    sessionStorage.setItem(PENDING_ACTION_KEY, action);
  } catch {
    /* ignore */
  }
}

export function consumePendingPwaAction() {
  try {
    const action = sessionStorage.getItem(PENDING_ACTION_KEY);
    sessionStorage.removeItem(PENDING_ACTION_KEY);
    return action;
  } catch {
    return null;
  }
}

export function completePendingPwaAction(navigate) {
  const action = consumePendingPwaAction();
  if (action === PWA_ACTION_SETTINGS) {
    navigate('/settings', { replace: true });
    return true;
  }
  return false;
}

export function openSettingsShortcut(navigate, isAuthed) {
  if (!isAuthed) {
    setPendingPwaAction(PWA_ACTION_SETTINGS);
    navigate('/login');
    return;
  }
  navigate('/settings', { replace: true });
}
