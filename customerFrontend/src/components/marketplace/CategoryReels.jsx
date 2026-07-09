import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import MarketplaceOfferCard from './MarketplaceOfferCard';
import OfferReelViewer from './OfferReelViewer';

export default function CategoryReels({
  reels = [],
  favoriteIds = new Set(),
  onToggleFavorite,
}) {
  const [viewer, setViewer] = useState(null);

  const openViewer = (offers, index) => {
    setViewer({ offers, index });
  };

  return (
    <>
      <div className="category-reels space-y-8">
        {reels.map((reel) => (
          <section key={reel.categoryId || reel.categoryName} className="category-reel">
            <header className="category-reel__header">
              <span className="category-reel__icon" aria-hidden>
                {reel.categoryIcon || <Sparkles size={18} />}
              </span>
              <h3 className="category-reel__title">{reel.categoryName}</h3>
              <span className="category-reel__count">{reel.offers?.length || 0} عرض</span>
            </header>

            <div className="category-reel__grid">
              {(reel.offers || []).map((offer, idx) => (
                <MarketplaceOfferCard
                  key={offer._id}
                  offer={offer}
                  onClick={() => openViewer(reel.offers, idx)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {viewer && (
        <OfferReelViewer
          offers={viewer.offers}
          initialIndex={viewer.index}
          onClose={() => setViewer(null)}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </>
  );
}
