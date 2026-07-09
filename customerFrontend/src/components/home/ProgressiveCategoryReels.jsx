import React, { useCallback, useEffect, useRef, useState } from 'react';
import CategoryCarousel, { buildMultiCategoryViewerState } from '../marketplace/CategoryCarousel';
import OfferReelViewer from '../marketplace/OfferReelViewer';

const INITIAL_OFFERS = 3;
const OFFERS_BATCH = 4;

export default function ProgressiveCategoryReels({
  reels = [],
  favoriteIds = new Set(),
  onToggleFavorite,
}) {
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(1);
  const [visibleOffersByCategory, setVisibleOffersByCategory] = useState({ 0: INITIAL_OFFERS });
  const [viewer, setViewer] = useState(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCategoryCount(1);
    setVisibleOffersByCategory({ 0: INITIAL_OFFERS });
  }, [reels]);

  const revealMore = useCallback(() => {
    if (!reels.length) return;

    const lastIdx = visibleCategoryCount - 1;
    const lastReel = reels[lastIdx];
    const totalOffers = lastReel?.offers?.length || 0;
    const currentlyVisible = visibleOffersByCategory[lastIdx] ?? INITIAL_OFFERS;

    if (currentlyVisible < totalOffers) {
      setVisibleOffersByCategory((prev) => ({
        ...prev,
        [lastIdx]: Math.min(currentlyVisible + OFFERS_BATCH, totalOffers),
      }));
      return;
    }

    if (visibleCategoryCount < reels.length) {
      const nextIdx = visibleCategoryCount;
      setVisibleCategoryCount((n) => n + 1);
      setVisibleOffersByCategory((prev) => ({
        ...prev,
        [nextIdx]: INITIAL_OFFERS,
      }));
    }
  }, [reels, visibleCategoryCount, visibleOffersByCategory]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !reels.length) return;

    const lastIdx = visibleCategoryCount - 1;
    const lastReel = reels[lastIdx];
    const totalOffers = lastReel?.offers?.length || 0;
    const currentlyVisible = visibleOffersByCategory[lastIdx] ?? INITIAL_OFFERS;
    const hasMoreInCategory = currentlyVisible < totalOffers;
    const hasMoreCategories = visibleCategoryCount < reels.length;

    if (!hasMoreInCategory && !hasMoreCategories) return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) revealMore();
      },
      { rootMargin: '200px' }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [reels, visibleCategoryCount, visibleOffersByCategory, revealMore]);

  const visibleReels = reels.slice(0, visibleCategoryCount).map((reel, idx) => {
    const limit = visibleOffersByCategory[idx] ?? INITIAL_OFFERS;
    return {
      ...reel,
      offers: (reel.offers || []).slice(0, limit),
    };
  });

  const openViewer = (reel, offerIndex) => {
    const reelIndex = reels.findIndex(
      (r) => (r.categoryId || r.categoryName) === (reel.categoryId || reel.categoryName)
    );
    const { offers, boundaries, initialIndex } = buildMultiCategoryViewerState(
      reels,
      Math.max(reelIndex, 0),
      offerIndex
    );
    setViewer({ offers, boundaries, initialIndex, multiCategory: true });
  };

  const lastIdx = visibleCategoryCount - 1;
  const lastReel = reels[lastIdx];
  const totalOffers = lastReel?.offers?.length || 0;
  const currentlyVisible = visibleOffersByCategory[lastIdx] ?? INITIAL_OFFERS;
  const hasMore =
    currentlyVisible < totalOffers || visibleCategoryCount < reels.length;

  return (
    <>
      <div className="category-reels home-progressive-reels space-y-6">
        {visibleReels.map((reel) => (
          <CategoryCarousel
            key={reel.categoryId || reel.categoryName}
            reel={reel}
            onOfferClick={openViewer}
          />
        ))}
      </div>

      {hasMore && (
        <div ref={sentinelRef} className="h-12 flex items-center justify-center">
          <span className="text-gray-400 text-xs font-bold">جاري تحميل المزيد...</span>
        </div>
      )}

      {!hasMore && reels.length > 0 && (
        <div className="h-8 flex items-center justify-center">
          <span className="text-gray-300 text-xs font-bold">— انتهت العروض —</span>
        </div>
      )}

      {viewer && (
        <OfferReelViewer
          offers={viewer.offers}
          boundaries={viewer.boundaries}
          initialIndex={viewer.initialIndex}
          multiCategory={viewer.multiCategory}
          onClose={() => setViewer(null)}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </>
  );
}
