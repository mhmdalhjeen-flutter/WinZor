import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { toggleFavorite } from '../utils/activity';
import { getEffectiveRegionId, pathStillValid } from '../utils/regionTree';
import { queryClient, queryKeys } from '../lib/queryClient';
import LightLoadingHint from '../shared/LightLoadingHint';
import HomeHero from '../components/home/HomeHero';
import ProgressiveCategoryReels from '../components/home/ProgressiveCategoryReels';
import DeferredMount from '../components/DeferredMount';
import { useCategoryTree } from '../hooks/useCategories';
import { useRegionTree } from '../hooks/useRegionTree';
import { normalizeCategoryReels, buildCategoryMaps } from '../utils/categoryDisplay';

const FeaturedCompetitions = lazy(() => import('../components/home/FeaturedCompetitions'));
const HomeSearchCards = lazy(() => import('../components/home/HomeSearchCards'));

async function fetchFavoritesPayload() {
  const { data } = await api.get('/activity/favorites');
  return {
    favorites: data?.favorites || [],
    favoriteIds: (data?.favoriteIds || []).map(String),
  };
}

const Home = () => {
  const [regionPath, setRegionPath] = useState([]);
  const [categoryPath, setCategoryPath] = useState([]);
  const [favoriteIdsOverride, setFavoriteIdsOverride] = useState(null);
  const [deferSecondary, setDeferSecondary] = useState(false);

  // Let first paint + LCP image compete without search/categories network contention
  useEffect(() => {
    let idleId;
    let timeoutId;
    const enable = () => setDeferSecondary(true);
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(enable, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(enable, 400);
    }
    return () => {
      if (idleId != null && window.cancelIdleCallback) window.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  const effectiveCategoryId = categoryPath.length
    ? categoryPath[categoryPath.length - 1]
    : null;
  const selectedRegionId = getEffectiveRegionId(regionPath);
  const feedKey = { effectiveCategoryId, selectedRegionId };

  function reelMatchesCategory(reel, categoryId, maps) {
    if (!reel || !categoryId) return false;
    if (String(reel.categoryId) === String(categoryId)) return true;
    if (String(reel.parentCategoryId) === String(categoryId)) return true;

    const { byId } = maps;
    let node = byId.get(String(reel.categoryId));
    while (node) {
      if (String(node._id) === String(categoryId)) return true;
      const parentId = node.parent || node.parentId;
      if (!parentId) break;
      node = byId.get(String(parentId));
    }
    return false;
  }

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useCategoryTree('store', { enabled: deferSecondary });

  const {
    data: regionTree = [],
    isLoading: regionsLoading,
    isError: regionsError,
    refetch: refetchRegions,
  } = useRegionTree({ enabled: deferSecondary });

  useEffect(() => {
    if (!regionPath.length || !regionTree.length) return;
    if (!pathStillValid(regionTree, regionPath)) setRegionPath([]);
  }, [regionTree, regionPath]);

  useEffect(() => {
    if (!categoryPath.length || !categories.length) return;
    const last = categoryPath[categoryPath.length - 1];
    const exists = (nodes) => {
      for (const n of nodes || []) {
        if (String(n._id) === String(last)) return true;
        if (exists(n.children)) return true;
      }
      return false;
    };
    if (!exists(categories)) setCategoryPath([]);
  }, [categories, categoryPath]);

  const { data: favoritesData } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: fetchFavoritesPayload,
    staleTime: 60 * 1000,
    enabled: deferSecondary,
  });

  const favoriteIds = favoriteIdsOverride ?? new Set(favoritesData?.favoriteIds ?? []);

  const { data: reelsData, isLoading: reelsLoading } = useQuery({
    queryKey: queryKeys.offersReels(feedKey),
    queryFn: async () => {
      // First batch only — ProgressiveCategoryReels reveals more as user scrolls
      const params = { limit: 8 };
      if (selectedRegionId) params.region = selectedRegionId;
      const { data } = await api.get('/offers/reels', { params });
      return data?.reels || [];
    },
    enabled: true,
    staleTime: 60 * 1000,
  });

  const normalizedReels = useMemo(
    () => normalizeCategoryReels(reelsData || [], categories),
    [reelsData, categories]
  );

  const displayReels = useMemo(() => {
    if (!effectiveCategoryId) return normalizedReels;
    const maps = buildCategoryMaps(categories);
    return normalizedReels.filter((reel) => reelMatchesCategory(reel, effectiveCategoryId, maps));
  }, [normalizedReels, effectiveCategoryId, categories]);

  const handleToggleFavorite = async (offer) => {
    const id = String(offer._id);
    setFavoriteIdsOverride((prev) => {
      const base = prev ?? new Set(favoritesData?.favoriteIds ?? []);
      const next = new Set(base);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      await toggleFavorite(offer._id);
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites });
    } catch {
      setFavoriteIdsOverride(null);
    }
  };

  const isLoadingOffers = reelsLoading;
  const hasOffers = displayReels?.length > 0;
  const hasActiveFilters = regionPath.length > 0 || categoryPath.length > 0;

  const resetFilters = () => {
    setRegionPath([]);
    setCategoryPath([]);
  };

  const searchPlaceholder = (
    <div className="max-w-6xl mx-auto px-1.5 sm:px-2 h-14 rounded-2xl bg-white/70 border border-gray-100 animate-pulse" />
  );

  const competitionsPlaceholder = (
    <div className="max-w-6xl mx-auto px-1.5 sm:px-2 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="h-32 rounded-[24px] bg-white border border-gray-100 shadow-sm animate-pulse" />
      <div className="h-32 rounded-[24px] bg-white border border-gray-100 shadow-sm animate-pulse hidden md:block" />
    </div>
  );

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0 home-premium-bg" aria-hidden />

      <div className="relative z-10 space-y-4 sm:space-y-5 pb-20">
        <HomeHero />

        <div id="home-offers" className="max-w-6xl mx-auto space-y-3 sm:space-y-4 scroll-mt-4">
          <div className="flex items-center justify-between gap-2 px-1.5 sm:px-2">
            <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
              <Sparkles className="text-primary w-4 h-4 sm:w-[18px] sm:h-[18px]" /> العروض
            </h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold text-violet-600 bg-violet-50 border border-violet-100 active:scale-[0.98] transition-transform"
              >
                إلغاء التصفية
              </button>
            )}
          </div>

          {isLoadingOffers && (
            <LightLoadingHint variant="light" label="جاري تحميل العروض..." />
          )}

          {!isLoadingOffers && !hasOffers && (
            <div className="text-center py-12 text-gray-400 font-bold">لا توجد عروض مطابقة حالياً</div>
          )}

          {hasOffers && (
            <ProgressiveCategoryReels
              reels={displayReels}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        </div>

        {/* Filters / search — deferred so they don't compete with LCP offer image */}
        <Suspense fallback={searchPlaceholder}>
          {deferSecondary ? (
            <HomeSearchCards
              regionTree={regionTree}
              regionPath={regionPath}
              onRegionPathChange={setRegionPath}
              regionsLoading={regionsLoading}
              regionsError={regionsError}
              onRegionsRetry={refetchRegions}
              categoryTree={categories}
              categoryPath={categoryPath}
              onCategoryPathChange={setCategoryPath}
              categoriesLoading={categoriesLoading}
              categoriesError={categoriesError}
              onCategoriesRetry={refetchCategories}
            />
          ) : (
            searchPlaceholder
          )}
        </Suspense>

        {/* Competitions / rewards teasers — below fold */}
        <DeferredMount rootMargin="200px" placeholder={competitionsPlaceholder}>
          <Suspense fallback={competitionsPlaceholder}>
            <FeaturedCompetitions />
          </Suspense>
        </DeferredMount>
      </div>
    </div>
  );
};

export default Home;
