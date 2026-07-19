import { ENTER_CARD_EVENT } from './pointsGuideEvents';

export const GIFT_QUERY_PARAM = 'gift';
export const PENDING_GIFT_CODE_KEY = 'win_golden_pending_gift_code';
export const GIFT_FLOW_ACTIVE_KEY = 'win_golden_gift_flow_active';
export const GIFT_POST_FLOW_KEY = 'win_golden_gift_post_flow';
export const STORE_NOTIFY_OPTOUT_KEY = 'win_golden_store_notify_optout';

export const OPEN_GIFT_ACTIVATION_EVENT = 'gift-activation-open';
export const GIFT_POST_FLOW_EVENT = 'gift-activation-post-flow';

const PROMO_CODE_RE = /^[A-Z0-9]{2,12}-[A-Z0-9]{4,12}$/;

export function parseGiftCodeFromPayload(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const fromGift = url.searchParams.get(GIFT_QUERY_PARAM);
      if (fromGift) return normalizeGiftCode(fromGift);
      const parts = url.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && PROMO_CODE_RE.test(normalizeGiftCode(last))) return normalizeGiftCode(last);
    } catch {
      /* ignore malformed URL */
    }
  }

  return normalizeGiftCode(value);
}

export function normalizeGiftCode(code) {
  return String(code || '').trim().toUpperCase();
}

export function isLikelyGiftCode(code) {
  return PROMO_CODE_RE.test(normalizeGiftCode(code));
}

export function setPendingGiftCode(code) {
  const normalized = normalizeGiftCode(code);
  if (!normalized) return;
  try {
    sessionStorage.setItem(PENDING_GIFT_CODE_KEY, normalized);
    sessionStorage.setItem(GIFT_FLOW_ACTIVE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function peekPendingGiftCode() {
  try {
    return sessionStorage.getItem(PENDING_GIFT_CODE_KEY) || '';
  } catch {
    return '';
  }
}

export function consumePendingGiftCode() {
  const code = peekPendingGiftCode();
  try {
    sessionStorage.removeItem(PENDING_GIFT_CODE_KEY);
  } catch {
    /* ignore */
  }
  return code;
}

export function isGiftActivationFlowActive() {
  try {
    return sessionStorage.getItem(GIFT_FLOW_ACTIVE_KEY) === '1';
  } catch {
    return false;
  }
}

export function clearGiftActivationFlow() {
  try {
    sessionStorage.removeItem(GIFT_FLOW_ACTIVE_KEY);
    sessionStorage.removeItem(PENDING_GIFT_CODE_KEY);
  } catch {
    /* ignore */
  }
}

export function markGiftPostFlowPending() {
  try {
    sessionStorage.setItem(GIFT_POST_FLOW_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function consumeGiftPostFlowPending() {
  try {
    const pending = sessionStorage.getItem(GIFT_POST_FLOW_KEY) === '1';
    sessionStorage.removeItem(GIFT_POST_FLOW_KEY);
    return pending;
  } catch {
    return false;
  }
}

export function readStoreNotifyOptOutSet() {
  try {
    const raw = localStorage.getItem(STORE_NOTIFY_OPTOUT_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.map(String) : []);
  } catch {
    return new Set();
  }
}

export function writeStoreNotifyOptOutSet(set) {
  try {
    localStorage.setItem(STORE_NOTIFY_OPTOUT_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

export function isStoreNotifyOptedOut(storeId) {
  if (!storeId) return false;
  return readStoreNotifyOptOutSet().has(String(storeId));
}

export function markStoreNotifyOptOut(storeId) {
  const set = readStoreNotifyOptOutSet();
  set.add(String(storeId));
  writeStoreNotifyOptOutSet(set);
}

export function clearStoreNotifyOptOut(storeId) {
  const set = readStoreNotifyOptOutSet();
  set.delete(String(storeId));
  writeStoreNotifyOptOutSet(set);
}

export function dispatchGiftActivationOpen(code, { giftFlow = true } = {}) {
  const normalized = normalizeGiftCode(code);
  if (!normalized) return;
  if (giftFlow) setPendingGiftCode(normalized);
  window.dispatchEvent(new CustomEvent(OPEN_GIFT_ACTIVATION_EVENT, {
    detail: { code: normalized, giftFlow },
  }));
}

export function openGiftActivation(navigate, isAuth, code) {
  const normalized = normalizeGiftCode(code);
  if (!normalized) return;

  if (!isAuth) {
    setPendingGiftCode(normalized);
    navigate('/login', { replace: true });
    return;
  }

  navigate('/', { replace: true });
  window.setTimeout(() => {
    dispatchGiftActivationOpen(normalized, { giftFlow: true });
  }, 450);
}

/** After login/register — resume gift activation if a code was pending. */
export function completePendingGiftActivation(navigate) {
  const code = consumePendingGiftCode();
  if (!code) return false;

  try {
    sessionStorage.setItem(GIFT_FLOW_ACTIVE_KEY, '1');
  } catch {
    /* ignore */
  }

  navigate('/', { replace: true });
  window.setTimeout(() => {
    dispatchGiftActivationOpen(code, { giftFlow: true });
  }, 650);
  return true;
}

export function dispatchEnterCardFromGuide() {
  window.dispatchEvent(new CustomEvent(ENTER_CARD_EVENT));
}
