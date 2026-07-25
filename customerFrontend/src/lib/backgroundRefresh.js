import api from '../api/axios';
import { unwrapList } from '../utils/unwrapList';
import { getFavorites } from '../utils/activity';
import { queryKeys } from './queryClient';
import {
  DEFAULT_BAZAAR_BROWSE_KEY,
  DEFAULT_HOME_FEED_KEY,
  DEFAULT_STORES_BROWSE_KEY,
} from './cacheConfig';
import { getVisitedStoreIds } from '../utils/visitedStores';
import { warmStoreDetailImages } from '../utils/cacheImages';

/** Same key shape as Cart.jsx (not yet exported on queryKeys). */
const ORDERS_MY_KEY = ['orders', 'my'];

async function fetchCompetitionsList() {
  const { data } = await api.get('/competitions');
  const list = unwrapList(data, ['competitions']);
  return list.filter((c) => c && c._id);
}

async function fetchFeaturedCompetitions() {
  const { data } = await api.get('/competitions/featured');
  const list = data.competitions || (data.competition ? [data.competition] : []);
  return list.filter((c) => c && c._id);
}

/**
 * Background refresh on PWA open — never blocks UI.
 * Uses React Query prefetch so pages hydrate from the same cache offline.
 */
export function scheduleBackgroundRefresh(queryClient, { isAuth } = {}) {
  if (typeof window === 'undefined') return;

  const run = () => {
    const tasks = [
      queryClient.prefetchQuery({
        queryKey: queryKeys.offersReels(DEFAULT_HOME_FEED_KEY),
        queryFn: async () => {
          const { data } = await api.get('/offers/reels', { params: {} });
          return data?.reels || [];
        },
        staleTime: 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.regionTree,
        queryFn: async () => {
          const { data } = await api.get('/regions', { params: { tree: 'true' } });
          return Array.isArray(data) ? data : [];
        },
        staleTime: 5 * 60 * 1000,
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
      queryClient.prefetchQuery({
        queryKey: queryKeys.competitionsList,
        queryFn: fetchCompetitionsList,
        staleTime: 30 * 60 * 1000,
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.competitionsFeatured,
        queryFn: fetchFeaturedCompetitions,
        staleTime: 30 * 60 * 1000,
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
          queryKey: queryKeys.me,
          queryFn: async () => (await api.get('/users/me')).data,
          staleTime: 5 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.favorites,
          queryFn: async () => {
            const { data: response } = await getFavorites();
            return {
              favorites: response?.favorites || [],
              favoriteIds: (response?.favoriteIds || []).map(String),
            };
          },
          staleTime: 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.bazaarFavorites,
          queryFn: async () => {
            const { data } = await api.get('/bazaar/favorites');
            return unwrapList(data, ['listings']);
          },
          staleTime: 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: ORDERS_MY_KEY,
          queryFn: async () => {
            const { data: d } = await api.get('/orders/my');
            return d.orders || [];
          },
          staleTime: 30 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.unreadChat,
          queryFn: async () => (await api.get('/chats/unread-count')).data,
          staleTime: 5 * 60 * 1000,
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

    for (const storeId of getVisitedStoreIds().slice(0, 5)) {
      tasks.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.storeDetail(storeId),
          queryFn: async () => {
            const { data } = await api.get(`/stores/${storeId}`);
            warmStoreDetailImages(data);
            return data;
          },
          staleTime: 5 * 60 * 1000,
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
