import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { queryKeys } from '../lib/queryClient';

import { readGuestCart } from '../utils/guestCartService';

export function computeCartStats(cart) {
  const containers = cart?.containers || [];
  let itemCount = 0;
  let productLines = 0;

  for (const c of containers) {
    for (const row of c.items || []) {
      productLines += 1;
      itemCount += row.quantity || 0;
    }
  }

  return {
    containers,
    storeCount: containers.length,
    itemCount,
    productLines,
    grandTotal: cart?.total ?? 0,
    isEmpty: containers.length === 0,
  };
}

export default function useCartSummary(options = {}) {
  const { enabled: enabledOption = true } = options;
  const { isAuth } = useAuth();

  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: async () => {
      if (!isAuth) return readGuestCart();
      const { data } = await api.get('/cart');
      return data;
    },
    enabled: enabledOption,
    staleTime: 10 * 1000,
    select: (data) => ({
      raw: data,
      ...computeCartStats(data),
    }),
  });
}
