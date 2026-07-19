import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';

/** Featured competitions — cached like other long-lived catalog data. */
export function useFeaturedCompetitions(options = {}) {
  return useQuery({
    queryKey: queryKeys.competitionsFeatured,
    queryFn: async () => {
      const { data } = await api.get('/competitions/featured');
      const list = data.competitions || (data.competition ? [data.competition] : []);
      return list.filter((c) => c && c._id);
    },
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...options,
  });
}
