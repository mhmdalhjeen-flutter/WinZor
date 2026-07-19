import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { unwrapList } from '../utils/unwrapList';
import { queryClient, queryKeys } from '../lib/queryClient';
import {
  DEFAULT_BAZAAR_BROWSE_KEY,
  DEFAULT_HOME_FEED_KEY,
  DEFAULT_STORES_BROWSE_KEY,
} from '../lib/cacheConfig';
import { warmOfferReelImages, warmStoreBrowseImages } from '../utils/cacheImages';
import { BRAND_LOGO_256, BRAND_NAME } from '../utils/brandAssets';

const SPLASH_DONE_KEY = 'app-startup-splash-done';
const SLOGAN_INTERVAL_MS = 2000;
const SLOGAN_FADE_MS = 420;

const SLOGANS = [
  'تابع جميع أنواع العروض من مكان واحد',
  'اطلب نقاطك في كل عملية شراء من المتاجر المشاركة',
  'السوق العام لعرض وبيع وشراء الجديد والمستعمل والإيجارات',
];

const MIN_VISIBLE_MS = SLOGANS.length * SLOGAN_INTERVAL_MS;

function warmFromPersistedCache() {
  const reels = queryClient.getQueryData(queryKeys.offersReels(DEFAULT_HOME_FEED_KEY));
  if (Array.isArray(reels) && reels.length) warmOfferReelImages(reels);

  const stores = queryClient.getQueryData(queryKeys.storesBrowse(DEFAULT_STORES_BROWSE_KEY));
  if (stores) warmStoreBrowseImages(stores);
}

async function prefetchHomeData() {
  warmFromPersistedCache();

  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: queryKeys.offersReels(DEFAULT_HOME_FEED_KEY),
      queryFn: async () => {
        const { data } = await api.get('/offers/reels', { params: {} });
        return data?.reels || [];
      },
      staleTime: 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.regionTree,
      queryFn: async () => {
        const { data } = await api.get('/regions', { params: { tree: 'true' } });
        return Array.isArray(data) ? data : [];
      },
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.categoryTree('store'),
      queryFn: async () => {
        const { data } = await api.get('/categories/tree', { params: { type: 'store' } });
        return Array.isArray(data) ? data : [];
      },
      staleTime: 5 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.storesBrowse(DEFAULT_STORES_BROWSE_KEY),
      queryFn: async () => {
        const { data: response } = await api.get('/stores/browse', { params: {} });
        return {
          groups: response.groups || [],
          parentGroups: response.parentGroups || [],
          total: response.total || 0,
          suggestion: response.suggestion || null,
        };
      },
      staleTime: 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.bazaarBrowse(DEFAULT_BAZAAR_BROWSE_KEY),
      queryFn: async () => {
        const { data } = await api.get('/bazaar', { params: {} });
        return unwrapList(data, ['listings']);
      },
      staleTime: 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.competitionsList,
      queryFn: async () => {
        const { data } = await api.get('/competitions');
        const list = unwrapList(data, ['competitions']);
        return list.filter((c) => c && c._id);
      },
      staleTime: 30 * 60 * 1000,
    }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.competitionsFeatured,
      queryFn: async () => {
        const { data } = await api.get('/competitions/featured');
        const list = data.competitions || (data.competition ? [data.competition] : []);
        return list.filter((c) => c && c._id);
      },
      staleTime: 30 * 60 * 1000,
    }),
  ]);

  warmFromPersistedCache();
}

/**
 * Full-screen splash over the live app shell so Home can load underneath.
 * Shown once per browser tab session on authenticated Home.
 */
export default function StartupSplashGate({ active, children }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [sloganIndex, setSloganIndex] = useState(0);
  const [sloganVisible, setSloganVisible] = useState(true);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      setFading(false);
      return undefined;
    }

    if (sessionStorage.getItem(SPLASH_DONE_KEY) === '1') {
      warmFromPersistedCache();
      prefetchHomeData();
      return undefined;
    }

    setVisible(true);
    setFading(false);
    setSloganIndex(0);
    setSloganVisible(true);

    const sloganTimer = window.setInterval(() => {
      setSloganVisible(false);
      window.setTimeout(() => {
        setSloganIndex((i) => (i + 1) % SLOGANS.length);
        setSloganVisible(true);
      }, SLOGAN_FADE_MS);
    }, SLOGAN_INTERVAL_MS);

    let cancelled = false;

    (async () => {
      await Promise.all([
        new Promise((resolve) => { window.setTimeout(resolve, MIN_VISIBLE_MS); }),
        prefetchHomeData(),
      ]);

      if (cancelled) return;

      sessionStorage.setItem(SPLASH_DONE_KEY, '1');
      setFading(true);
      window.setTimeout(() => {
        if (!cancelled) setVisible(false);
      }, 420);
    })();

    return () => {
      cancelled = true;
      window.clearInterval(sloganTimer);
    };
  }, [active]);

  return (
    <>
      {children}
      {visible && (
        <div
          className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white transition-opacity duration-[420ms] ease-out ${
            fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          dir="rtl"
          aria-hidden={fading}
        >
          <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-primary/5" aria-hidden />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-blue-500/5" aria-hidden />

          <div className="relative z-10 flex flex-col items-center px-8 text-center">
            <div className="mb-7 flex h-28 w-28 items-center justify-center rounded-[28px] bg-white p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
              <img
                src={BRAND_LOGO_256}
                alt=""
                className="h-full w-full object-contain"
                width={112}
                height={112}
                loading="eager"
                fetchpriority="high"
                decoding="async"
              />
            </div>

            <h1 className="text-[28px] font-black tracking-wide text-gray-900 leading-tight">
              {BRAND_NAME}
            </h1>

            <div className="mt-5 h-14 flex items-center justify-center px-2">
              <p
                className={`max-w-sm text-[15px] font-extrabold leading-snug text-gray-600 transition-all duration-[420ms] ease-out ${
                  sloganVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              >
                {SLOGANS[sloganIndex]}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
