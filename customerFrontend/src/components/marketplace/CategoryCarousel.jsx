import React, { useRef } from 'react';
import { Sparkles, ChevronLeft } from 'lucide-react';
import { getSlideScrollTarget } from '../../hooks/useCenterSnapCarousel';
import MarketplaceOfferCard from './MarketplaceOfferCard';
import OfferRailTrack from './OfferRailTrack';

export default function CategoryCarousel({
  reel,
  onOfferClick,
}) {
  const trackRef = useRef(null);

  const scrollByDir = (dir) => {
    const el = trackRef.current;
    if (!el) return;

    const slides = [...el.querySelectorAll('.home-offers-rail__slide')];
    if (!slides.length) return;

    const viewportCenter = el.scrollLeft + el.clientWidth / 2;
    let activeIdx = 0;
    let bestDist = Infinity;

    slides.forEach((slide, i) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const dist = Math.abs(slideCenter - viewportCenter);
      if (dist < bestDist) {
        bestDist = dist;
        activeIdx = i;
      }
    });

    const nextIdx = Math.max(0, Math.min(slides.length - 1, activeIdx + dir));
    el.scrollTo({
      left: getSlideScrollTarget(el, slides[nextIdx]),
      behavior: 'smooth',
    });
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

      <OfferRailTrack trackRef={trackRef}>
        {offers.map((offer, idx) => (
          <div key={offer._id} className="home-offers-rail__slide">
            <MarketplaceOfferCard
              offer={offer}
              onClick={() => onOfferClick(reel, idx)}
            />
          </div>
        ))}
      </OfferRailTrack>
    </section>
  );
}

/** Flatten reels into offers then products per category for vertical browsing */
export function buildMultiCategoryViewerState(reels, reelIndex, offerIndex) {
  const offers = [];
  const boundaries = [];

  reels.forEach((reel) => {
    const offersStart = offers.length;

    (reel.offers || []).forEach((offer) => {
      offers.push({
        ...offer,
        __itemType: 'offer',
        __categoryName: reel.categoryName,
        __categoryId: reel.categoryId,
      });
    });

    const productsStart = offers.length;

    (reel.products || []).forEach((product) => {
      offers.push({
        ...product,
        __itemType: 'product',
        __categoryName: reel.categoryName,
        __categoryId: reel.categoryId,
      });
    });

    if (offersStart < offers.length) {
      boundaries.push({
        startIndex: offersStart,
        offersStart,
        productsStart,
        categoryName: reel.categoryName,
        categoryIcon: reel.categoryIcon,
        categoryId: reel.categoryId,
      });
    }
  });

  let initialIndex = 0;
  for (let i = 0; i < reelIndex; i++) {
    initialIndex += (reels[i]?.offers?.length || 0) + (reels[i]?.products?.length || 0);
  }
  initialIndex += offerIndex;

  return { offers, boundaries, initialIndex };
}
