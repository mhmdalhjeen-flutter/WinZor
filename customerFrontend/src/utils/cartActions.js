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

export async function addItemToCart({
  item, itemType, quantity = 1, purchaseMethod = 'quantity', requestedAmount, isAuth,
}) {
  const payload = {
    itemId: item._id,
    itemType: normalizeCartItemType(itemType).toLowerCase(),
    purchaseMethod,
    quantity: purchaseMethod === 'price' ? 1 : quantity,
  };
  if (purchaseMethod === 'price' && requestedAmount != null) {
    payload.requestedAmount = requestedAmount;
  }

  if (!isAuth) {
    addToGuestCart({ item, itemType, quantity: payload.quantity, purchaseMethod, requestedAmount });
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    return;
  }

  await api.post('/cart/add', payload);
  await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
}

export async function updateCartItemQty({
  itemId, itemType, quantity, purchaseMethod = 'quantity', requestedAmount, isAuth,
}) {
  if (!isAuth) {
    updateGuestCartQty({ itemId, itemType, quantity, purchaseMethod, requestedAmount });
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    return;
  }

  if (quantity <= 0 && purchaseMethod !== 'price') {
    await api.delete('/cart/remove', {
      data: { itemId, itemType: normalizeCartItemType(itemType), purchaseMethod },
    });
  } else if (purchaseMethod === 'price' && (quantity <= 0 || !requestedAmount)) {
    await api.delete('/cart/remove', {
      data: { itemId, itemType: normalizeCartItemType(itemType), purchaseMethod: 'price' },
    });
  } else {
    await api.patch('/cart/update', {
      itemId,
      itemType: normalizeCartItemType(itemType),
      quantity: purchaseMethod === 'price' ? 1 : quantity,
      purchaseMethod,
      requestedAmount,
    });
  }
  await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
}

export async function removeCartItem({ itemId, itemType, purchaseMethod = 'quantity', isAuth }) {
  if (!isAuth) {
    removeFromGuestCart({ itemId, itemType, purchaseMethod });
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    return;
  }

  await api.delete('/cart/remove', {
    data: {
      itemId,
      itemType: normalizeCartItemType(itemType),
      purchaseMethod,
    },
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
