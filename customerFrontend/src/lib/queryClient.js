import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,       // بيانات طازجة لدقيقة
      gcTime: 10 * 60 * 1000,   // تبقى في الذاكرة 10 دقائق
      refetchOnWindowFocus: false,
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
  honor: ['honor'],
  competitionsList: ['competitions', 'list'],
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
  storesByRegions: (params) => ['stores', 'byRegions', params],
};
