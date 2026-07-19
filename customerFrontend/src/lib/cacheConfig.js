import { getRecentlyViewedIds } from '../utils/recentlyViewed';

/** Smart PWA cache limits — tuned for weak connections and limited storage. */

export const CACHE_STORAGE_KEY = 'winzor-rq-cache-v1';

/** Max age for persisted React Query entries (7 days). */
export const PERSIST_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Default home feed key used for prefetch and background refresh. */
export const DEFAULT_HOME_FEED_KEY = {
  effectiveCategoryId: null,
  selectedRegionId: null,
};

/** Default explore stores browse key (featured / unfiltered stores). */
export const DEFAULT_STORES_BROWSE_KEY = {
  debouncedQ: '',
  regionId: null,
  categoryId: null,
};

/** Default marketplace browse key. */
export const DEFAULT_BAZAAR_BROWSE_KEY = {
  filterRegionId: null,
  filterCondition: '',
  filterCategory: '',
};

export const CACHE_LIMITS = {
  offersReels: { maxItems: 20, maxAgeMs: 24 * 60 * 60 * 1000 },
  bazaarBrowse: { maxItems: 30, maxAgeMs: 12 * 60 * 60 * 1000 },
  bazaarDetail: { maxItems: 12, maxAgeMs: 7 * 24 * 60 * 60 * 1000 },
  storesBrowse: { maxItems: 40, maxAgeMs: 24 * 60 * 60 * 1000 },
  recentlyViewed: { maxItems: 12, maxAgeMs: 7 * 24 * 60 * 60 * 1000 },
  categories: { maxAgeMs: 7 * 24 * 60 * 60 * 1000 },
  regions: { maxAgeMs: 7 * 24 * 60 * 60 * 1000 },
  userCenter: { maxAgeMs: 6 * 60 * 60 * 1000 },
  favorites: { maxAgeMs: 2 * 60 * 60 * 1000 },
  notifications: { maxItems: 20, maxAgeMs: 60 * 60 * 1000 },
  competitions: { maxItems: 20, maxAgeMs: 7 * 24 * 60 * 60 * 1000 },
};

/** Notification types worth surfacing immediately (no bulk offer preload). */
export const IMPORTANT_NOTIFICATION_TYPES = new Set([
  'store_new_offer',
  'followed_store_offer',
  'new_offer',
  'chat_message',
  'message',
  'order',
  'order_point_gift',
  'order_status',
  'competition_draw',
  'competition_win',
  'reward',
  'referral_batch',
  'prize',
  'membership_approved',
]);

const PERSIST_ROOTS = new Set([
  'categories',
  'regions',
  'offersReels',
  'bazaar',
  'stores',
  'users',
  'favorites',
  'notifications',
  'unreadNotifications',
  'competitions',
]);

function isDefaultObjectKey(obj, defaults) {
  if (!obj || typeof obj !== 'object') return false;
  return Object.keys(defaults).every((k) => {
    const left = obj[k];
    const right = defaults[k];
    if (left == null && right == null) return true;
    return String(left ?? '') === String(right ?? '');
  });
}

/**
 * Only persist read-heavy queries with bounded scope.
 * Avoids caching every search permutation or filtered browse state.
 */
export function shouldPersistQuery(query) {
  const key = query.queryKey;
  if (!Array.isArray(key) || key.length === 0) return false;
  const root = key[0];
  if (!PERSIST_ROOTS.has(root)) return false;

  if (root === 'offersReels') {
    return isDefaultObjectKey(key[1], DEFAULT_HOME_FEED_KEY);
  }

  if (root === 'stores') {
    if (key[1] === 'browse') {
      return isDefaultObjectKey(key[2], DEFAULT_STORES_BROWSE_KEY);
    }
    return false;
  }

  if (root === 'bazaar') {
    if (key[1] === 'browse') {
      return isDefaultObjectKey(key[2], DEFAULT_BAZAAR_BROWSE_KEY);
    }
    if (key[1] === 'detail') {
      const detailId = String(key[2] || '');
      return detailId.length > 0 && getRecentlyViewedIds('bazaar').includes(detailId);
    }
    if (key[1] === 'favorites') return true;
    return false;
  }

  if (root === 'categories' && key[1] === 'tree') {
    return key[2] === 'store' || key[2] === 'product';
  }

  if (root === 'regions' && key[1] === 'tree') return true;

  if (root === 'users' && key[1] === 'center') return true;

  if (root === 'favorites') return true;

  if (root === 'notifications' || root === 'unreadNotifications') return true;

  if (root === 'competitions' && (key[1] === 'list' || key[1] === 'featured')) return true;

  return false;
}

/** Trim large payloads before writing to IndexedDB. */
export function trimDehydratedState(dehydratedState) {
  if (!dehydratedState?.queries) return dehydratedState;

  const queries = dehydratedState.queries.map((entry) => {
    const key = entry.queryKey;
    const root = key?.[0];

    if (root === 'offersReels' && Array.isArray(entry.state?.data)) {
      return {
        ...entry,
        state: {
          ...entry.state,
          data: entry.state.data.slice(0, CACHE_LIMITS.offersReels.maxItems),
        },
      };
    }

    if (root === 'bazaar' && key[1] === 'browse' && Array.isArray(entry.state?.data)) {
      return {
        ...entry,
        state: {
          ...entry.state,
          data: entry.state.data.slice(0, CACHE_LIMITS.bazaarBrowse.maxItems),
        },
      };
    }

    if (root === 'stores' && key[1] === 'browse' && entry.state?.data?.parentGroups) {
      const groups = entry.state.data.parentGroups.slice(0, 6).map((group) => ({
        ...group,
        sections: (group.sections || []).slice(0, 4).map((section) => ({
          ...section,
          stores: (section.stores || []).slice(0, CACHE_LIMITS.storesBrowse.maxItems),
        })),
      }));
      return {
        ...entry,
        state: {
          ...entry.state,
          data: {
            ...entry.state.data,
            parentGroups: groups,
            groups: groups,
            total: entry.state.data.total,
          },
        },
      };
    }

    if (root === 'notifications' && Array.isArray(entry.state?.data)) {
      return {
        ...entry,
        state: {
          ...entry.state,
          data: entry.state.data.slice(0, CACHE_LIMITS.notifications.maxItems),
        },
      };
    }

    if (root === 'competitions' && Array.isArray(entry.state?.data)) {
      return {
        ...entry,
        state: {
          ...entry.state,
          data: entry.state.data.slice(0, CACHE_LIMITS.competitions.maxItems),
        },
      };
    }

    return entry;
  });

  return { ...dehydratedState, queries };
}
