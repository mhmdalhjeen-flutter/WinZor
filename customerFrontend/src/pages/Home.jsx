import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Sparkles } from 'lucide-react';
import { useInfiniteQuery, useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../api/axios';
import CategoryFilter from '../components/CategoryFilter';
import QuickSearchPanel from '../components/QuickSearchPanel';
import MarketplaceOfferCard from '../components/marketplace/MarketplaceOfferCard';
import CategoryReels from '../components/marketplace/CategoryReels';
import OfferReelViewer from '../components/marketplace/OfferReelViewer';
import { useCategoryTree } from '../hooks/useCategories';
import { useRegionTree } from '../hooks/useRegionTree';
import { toggleFavorite } from '../utils/activity';
import { getEffectiveRegionId, pathStillValid } from '../utils/regionTree';
import { queryClient, queryKeys } from '../lib/queryClient';
import LightLoadingHint from '../shared/LightLoadingHint';

const CompetitionCard = lazy(() => import('../components/CompetitionCard'));

const PAGE_SIZE = 12;

async function fetchFavoritesPayload() {
  const { data } = await api.get('/activity/favorites');
  return {
    favorites: data?.favorites || [],
    favoriteIds: (data?.favoriteIds || []).map(String),
  };
}

const Home = () => {
  const [categoryPath, setCategoryPath] = useState([]);
  const [regionPath, setRegionPath] = useState([]);
  const [favoriteIdsOverride, setFavoriteIdsOverride] = useState(null);
  const [gridViewer, setGridViewer] = useState(null);
  const sentinelRef = useRef(null);

  const effectiveCategoryId = categoryPath.length
    ? categoryPath[categoryPath.length - 1]
    : null;
  const selectedRegionId = getEffectiveRegionId(regionPath);
  const feedKey = { effectiveCategoryId, selectedRegionId };

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

  const { data: favoritesData } = useQuery({
    queryKey: queryKeys.favorites,
    queryFn: fetchFavoritesPayload,
    staleTime: 60 * 1000,
  });

  const favoriteIds = favoriteIdsOverride ?? new Set(favoritesData?.favoriteIds ?? []);

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
  }, [categories]);

  const {
    data: feedData,
    isLoading: loading,
    isFetchingNextPage: loadingMore,
    fetchNextPage,
    hasNextPage,
    error: feedError,
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
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const showCategoryReels = !effectiveCategoryId;

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

  const items = feedData?.pages.flatMap((p) => p.items || []) ?? [];
  const error = feedError?.response?.data?.message || (feedError ? 'تعذّر تحميل العروض' : '');

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

  const openGridViewer = (offer, index) => {
    setGridViewer({ offers: items, index });
  };

  const isLoadingOffers = showCategoryReels ? reelsLoading : loading && items.length === 0;
  const hasOffers = showCategoryReels
    ? (reelsData?.length > 0)
    : items.length > 0;

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=1000&q=80"
          className="w-full h-full object-cover"
          alt="bg"
        />
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 space-y-6 pb-20">
        <Suspense fallback={<div className="max-w-4xl mx-auto h-40 rounded-[32px] bg-white/5 border border-white/10 animate-pulse" />}>
          <CompetitionCard />
        </Suspense>

        <div className="max-w-6xl mx-auto px-4">
          <QuickSearchPanel
            variant="dark"
            regionTree={regionTree}
            regionPath={regionPath}
            onRegionPathChange={setRegionPath}
            regionsLoading={regionsLoading}
            regionsError={regionsError}
            onRegionsRetry={refetchRegions}
            showProducts={false}
          />
        </div>

        <div className="max-w-6xl mx-auto px-2 space-y-3">
          <CategoryFilter
            tree={categories}
            pathIds={categoryPath}
            onPathChange={setCategoryPath}
            loading={categoriesLoading}
            error={categoriesError}
            onRetry={refetchCategories}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 space-y-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="text-primary-light" size={20} /> العروض
          </h3>

          {error && <div className="text-center py-12 text-white/70 font-bold">{error}</div>}

          {isLoadingOffers && !error && (
            <LightLoadingHint variant="dark" label="جاري تحميل العروض..." />
          )}

          {!isLoadingOffers && !error && !hasOffers && (
            <div className="text-center py-12 text-white/50 font-bold">لا توجد عروض مطابقة حالياً</div>
          )}

          {showCategoryReels && reelsData?.length > 0 && (
            <CategoryReels
              reels={reelsData}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
            />
          )}

          {!showCategoryReels && items.length > 0 && (
            <>
              <div className="marketplace-grid">
                {items.map((offer, idx) => (
                  <MarketplaceOfferCard
                    key={offer._id}
                    offer={offer}
                    onClick={() => openGridViewer(offer, idx)}
                  />
                ))}
              </div>

              <div ref={sentinelRef} className="h-10 flex items-center justify-center">
                {loadingMore && <span className="text-white/40 text-xs font-bold">جاري التحميل...</span>}
                {!hasNextPage && (
                  <span className="text-white/30 text-xs font-bold">— انتهت العروض —</span>
                )}
              </div>
            </>
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
