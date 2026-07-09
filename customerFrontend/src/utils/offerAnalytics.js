import api from '../api/axios';
import { getClientId } from './clientId';

const viewedSession = new Set();

export async function recordOfferView(offerId) {
  const key = String(offerId);
  if (viewedSession.has(key)) return null;

  try {
    const { data } = await api.post(
      `/offers/${offerId}/view`,
      { clientId: getClientId() },
      { headers: { 'X-Client-Id': getClientId() } }
    );
    viewedSession.add(key);
    return data;
  } catch {
    return null;
  }
}

export async function recordOfferShare(offerId) {
  try {
    const { data } = await api.post(`/offers/${offerId}/share`);
    return data;
  } catch {
    return null;
  }
}
