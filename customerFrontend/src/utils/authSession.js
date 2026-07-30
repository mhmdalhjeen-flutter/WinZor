const AUTH_STORAGE_KEYS = ['token', 'refreshToken', 'user'];

let invalidateListener = null;

export function registerAuthSessionInvalidator(listener) {
  invalidateListener = listener;
  return () => {
    if (invalidateListener === listener) invalidateListener = null;
  };
}

export function hasStoredAuthToken() {
  const token = localStorage.getItem('token');
  return typeof token === 'string' && token.length > 0 && token !== 'undefined';
}

/** Clear persisted session and sync in-memory auth state (no navigation). */
export function clearStoredAuthSession({ notify = true } = {}) {
  for (const key of AUTH_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  if (notify && invalidateListener) {
    invalidateListener();
  }
}
