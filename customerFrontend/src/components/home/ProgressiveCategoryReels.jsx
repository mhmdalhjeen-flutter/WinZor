import React, { useCallback, useEffect, useRef, useState, Suspense, lazy } from 'react';
import CategoryCarousel, { buildMultiCategoryViewerState } from '../marketplace/CategoryCarousel';

const OfferReelViewer = lazy(() => import('../marketplace/OfferReelViewer'));

const INITIAL_OFFERS = 2;
const OFFERS_BATCH = 3;
const INITIAL_PRODUCTS = 2;
const PRODUCTS_BATCH = 3;

function getOffersGate(totalOffers) {
  return Math.min(INITIAL_OFFERS, totalOffers);
}

function offersReadyForProducts(offerLimit, totalOffers) {
  if (totalOffers === 0) return true;
  return offerLimit >= getOffersGate(totalOffers);
}

export default function ProgressiveCategoryReels({
  reels = [],
  favoriteIds = new Set(),
  onToggleFavorite,
}) {
  const [visibleCategoryCount, setVisibleCategoryCount] = useState(1);
  const [visibleOffersByCategory, setVisibleOffersByCategory] = useState({ 0: INITIAL_OFFERS });
  const [visibleProductsByCategory, setVisibleProductsByCategory] = useState({});
  const [viewer, setViewer] = useState(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setVisibleCategoryCount(1);
    setVisibleOffersByCategory({ 0: INITIAL_OFFERS });
    setVisibleProductsByCategory({});
  }, [reels]);

  useEffect(() => {
    setVisibleProductsByCategory((prev) => {
      let changed = false;
      const next = { ...prev };

      for (let idx = 0; idx < visibleCategoryCount; idx += 1) {
        const reel = reels[idx];
        const totalOffers = reel?.offers?.length || 0;
        const totalProducts = reel?.products?.length || 0;
        if (!totalProducts || next[idx] > 0) continue;

        const offerLimit = visibleOffersByCategory[idx] ?? INITIAL_OFFERS;
        if (offersReadyForProducts(offerLimit, totalOffers)) {
          next[idx] = Math.min(INITIAL_PRODUCTS, totalProducts);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [reels, visibleCategoryCount, visibleOffersByCategory]);

  const revealMore = useCallback(() => {
    if (!reels.length) return;

    const lastIdx = visibleCategoryCount - 1;
    const lastReel = reels[lastIdx];
    const totalOffers = lastReel?.offers?.length || 0;
    const totalProducts = lastReel?.products?.length || 0;
    const currentlyVisibleOffers = visibleOffersByCategory[lastIdx] ?? INITIAL_OFFERS;
    const currentlyVisibleProducts = visibleProductsByCategory[lastIdx] ?? 0;
    const productsUnlocked = offersReadyForProducts(currentlyVisibleOffers, totalOffers);

    if (productsUnlocked && totalProducts > 0 && currentlyVisibleProducts === 0) {
      setVisibleProductsByCategory((prev) => ({
        ...prev,
        [lastIdx]: Math.min(INITIAL_PRODUCTS, totalProducts),
      }));
      return;
    }

    if (currentlyVisibleOffers < totalOffers) {
      setVisibleOffersByCategory((prev) => ({
        ...prev,
        [lastIdx]: Math.min(currentlyVisibleOffers + OFFERS_BATCH, totalOffers),
      }));
      return;
    }

    if (productsUnlocked && totalProducts > 0 && currentlyVisibleProducts < totalProducts) {
      setVisibleProductsByCategory((prev) => ({
        ...prev,
        [lastIdx]: Math.min(currentlyVisibleProducts + PRODUCTS_BATCH, totalProducts),
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
  }, [reels, visibleCategoryCount, visibleOffersByCategory, visibleProductsByCategory]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !reels.length) return;

    const lastIdx = visibleCategoryCount - 1;
    const lastReel = reels[lastIdx];
    const totalOffers = lastReel?.offers?.length || 0;
    const totalProducts = lastReel?.products?.length || 0;
    const currentlyVisibleOffers = visibleOffersByCategory[lastIdx] ?? INITIAL_OFFERS;
    const currentlyVisibleProducts = visibleProductsByCategory[lastIdx] ?? 0;
    const productsUnlocked = offersReadyForProducts(currentlyVisibleOffers, totalOffers);
    const hasMoreOffers = currentlyVisibleOffers < totalOffers;
    const hasMoreProducts = productsUnlocked && currentlyVisibleProducts < totalProducts;
    const hasMoreCategories = visibleCategoryCount < reels.length;

    if (!hasMoreOffers && !hasMoreProducts && !hasMoreCategories) return undefined;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) revealMore();
      },
      { rootMargin: '200px' }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [reels, visibleCategoryCount, visibleOffersByCategory, visibleProductsByCategory, revealMore]);

  const visibleReels = reels.slice(0, visibleCategoryCount).map((reel, idx) => {
    const offerLimit = visibleOffersByCategory[idx] ?? INITIAL_OFFERS;
    const totalOffers = reel?.offers?.length || 0;
    const totalProducts = reel?.products?.length || 0;
    const productsUnlocked = offersReadyForProducts(offerLimit, totalOffers);
    const productLimit = productsUnlocked ? (visibleProductsByCategory[idx] ?? 0) : 0;

    return {
      ...reel,
      offers: (reel.offers || []).slice(0, offerLimit),
      products: (reel.products || []).slice(0, productLimit),
    };
  });

  const findReelIndex = (reel) => reels.findIndex(
    (r) => (r.categoryId || r.categoryName) === (reel.categoryId || reel.categoryName)
  );

  const openOfferViewer = (reel, offerIndex) => {
    const reelIndex = findReelIndex(reel);
    const { offers, boundaries, initialIndex } = buildMultiCategoryViewerState(
      reels,
      Math.max(reelIndex, 0),
      offerIndex
    );
    setViewer({ offers, boundaries, initialIndex, multiCategory: true });
  };

  const openProductViewer = (reel, productIndex) => {
    const reelIndex = findReelIndex(reel);
    const { offers, boundaries, initialIndex } = buildMultiCategoryViewerState(
      reels,
      Math.max(reelIndex, 0),
      0,
      productIndex
    );
    setViewer({ offers, boundaries, initialIndex, multiCategory: true });
  };

  const lastIdx = visibleCategoryCount - 1;
  const lastReel = reels[lastIdx];
  const totalOffers = lastReel?.offers?.length || 0;
  const totalProducts = lastReel?.products?.length || 0;
  const currentlyVisibleOffers = visibleOffersByCategory[lastIdx] ?? INITIAL_OFFERS;
  const currentlyVisibleProducts = visibleProductsByCategory[lastIdx] ?? 0;
  const productsUnlocked = offersReadyForProducts(currentlyVisibleOffers, totalOffers);
  const hasMore =
    currentlyVisibleOffers < totalOffers
    || (productsUnlocked && currentlyVisibleProducts < totalProducts)
    || visibleCategoryCount < reels.length;

  return (
    <>
      <div className="category-reels home-progressive-reels space-y-6">
        {visibleReels.map((reel, idx) => {
          const prevReel = idx > 0 ? visibleReels[idx - 1] : null;
          const showParentHeader =
            reel.parentCategoryName
            && reel.parentCategoryId
            && (
              !prevReel
              || prevReel.parentCategoryId !== reel.parentCategoryId
            );

          return (
            <React.Fragment key={reel.categoryId || reel.categoryName}>
              {idx > 0 && <div className="category-reel-divider" aria-hidden />}
              {showParentHeader && (
                <div className="category-reel-parent">
                  <h2 className="category-reel-parent__title">{reel.parentCategoryName}</h2>
                </div>
              )}
              <CategoryCarousel
                reel={reel}
                hideHeader={Boolean(reel.isParentFallback)}
                priorityFirstImage={idx === 0}
                onOfferClick={openOfferViewer}
                onProductClick={openProductViewer}
              />
            </React.Fragment>
          );
        })}
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
        <Suspense fallback={null}>
          <OfferReelViewer
            offers={viewer.offers}
            boundaries={viewer.boundaries}
            initialIndex={viewer.initialIndex}
            multiCategory={viewer.multiCategory}
            onClose={() => setViewer(null)}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
          />
        </Suspense>
      )}
    </>
  );
}
