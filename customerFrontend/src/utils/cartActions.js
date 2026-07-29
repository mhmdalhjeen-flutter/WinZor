import api from '../api/axios';
import { queryClient, queryKeys } from '../lib/queryClient';
import { normalizeCartItemType, cartItemMatches } from './cartHelpers';
import {
  addToGuestCart,
  updateGuestCartQty,
  removeFromGuestCart,
  readGuestCart,
  clearGuestCart,
} from './guestCartService';

export async function addItemToCart({ item, itemType, quantity = 1, isAuth }) {
  if (!isAuth) {
    addToGuestCart({ item, itemType, quantity });
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    return;
  }

  await api.post('/cart/add', {
    itemId: item._id,
    itemType: normalizeCartItemType(itemType).toLowerCase(),
    quantity,
  });
  await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
}

export async function updateCartItemQty({ itemId, itemType, quantity, isAuth }) {
  if (!isAuth) {
    updateGuestCartQty({ itemId, itemType, quantity });
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    return;
  }

  if (quantity <= 0) {
    await api.delete('/cart/remove', {
      data: { itemId, itemType: normalizeCartItemType(itemType) },
    });
  } else {
    await api.patch('/cart/update', {
      itemId,
      itemType: normalizeCartItemType(itemType),
      quantity,
    });
  }
  await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
}

export async function removeCartItem({ itemId, itemType, isAuth }) {
  if (!isAuth) {
    removeFromGuestCart({ itemId, itemType });
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    return;
  }

  await api.delete('/cart/remove', {
    data: { itemId, itemType: normalizeCartItemType(itemType) },
  });
  await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
}

export async function mergeGuestCartToServer() {
  const cart = readGuestCart();
  const containers = cart.containers || [];
  if (!containers.length) return;

  for (const container of containers) {
    for (const row of container.items || []) {
      const itemId = row.item?._id || row.item?.id;
      if (!itemId) continue;
      const itemType = normalizeCartItemType(row.itemType).toLowerCase();
      const quantity = row.quantity || 1;
      try {
        const { data: serverCart } = await api.get('/cart');
        const flatItems = (serverCart?.containers || []).flatMap((c) => c.items || []);
        const existing = flatItems.find((r) => cartItemMatches(r, itemId, itemType));
        if (existing) {
          await api.patch('/cart/update', {
            itemId,
            itemType: normalizeCartItemType(itemType),
            quantity: Math.min(99, (existing.quantity || 0) + quantity),
          });
        } else {
          await api.post('/cart/add', { itemId, itemType, quantity });
        }
      } catch {
        /* keep merging remaining items */
      }
    }
  }

  clearGuestCart();
  await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
}
