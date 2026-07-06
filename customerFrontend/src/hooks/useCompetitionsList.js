import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { unwrapList } from '../utils/unwrapList';
import { queryKeys } from '../lib/queryClient';

/** قائمة المسابقات النشطة — مصدر واحد لصفحة المسابقات ونافذة النقاط */
export function useCompetitionsList(options = {}) {
  return useQuery({
    queryKey: queryKeys.competitionsList,
    queryFn: async () => {
      const { data } = await api.get('/competitions');
      const list = unwrapList(data, ['competitions']);
      return list.filter((c) => c && c._id);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
}
