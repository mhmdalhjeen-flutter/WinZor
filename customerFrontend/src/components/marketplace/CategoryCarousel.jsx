import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ChevronLeft } from 'lucide-react';
import { getSlideScrollTarget } from '../../hooks/useCenterSnapCarousel';
import MarketplaceOfferCard from './MarketplaceOfferCard';
import OfferRailTrack from './OfferRailTrack';

const SHOPPING_BADGE = '🛍️ للتسوق';
const PRODUCTS_INTRO_MS = 850;

export function mapProductForCard(product) {
  return {
    ...product,
    title: product.name,
    pricing: {
      finalPrice: product.price,
      displayNew: `${product.price} ₪`,
      showCompare: false,
    },
  };
}

function ProductsSectionIntro({ categoryName, visible }) {
  if (!visible) return null;
  return (
    <div className="category-reel__products-intro" role="status" aria-live="polite">
      <span className="category-reel__products-intro-pill">منتجات {categoryName}</span>
    </div>
  );
}

export default function CategoryCarousel({
  reel,
  onOfferClick,
  onProductClick,
}) {
  const trackRef = useRef(null);
  const hadProductsRef = useRef(false);
  const [showProductsIntro, setShowProductsIntro] = useState(false);

  const offers = reel?.offers || [];
  const products = reel?.products || [];

  useEffect(() => {
    if (products.length > 0 && !hadProductsRef.current) {
      hadProductsRef.current = true;
      setShowProductsIntro(true);
      const timer = setTimeout(() => setShowProductsIntro(false), PRODUCTS_INTRO_MS);
      return () => clearTimeout(timer);
    }
    if (products.length === 0) {
      hadProductsRef.current = false;
    }
    return undefined;
  }, [products.length]);

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
      left: getSlideScrollTarget(el, slides[nextIdx]),
      behavior: 'smooth',
    });
  };

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

      {products.length > 0 && (
        <div className="category-reel__products-wrap">
          <ProductsSectionIntro
            categoryName={reel.categoryName}
            visible={showProductsIntro}
          />
          <OfferRailTrack className="category-reel__products-rail">
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
        </div>
      )}
    </section>
  );
}

/** Flatten reels: category intro → offers → products per category (strict order, no mixing) */
export function buildMultiCategoryViewerState(reels, reelIndex, offerIndex, productIndex = null) {
  const offers = [];
  const boundaries = [];

  reels.forEach((reel) => {
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
    initialIndex += 1 + (reels[i]?.offers?.length || 0) + (reels[i]?.products?.length || 0);
  }

  if (productIndex != null) {
    initialIndex += 1 + (reels[reelIndex]?.offers?.length || 0) + productIndex;
  } else {
    initialIndex += 1 + offerIndex;
  }

  return { offers, boundaries, initialIndex };
}
