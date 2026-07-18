import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const HOME_PATHS = new Set(['/', '/intro']);
const AUTH_ONLY_PATHS = new Set(['/login', '/register', '/forgot-password', '/verify-email']);

/**
 * Improves browser Back behavior:
 * - Deep-linked inner routes get a synthetic Home entry so Back returns in-app.
 * - On Home with router history, Back follows normal React Router stack.
 * - On Home as the only in-app entry, Back may leave the site (expected).
 * - Skips when offer reel overlay manages its own history.
 */
export default function useBrowserBackGuard(isAuth) {
  const location = useLocation();
  const navigate = useNavigate();
  const seededKeysRef = useRef(new Set());

  // Seed Home beneath a direct landing on an inner route (idx === 0).
  useEffect(() => {
    if (!isAuth) return;

    const path = location.pathname;
    if (HOME_PATHS.has(path) || AUTH_ONLY_PATHS.has(path)) return;

    const state = window.history.state;
    const key = state?.key;
    if (key && seededKeysRef.current.has(key)) return;

    const idx = typeof state?.idx === 'number' ? state.idx : 0;
    if (idx !== 0) return;

    if (key) seededKeysRef.current.add(key);

    const currentUrl = `${path}${location.search}${location.hash}`;
    window.history.pushState({ idx: 0, key: 'app-home-base', usr: {} }, '', '/');
    window.history.pushState(
      { ...state, idx: 1 },
      '',
      currentUrl,
    );
  }, [isAuth, location.pathname, location.search, location.hash]);

  // Sync React Router when popstate lands on a URL we pushed manually.
  useEffect(() => {
    if (!isAuth) return undefined;

    const onPopState = () => {
      if (document.body.classList.contains('offer-viewer-open')) return;

      queueMicrotask(() => {
        const path = window.location.pathname;
        if (path === location.pathname) return;

        if (HOME_PATHS.has(path)) {
          navigate(path, { replace: false });
          return;
        }

        navigate(`${path}${window.location.search}${window.location.hash}`, { replace: false });
      });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isAuth, navigate, location.pathname]);

  return null;
}
