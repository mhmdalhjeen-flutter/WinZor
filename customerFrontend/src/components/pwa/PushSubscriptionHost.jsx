import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isPushSupported, subscribeToPush } from '../../pwa/pushNotifications';

/**
 * Registers Web Push after authentication without blocking UI.
 * Skips when push is unsupported or notification permission is denied.
 */
export default function PushSubscriptionHost() {
  const { isAuth } = useAuth();
  const attemptedForAuthRef = useRef(false);

  useEffect(() => {
    if (!isAuth) {
      attemptedForAuthRef.current = false;
      return undefined;
    }
    if (!isPushSupported()) return undefined;
    if (Notification.permission === 'denied') return undefined;
    if (attemptedForAuthRef.current) return undefined;

    const run = () => {
      attemptedForAuthRef.current = true;
      subscribeToPush().catch(() => {});
    };

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(run, { timeout: 4000 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(run, 1200);
    return () => window.clearTimeout(timeoutId);
  }, [isAuth]);

  return null;
}
