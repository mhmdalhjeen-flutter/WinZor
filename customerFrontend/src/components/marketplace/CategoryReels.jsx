import React, { useState } from 'react';
import CategoryCarousel, { buildMultiCategoryViewerState } from './CategoryCarousel';
import OfferReelViewer from './OfferReelViewer';

export default function CategoryReels({
  reels = [],
  favoriteIds = new Set(),
  onToggleFavorite,
}) {
  const [viewer, setViewer] = useState(null);

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

  return (
    <>
      <div className="category-reels space-y-6">
        {reels.map((reel) => (
          <CategoryCarousel
            key={reel.categoryId || reel.categoryName}
            reel={reel}
            onOfferClick={openViewer}
          />
        ))}
      </div>

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
