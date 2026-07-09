import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Sparkles } from 'lucide-react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { toggleFavorite } from '../utils/activity';
import { getEffectiveRegionId, pathStillValid } from '../utils/regionTree';
import { queryClient, queryKeys } from '../lib/queryClient';
import LightLoadingHint from '../shared/LightLoadingHint';
import HomeHero from '../components/home/HomeHero';
import HomeSearchCards from '../components/home/HomeSearchCards';
import ProgressiveCategoryReels from '../components/home/ProgressiveCategoryReels';
import MarketplaceOfferCard from '../components/marketplace/MarketplaceOfferCard';
import OfferRailTrack from '../components/marketplace/OfferRailTrack';
import OfferReelViewer from '../components/marketplace/OfferReelViewer';
import { useCategoryTree } from '../hooks/useCategories';
import { useRegionTree } from '../hooks/useRegionTree';

const FeaturedCompetitions = lazy(() => import('../components/home/FeaturedCompetitions'));

const PAGE_SIZE = 12;

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
  const [gridViewer, setGridViewer] = useState(null);
  const sentinelRef = useRef(null);

  const effectiveCategoryId = categoryPath.length
    ? categoryPath[categoryPath.length - 1]
    : null;
  const selectedRegionId = getEffectiveRegionId(regionPath);
  const feedKey = { effectiveCategoryId, selectedRegionId };
  const showCategoryReels = !effectiveCategoryId;

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useCategoryTree('store');

  const {
    data: regionTree = [],
    isLoading: regionsLoading,
    isError: regionsError,
    refetch: refetchRegions,
  } = useRegionTree();

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
  });

  const favoriteIds = favoriteIdsOverride ?? new Set(favoritesData?.favoriteIds ?? []);

  const { data: reelsData, isLoading: reelsLoading } = useQuery({
    queryKey: queryKeys.offersReels(feedKey),
    queryFn: async () => {
      const params = { limit: 20 };
      if (selectedRegionId) params.region = selectedRegionId;
      const { data } = await api.get('/offers/reels', { params });
      return data?.reels || [];
    },
    enabled: showCategoryReels,
    staleTime: 60 * 1000,
  });

  const {
    data: feedData,
    isLoading: feedLoading,
    isFetchingNextPage: loadingMore,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.offersFeed(feedKey),
    queryFn: async ({ pageParam }) => {
      const params = { limit: PAGE_SIZE };
      if (effectiveCategoryId) params.category = effectiveCategoryId;
      if (selectedRegionId) params.region = selectedRegionId;
      if (pageParam) params.cursor = pageParam;
      const { data } = await api.get('/offers/feed', { params });
      return data;
    },
    getNextPageParam: (last) => last.nextCursor || undefined,
    initialPageParam: null,
    enabled: !showCategoryReels,
    staleTime: 60 * 1000,
  });

  const items = feedData?.pages.flatMap((p) => p.items || []) ?? [];

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || showCategoryReels) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasNextPage && !loadingMore) fetchNextPage(); },
      { rootMargin: '300px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, loadingMore, showCategoryReels]);

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

  const isLoadingOffers = showCategoryReels ? reelsLoading : feedLoading && items.length === 0;
  const hasOffers = showCategoryReels ? (reelsData?.length > 0) : items.length > 0;

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0 home-premium-bg" aria-hidden />

      <div className="relative z-10 space-y-4 sm:space-y-5 pb-20">
        <HomeHero />

        <Suspense fallback={
          <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="h-32 rounded-[24px] bg-white border border-gray-100 shadow-sm animate-pulse" />
            <div className="h-32 rounded-[24px] bg-white border border-gray-100 shadow-sm animate-pulse hidden md:block" />
          </div>
        }>
          <FeaturedCompetitions />
        </Suspense>

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

        <div id="home-offers" className="max-w-6xl mx-auto space-y-3 sm:space-y-4 scroll-mt-4">
          <h3 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 px-3 sm:px-4">
            <Sparkles className="text-primary w-4 h-4 sm:w-[18px] sm:h-[18px]" /> العروض
          </h3>

          {isLoadingOffers && (
            <LightLoadingHint variant="light" label="جاري تحميل العروض..." />
          )}

          {!isLoadingOffers && !hasOffers && (
            <div className="text-center py-12 text-gray-400 font-bold">لا توجد عروض مطابقة حالياً</div>
          )}

          {showCategoryReels && hasOffers && (
            <ProgressiveCategoryReels
              reels={reelsData}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {!showCategoryReels && items.length > 0 && (
            <div className="home-progressive-reels">
              <OfferRailTrack>
                {items.map((offer, idx) => (
                  <div key={offer._id} className="home-offers-rail__slide">
                    <MarketplaceOfferCard
                      offer={offer}
                      onClick={() => setGridViewer({ offers: items, index: idx })}
                    />
                  </div>
                ))}
              </OfferRailTrack>
              <div ref={sentinelRef} className="h-10 flex items-center justify-center">
                {loadingMore && <span className="text-gray-400 text-xs font-bold">جاري التحميل...</span>}
                {!hasNextPage && (
                  <span className="text-gray-300 text-xs font-bold">— انتهت العروض —</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {gridViewer && (
        <OfferReelViewer
          offers={gridViewer.offers}
          initialIndex={gridViewer.index}
          onClose={() => setGridViewer(null)}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
};

export default Home;
