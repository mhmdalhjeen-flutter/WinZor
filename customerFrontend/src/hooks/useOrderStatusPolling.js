import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { queryKeys } from '../lib/queryClient';

/** Poll order queries while the user is on order screens — prep for future push/websocket. */
export function useOrderStatusPolling(enabled = true, intervalMs = 45000) {
  const { isAuth } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuth || !enabled) return undefined;

    const tick = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myOrders });
      queryClient.invalidateQueries({ queryKey: queryKeys.myOrderHistory });
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail'] });
    };

    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [isAuth, enabled, intervalMs, queryClient]);
}
