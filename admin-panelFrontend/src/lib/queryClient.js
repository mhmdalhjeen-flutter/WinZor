import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const queryKeys = {
  dashboard: (days = 30) => ['admin', 'dashboard', days],
  adminStores: ['admin', 'stores'],
  adminUsers: (params) => ['admin', 'users', params],
  adminUserDetail: (id) => ['admin', 'users', 'detail', id],
  adminCompetitions: ['admin', 'competitions'],
  adminCategories: ['admin', 'categories'],
  displayPriorityMain: ['admin', 'display-priority', 'main'],
  displayPrioritySecond: (parentId) => ['admin', 'display-priority', 'second', parentId],
  displayPriorityStores: (categoryId) => ['admin', 'display-priority', 'stores', categoryId],
  displayPriorityCatalog: (storeId) => ['admin', 'display-priority', 'catalog', storeId],
  adminActivity: (params) => ['admin', 'activity', params],
};
