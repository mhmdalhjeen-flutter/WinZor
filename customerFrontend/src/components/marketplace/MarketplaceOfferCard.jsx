import React from 'react';
import { ImageOff } from 'lucide-react';
import OfferPriceDisplay, { getOfferBadge } from '../OfferPriceDisplay';
import VerifiedBadge from './VerifiedBadge';
import { resolveOfferImage, resolveStoreLogo, cloudinarySrcSet } from '../../utils/mediaUrl';

export default function MarketplaceOfferCard({ offer, onClick, topBadge, priority = false }) {
  const store = offer?.store;
  const isVerified = store?.isVerifiedStore;
  // Cards: w_300 primary; priority (LCP) uses w_600 for sharper first paint
  const imageSrc = resolveOfferImage(offer, { width: priority ? 600 : 300 });
  const imageSrcSet = cloudinarySrcSet(offer?.image || imageSrc, [300, 600]);
  const storeLogoSrc = resolveStoreLogo(store, { width: 80 });

  return (
    <button
      type="button"
      onClick={() => onClick?.(offer)}
      className="marketplace-offer-card group w-full text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-light/60"
      aria-label={`${topBadge ? 'منتج' : 'عرض'} ${offer.title} من ${store?.name || 'متجر'}`}
    >
      <div className="marketplace-offer-card__media">
        {imageSrc ? (
          <img
            src={imageSrc}
            srcSet={imageSrcSet}
            sizes="(max-width: 640px) 70vw, 300px"
            alt={offer.title}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            className="marketplace-offer-card__image"
          />
        ) : (
          <div className="marketplace-offer-card__placeholder">
            <ImageOff size={32} />
          </div>
        )}

        <div className="marketplace-offer-card__gradient" aria-hidden />

        <div className={`marketplace-offer-card__badge${topBadge ? ' marketplace-offer-card__badge--shopping' : ''}`}>
          {topBadge || getOfferBadge(offer)}
        </div>

        {storeLogoSrc && (
          <img
            src={storeLogoSrc}
            alt=""
            className="marketplace-offer-card__logo"
            loading="lazy"
            decoding="async"
          />
        )}

        <div className="marketplace-offer-card__info">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="marketplace-offer-card__store">{store?.name || 'متجر'}</p>
            {isVerified && <VerifiedBadge />}
          </div>
          <h4 className="marketplace-offer-card__title">{offer.title}</h4>
          <OfferPriceDisplay
            offer={offer}
            oldClassName="marketplace-offer-card__old-price"
            newClassName="marketplace-offer-card__new-price"
            badgeClassName="hidden"
          />
        </div>
      </div>
    </button>
  );
}
