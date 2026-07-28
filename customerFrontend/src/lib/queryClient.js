import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'offlineFirst',
      retry: 1,
    },
  },
});

export const queryKeys = {
  categoryTree: (type = 'store') => ['categories', 'tree', type],
  regionTree: ['regions', 'tree'],
  offersFeed: (params) => ['offersFeed', params],
  offersReels: (params) => ['offersReels', params],
  recommendations: ['recommendations'],
  favorites: ['favorites'],
  cart: ['cart'],
  myOrders: ['orders', 'my'],
  myOrderHistory: ['orders', 'my', 'history'],
  honor: ['honor'],
  competitionsList: ['competitions', 'list'],
  competitionsFeatured: ['competitions', 'featured'],
  competitions: ['competitions'],
  competition: (id) => ['competition', id],
  chats: ['chats'],
  unreadChat: ['unreadChat'],
  me: ['me'],
  userCenter: ['users', 'center'],
  notifications: ['notifications'],
  unreadNotifications: ['unreadNotifications'],
  platformSettings: ['platformSettings'],
  bazaarBrowse: (params) => ['bazaar', 'browse', params],
  bazaarDetail: (id) => ['bazaar', 'detail', id],
  bazaarFavorites: ['bazaar', 'favorites'],
  storesBrowse: (params) => ['stores', 'browse', params],
  storeDetail: (id) => ['stores', 'detail', id],
  storesByRegions: (params) => ['stores', 'byRegions', params],
  pointsProgramStores: (params) => ['stores', 'points', params],
  pointsLeaderboard: ['pointsLeaderboard'],
};
