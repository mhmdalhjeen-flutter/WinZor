import api from '../api/axios';
import { unwrapList } from '../utils/unwrapList';
import { queryKeys } from './queryClient';
import {
  DEFAULT_BAZAAR_BROWSE_KEY,
  DEFAULT_HOME_FEED_KEY,
  DEFAULT_STORES_BROWSE_KEY,
} from './cacheConfig';

/**
 * Background refresh on PWA open — never blocks UI.
 * Uses React Query refetch (conditional GET) so only changed payloads download.
 */
export function scheduleBackgroundRefresh(queryClient, { isAuth } = {}) {
  if (typeof window === 'undefined') return;

  const run = () => {
    const tasks = [
      queryClient.prefetchQuery({
        queryKey: queryKeys.offersReels(DEFAULT_HOME_FEED_KEY),
        queryFn: async () => {
          const { data } = await api.get('/offers/reels', { params: { limit: 20 } });
          return data?.reels || [];
        },
        staleTime: 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.categoryTree('store'),
        queryFn: async () => {
          const { data } = await api.get('/categories/tree', { params: { type: 'store' } });
          return Array.isArray(data) ? data : [];
        },
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.storesBrowse(DEFAULT_STORES_BROWSE_KEY),
        queryFn: async () => {
          const { data: response } = await api.get('/stores/browse', { params: {} });
          return {
            groups: response.groups || [],
            parentGroups: response.parentGroups || [],
            total: response.total || 0,
            suggestion: response.suggestion || null,
          };
        },
        staleTime: 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.bazaarBrowse(DEFAULT_BAZAAR_BROWSE_KEY),
        queryFn: async () => {
          const { data } = await api.get('/bazaar', { params: {} });
          return unwrapList(data, ['listings']);
        },
        staleTime: 60 * 1000,
      }),
    ];

    if (isAuth) {
      tasks.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.userCenter,
          queryFn: async () => {
            const { data } = await api.get('/users/me/center');
            return data;
          },
          staleTime: 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.unreadNotifications,
          queryFn: async () => {
            const { data } = await api.get('/notifications/unread-count');
            return data?.count ?? 0;
          },
          staleTime: 30 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.notifications,
          queryFn: async () => {
            const { data } = await api.get('/notifications', { params: { limit: 20 } });
            return data?.notifications || [];
          },
          staleTime: 30 * 1000,
        }),
      );
    }

    Promise.allSettled(tasks).catch(() => {});
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 2500 });
  } else {
    window.setTimeout(run, 800);
  }
}
