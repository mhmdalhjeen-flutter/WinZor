import api from '../api/axios';
import { getStoreIdFromContainer } from './cartHelpers';

/**
 * Build the payload that will be sent to the order API once backend supports
 * delivery and payment fields. Currently only customerNotes is accepted.
 */
export function buildOrderPayload(draft) {
  const notes = [draft.customerNotes, draft.paymentNotes, draft.transferNote]
    .filter(Boolean)
    .join('\n')
    .trim();

  return {
    customerNotes: notes,
    deliveryMethod: draft.deliveryMethod,
    deliveryAddress: draft.locationDetails || '',
    locationDetails: draft.locationDetails || '',
    paymentMethod: draft.paymentMethod,
    paymentProof: draft.transferProofUrl || '',
    transferInformation: {
      senderName: draft.transferSenderName || '',
      contactNumber: draft.transferContactNumber || '',
      referenceNumber: draft.transferReferenceNumber || '',
      note: draft.transferNote || '',
    },
  };
}

export function buildVerificationEntriesFromConfirm(data, storeName) {
  const code = data?.verificationCode || data?.order?.verificationCode;
  if (!code) return [];
  return [{ code, label: storeName || data?.order?.containerName || null }];
}

export function buildVerificationEntriesFromCheckout(data, containers) {
  const storeNameById = Object.fromEntries(
    containers.map((c) => [
      getStoreIdFromContainer(c),
      c.storeName || c.store?.name || null,
    ]),
  );

  return (data?.orders || [])
    .filter((o) => o.verificationCode)
    .map((o) => ({
      code: o.verificationCode,
      label: storeNameById[String(o.store)] || null,
    }));
}

/** Submit a single-store order using the existing cart confirm API. */
export async function submitStoreOrder(storeId, draft) {
  const payload = buildOrderPayload(draft);
  const { data } = await api.post(`/cart/containers/${storeId}/confirm`, payload);
  return data;
}

/** Submit all cart containers using the existing bulk checkout API. */
export async function submitAllOrders() {
  const { data } = await api.post('/cart/checkout');
  return data;
}
