import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { openSettingsShortcut, PWA_ACTION_SETTINGS } from '../../pwa/pwaShortcutActions';

export default function PwaShortcutHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const action = searchParams.get('pwaAction');
    if (action !== PWA_ACTION_SETTINGS) return;

    handled.current = true;
    const next = new URLSearchParams(searchParams);
    next.delete('pwaAction');
    setSearchParams(next, { replace: true });

    const isAuthed = Boolean(localStorage.getItem('adminToken'));
    openSettingsShortcut(navigate, isAuthed);
  }, [searchParams, setSearchParams, navigate]);

  return null;
}
