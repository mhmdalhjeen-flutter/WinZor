import React, { useCallback, useMemo, useState, Suspense, lazy, memo } from 'react';

import CategoryCarousel, { buildMultiCategoryViewerState } from '../marketplace/CategoryCarousel';



const OfferReelViewer = lazy(() => import('../marketplace/OfferReelViewer'));



/**

 * Renders every offer/product in the loaded reels so image URLs are requested.

 * Progressive LCP gating (hiding cards until scroll) was removed — it prevented

 * the browser from requesting real images that already existed in the API payload.

 */

function ProgressiveCategoryReels({

  reels = [],

  favoriteIds = new Set(),

  onToggleFavorite,

}) {

  const [viewer, setViewer] = useState(null);



  const openOfferViewer = useCallback((reel, offerIndex) => {

    const reelIndex = reels.findIndex(

      (r) => (r.categoryId || r.categoryName) === (reel.categoryId || reel.categoryName)

    );

    const { offers, boundaries, initialIndex } = buildMultiCategoryViewerState(

      reels,

      Math.max(reelIndex, 0),

      offerIndex

    );

    setViewer({ offers, boundaries, initialIndex, multiCategory: true });

  }, [reels]);



  const openProductViewer = useCallback((reel, productIndex) => {

    const reelIndex = reels.findIndex(

      (r) => (r.categoryId || r.categoryName) === (reel.categoryId || reel.categoryName)

    );

    const { offers, boundaries, initialIndex } = buildMultiCategoryViewerState(

      reels,

      Math.max(reelIndex, 0),

      0,

      productIndex

    );

    setViewer({ offers, boundaries, initialIndex, multiCategory: true });

  }, [reels]);



  const closeViewer = useCallback(() => setViewer(null), []);



  const list = useMemo(() => reels || [], [reels]);



  return (

    <>

      <div className="category-reels home-progressive-reels space-y-6">

        {list.map((reel, idx) => {

          const prevReel = idx > 0 ? list[idx - 1] : null;

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



      {viewer && (

        <Suspense fallback={null}>

          <OfferReelViewer

            offers={viewer.offers}

            initialIndex={viewer.initialIndex}

            boundaries={viewer.boundaries}

            multiCategory={viewer.multiCategory}

            favoriteIds={favoriteIds}

            onToggleFavorite={onToggleFavorite}

            onClose={closeViewer}

          />

        </Suspense>

      )}

    </>

  );

}



export default memo(ProgressiveCategoryReels);


