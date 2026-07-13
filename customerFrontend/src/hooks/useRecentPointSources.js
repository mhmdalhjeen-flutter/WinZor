import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { unwrapList } from '../utils/unwrapList';
import { mergeRecentPointSources } from '../utils/pointSources';

export function useRecentPointSources(limit = 3, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['pointSources', limit],
    enabled,
    queryFn: async () => {
      const [notifRes, wheelRes] = await Promise.all([
        api.get('/notifications', { params: { limit: 40 } }),
        api.get('/wheel/my-wins').catch(() => ({ data: { wins: [] } })),
      ]);

      const notifications = notifRes.data?.notifications || [];
      const wheelWins = unwrapList(wheelRes.data, ['wins']);

      return mergeRecentPointSources(notifications, wheelWins, limit);
    },
    staleTime: 60 * 1000,
  });
}
