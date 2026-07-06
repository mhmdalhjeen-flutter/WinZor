import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';

/** شجرة المناطق من لوحة الأدمن — مصدر واحد للبحث السريع */
export function useRegionTree() {
  return useQuery({
    queryKey: queryKeys.regionTree,
    queryFn: async () => {
      const { data } = await api.get('/regions', { params: { tree: 'true' } });
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
