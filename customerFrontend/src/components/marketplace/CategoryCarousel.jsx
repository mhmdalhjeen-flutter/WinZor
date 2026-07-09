import React, { useRef } from 'react';
import { Sparkles, ChevronLeft } from 'lucide-react';
import MarketplaceOfferCard from './MarketplaceOfferCard';

export default function CategoryCarousel({
  reel,
  onOfferClick,
}) {
  const trackRef = useRef(null);

  const scrollByDir = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const offers = reel?.offers || [];

  return (
    <section className="category-reel">
      <header className="category-reel__header">
        <span className="category-reel__icon" aria-hidden>
          {reel.categoryIcon || <Sparkles size={18} />}
        </span>
        <h3 className="category-reel__title">{reel.categoryName}</h3>
        <span className="category-reel__count">{offers.length} عرض</span>
        {offers.length > 2 && (
          <button
            type="button"
            className="category-reel__scroll-hint"
            onClick={() => scrollByDir(-1)}
            aria-label="تمرير للخلف"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </header>

      <div className="category-reel__track-wrap">
        <div ref={trackRef} className="category-reel__track horizontal-swipe touch-pan-x">
          {offers.map((offer, idx) => (
            <div key={offer._id} className="category-reel__slide">
              <MarketplaceOfferCard
                offer={offer}
                onClick={() => onOfferClick(reel, idx)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Flatten reels into a single offer list with category metadata */
export function buildMultiCategoryViewerState(reels, reelIndex, offerIndex) {
  const offers = [];
  const boundaries = [];

  reels.forEach((reel) => {
    boundaries.push({
      startIndex: offers.length,
      categoryName: reel.categoryName,
      categoryIcon: reel.categoryIcon,
      categoryId: reel.categoryId,
    });
    (reel.offers || []).forEach((offer) => {
      offers.push({
        ...offer,
        __categoryName: reel.categoryName,
        __categoryId: reel.categoryId,
      });
    });
  });

  let initialIndex = 0;
  for (let i = 0; i < reelIndex; i++) {
    initialIndex += reels[i]?.offers?.length || 0;
  }
  initialIndex += offerIndex;

  return { offers, boundaries, initialIndex };
}
