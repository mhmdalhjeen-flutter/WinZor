import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthGate } from '../../context/AuthGateContext';
import { openCodeEntry, PWA_ACTION_CODE } from '../../pwa/pwaShortcutActions';

/** Handles manifest shortcut query params without changing routes. */
export default function PwaShortcutHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuth } = useAuth();
  const { runWithAuth } = useAuthGate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const action = searchParams.get('pwaAction');
    if (!action) return;

    handled.current = true;
    const next = new URLSearchParams(searchParams);
    next.delete('pwaAction');
    setSearchParams(next, { replace: true });

    if (action === PWA_ACTION_CODE) {
      openCodeEntry(navigate, isAuth, runWithAuth);
    }
  }, [searchParams, setSearchParams, navigate, isAuth, runWithAuth]);

  return null;
}
