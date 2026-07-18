import { parseStoredJson } from './safeStorage';

const STORAGE_KEY = 'winzor-recently-viewed-v1';
const MAX_ITEMS = 12;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function loadAll() {
  const list = parseStoredJson(STORAGE_KEY, []);
  if (!Array.isArray(list)) return [];
  const cutoff = Date.now() - MAX_AGE_MS;
  return list
    .filter((item) => item?.id && item?.viewedAt >= cutoff)
    .slice(0, MAX_ITEMS);
}

function saveAll(list) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list.slice(0, MAX_ITEMS)),
    );
  } catch {
    /* storage full — ignore */
  }
}

/**
 * @param {{ type: 'bazaar'|'offer'|'product', id: string, title?: string, image?: string, price?: string }} entry
 */
export function recordRecentlyViewed(entry) {
  if (!entry?.id || !entry?.type) return;
  const normalized = {
    type: entry.type,
    id: String(entry.id),
    title: entry.title || '',
    image: entry.image || '',
    price: entry.price || '',
    viewedAt: Date.now(),
  };

  const withoutDup = loadAll().filter(
    (item) => !(item.type === normalized.type && item.id === normalized.id),
  );
  saveAll([normalized, ...withoutDup]);
}

export function getRecentlyViewed(type = null) {
  const list = loadAll();
  if (!type) return list;
  return list.filter((item) => item.type === type);
}

export function getRecentlyViewedIds(type) {
  return getRecentlyViewed(type).map((item) => item.id);
}

export function pruneStaleRecentlyViewed() {
  saveAll(loadAll());
}
