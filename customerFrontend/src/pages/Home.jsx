import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Sparkles } from 'lucide-react';
import { useInfiniteQuery, useQuery, keepPreviousData } from '@tanstack/react-query';
import api from '../api/axios';
import OfferCard from '../components/OfferCard';
import CategoryFilter from '../components/CategoryFilter';
import QuickSearchPanel from '../components/QuickSearchPanel';
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

  const items = feedData?.pages.flatMap((p) => p.items || []) ?? [];
  const error = feedError?.response?.data?.message || (feedError ? 'تعذّر تحميل العروض' : '');

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasNextPage && !loadingMore) fetchNextPage(); },
      { rootMargin: '300px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, loadingMore]);

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

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=1000&q=80"
          className="w-full h-full object-cover"
          alt="bg"
        />
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 space-y-6 pb-20">
        {/* Featured Competition */}
        <Suspense fallback={<div className="max-w-4xl mx-auto h-40 rounded-[32px] bg-white/5 border border-white/10 animate-pulse" />}>
          <CompetitionCard />
        </Suspense>

        {/* فلترة العروض — مناطق + تصنيفات (بدون بحث متاجر) */}
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

        {/* Filters — تصنيفات ديناميكية من لوحة الأدمن */}
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

        {/* Offers grid + infinite scroll */}
        <div className="max-w-6xl mx-auto px-4 space-y-4">
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <Sparkles className="text-primary-light" size={20} /> العروض
          </h3>

          {error && <div className="text-center py-12 text-white/70 font-bold">{error}</div>}

          {loading && items.length === 0 && !error && (
            <LightLoadingHint variant="dark" label="جاري تحميل العروض..." />
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center py-12 text-white/50 font-bold">لا توجد عروض مطابقة حالياً</div>
          )}

          {items.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((offer) => (
                  <OfferCard
                    key={offer._id}
                    offer={offer}
                    favorited={favoriteIds.has(String(offer._id))}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>

              <div ref={sentinelRef} className="h-10 flex items-center justify-center">
                {!hasNextPage && (
                  <span className="text-white/30 text-xs font-bold">— انتهت العروض —</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
