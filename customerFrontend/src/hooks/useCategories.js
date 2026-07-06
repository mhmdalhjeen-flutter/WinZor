import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';

/**
 * تصنيفات من لوحة الأدmin — مصدر واحد لكل الفلاتر والبحث.
 * @param {'store'|'product'} type
 */
export function useCategoryTree(type = 'store') {
  return useQuery({
    queryKey: queryKeys.categoryTree(type),
    queryFn: async () => {
      const { data } = await api.get('/categories/tree', { params: { type } });
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
