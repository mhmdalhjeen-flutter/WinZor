import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { scheduleBackgroundRefresh } from '../../lib/backgroundRefresh';
import { pruneStaleRecentlyViewed } from '../../utils/recentlyViewed';
import { pruneStaleVisitedStores } from '../../utils/visitedStores';

/**
 * Runs selective background refresh when the PWA opens or regains connectivity.
 * Does not block rendering — cached data is shown immediately via persist hydration.
 */
export default function BackgroundRefreshHost() {
  const queryClient = useQueryClient();
  const { isAuth } = useAuth();
  const ranRef = useRef(false);

  useEffect(() => {
    pruneStaleRecentlyViewed();
    pruneStaleVisitedStores();
  }, []);

  useEffect(() => {
    if (ranRef.current) return undefined;
    ranRef.current = true;
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
