import React, { memo } from 'react';
import { Sparkles, ChevronLeft } from 'lucide-react';
import { formatPrice } from '../../utils/currency';
import { isMiscReel } from '../../utils/categoryDisplay';
import MarketplaceOfferCard from './MarketplaceOfferCard';
import OfferRailTrack from './OfferRailTrack';
import { getSlideScrollTarget } from '../../hooks/useCenterSnapCarousel';

const SHOPPING_BADGE = '🛍️ للتسوق';

export function mapProductForCard(product) {
  return {
    ...product,
    title: product.name,
    pricing: {
      finalPrice: product.price,
      displayNew: formatPrice(product.price, product.currency),
      showCompare: false,
    },
  };
}

function CategoryCarousel({
  reel,
  onOfferClick,
  onProductClick,
  hideHeader = false,
  priorityFirstImage = false,
}) {
  const trackRef = React.useRef(null);

  const offers = reel?.offers || [];
  const products = reel?.products || [];
  const totalItems = offers.length + products.length;

  const scrollByDir = (dir) => {
    const el = trackRef.current;
    if (!el) return;

    const slides = el.querySelectorAll('.home-offers-rail__slide');
    if (!slides.length) return;

    const viewportCenter = el.scrollLeft + el.clientWidth / 2;
    let activeIdx = 0;
    let bestDist = Infinity;

    for (let i = 0; i < slides.length; i += 1) {
      const slide = slides[i];
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const dist = Math.abs(slideCenter - viewportCenter);
      if (dist < bestDist) {
        bestDist = dist;
        activeIdx = i;
      }
    }

    const nextIdx = Math.max(0, Math.min(slides.length - 1, activeIdx + dir));
    el.scrollTo({
      behavior: 'smooth',
    });
  };

  const countLabel = products.length
    ? `${offers.length} عرض · ${products.length} منتج`
    : `${offers.length} عرض`;

  return (
    <section className="category-reel">
      {!hideHeader && (
        <header className="category-reel__header">
          <span className="category-reel__icon" aria-hidden>
            {reel.categoryIcon || <Sparkles size={18} />}
          </span>
          <h3 className="category-reel__title">{reel.categoryName}</h3>
          <span className="category-reel__count">{countLabel}</span>
          {totalItems > 2 && (
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
      )}

      <OfferRailTrack
        trackRef={trackRef}
        resetKey={String(reel.categoryId || reel.categoryName || 'category')}
      >
        {offers.map((offer, idx) => (
          <div key={offer._id} className="home-offers-rail__slide">
            <MarketplaceOfferCard
              offer={offer}
              priority={priorityFirstImage && idx === 0}
              onClick={() => onOfferClick(reel, idx)}
            />
          </div>
        ))}

        {products.length > 0 && (
          <div
            className="home-offers-rail__slide home-offers-rail__slide--products-label"
            aria-hidden="true"
          >
            <div className="category-reel__products-divider" />
          </div>
        )}

        {products.map((product, idx) => (
          <div key={product._id} className="home-offers-rail__slide">
            <MarketplaceOfferCard
              offer={mapProductForCard(product)}
              topBadge={SHOPPING_BADGE}
              onClick={() => onProductClick?.(reel, idx)}
            />
          </div>
        ))}
      </OfferRailTrack>
    </section>
  );
}

export default memo(CategoryCarousel);

/** Flatten reels: category intro → offers → products per category (strict order, no mixing) */
export function buildMultiCategoryViewerState(reels, reelIndex, offerIndex, productIndex = null) {
  const safeReels = (reels || []).filter((reel) => !isMiscReel(reel));
  const offers = [];
  const boundaries = [];

  safeReels.forEach((reel) => {
    const categoryIntroIndex = offers.length;

    offers.push({
      _id: `category-${reel.categoryId || reel.categoryName}`,
      __itemType: 'category',
      __categoryName: reel.categoryName,
      __categoryId: reel.categoryId,
      __categoryIcon: reel.categoryIcon,
    });

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

    if (offersStart <= offers.length) {
      boundaries.push({
        startIndex: categoryIntroIndex,
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
    initialIndex += 1 + (safeReels[i]?.offers?.length || 0) + (safeReels[i]?.products?.length || 0);
  }

  if (productIndex != null) {
    initialIndex += 1 + (safeReels[reelIndex]?.offers?.length || 0) + productIndex;
  } else {
    initialIndex += 1 + offerIndex;
  }

  return { offers, boundaries, initialIndex };
}
