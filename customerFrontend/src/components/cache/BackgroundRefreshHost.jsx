import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { scheduleBackgroundRefresh } from '../../lib/backgroundRefresh';
import { pruneStaleRecentlyViewed } from '../../utils/recentlyViewed';
import { pruneStaleVisitedStores } from '../../utils/visitedStores';

/**
 * Runs selective background refresh when the PWA opens or regains connectivity.
 * Does not block rendering — cached data is shown immediately via persist hydration.
 *
 * Auth-aware: guest can warm public cache; login (false → true) schedules again
 * so auth-scoped keys are not skipped by an early guest run.
 */
export default function BackgroundRefreshHost() {
  const queryClient = useQueryClient();
  const { isAuth } = useAuth();
  /** Auth flag last passed to scheduleBackgroundRefresh; null before first run. */
  const lastScheduledAuthRef = useRef(null);

  useEffect(() => {
    pruneStaleRecentlyViewed();
    pruneStaleVisitedStores();
  }, []);

  useEffect(() => {
    if (lastScheduledAuthRef.current === isAuth) return undefined;
    lastScheduledAuthRef.current = isAuth;
    scheduleBackgroundRefresh(queryClient, { isAuth });
    return undefined;
  }, [queryClient, isAuth]);

  useEffect(() => {
    const onOnline = () => scheduleBackgroundRefresh(queryClient, { isAuth });
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [queryClient, isAuth]);

  return null;
}
