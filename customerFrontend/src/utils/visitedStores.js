import { parseStoredJson } from './safeStorage';

const STORAGE_KEY = 'winzor-visited-stores-v1';
const MAX_STORES = 15;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function loadAll() {
  const list = parseStoredJson(STORAGE_KEY, []);
  if (!Array.isArray(list)) return [];
  const cutoff = Date.now() - MAX_AGE_MS;
  return list
    .filter((item) => item?.id && item?.visitedAt >= cutoff)
    .slice(0, MAX_STORES);
}

function saveAll(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_STORES)));
  } catch {
    /* storage full */
  }
}

export function recordVisitedStore(id) {
  if (!id) return;
  const normalized = { id: String(id), visitedAt: Date.now() };
  const withoutDup = loadAll().filter((item) => item.id !== normalized.id);
  saveAll([normalized, ...withoutDup]);
}

export function getVisitedStoreIds() {
  return loadAll().map((item) => item.id);
}

export function pruneStaleVisitedStores() {
  saveAll(loadAll());
}
