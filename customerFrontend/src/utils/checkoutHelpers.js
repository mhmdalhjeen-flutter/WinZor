import { getStoreIdFromContainer } from './cartHelpers';

export function resolveCheckoutContainers({
  cartStats,
  storeId,
  checkoutMode,
  activeStoreIds = [],
}) {
  const all = cartStats?.containers || [];
  const isAllMode = storeId === 'all' || checkoutMode === 'all';

  if (isAllMode) {
    if (activeStoreIds.length) {
      return {
        isAllMode: true,
        containers: all.filter((c) => activeStoreIds.includes(String(getStoreIdFromContainer(c)))),
      };
    }
    return { isAllMode: true, containers: all };
  }

  return {
    isAllMode: false,
    containers: all.filter((c) => String(getStoreIdFromContainer(c)) === String(storeId)),
  };
}

export function getPrimaryStoreId(containers, storeId, isAllMode) {
  if (isAllMode) {
    return String(getStoreIdFromContainer(containers[0]));
  }
  return String(storeId);
}

export function getCheckoutPaths(storeId, isAllMode) {
  const base = isAllMode ? 'all' : storeId;
  return {
    review: `/checkout/review/${base}`,
    payment: `/checkout/payment/${base}`,
    paymentDetails: `/checkout/payment/${base}/details`,
  };
}
