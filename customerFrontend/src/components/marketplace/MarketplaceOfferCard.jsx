import React from 'react';
import { ImageOff } from 'lucide-react';
import { getOfferBadge } from '../OfferCard';
import OfferPriceDisplay from '../OfferPriceDisplay';
import VerifiedBadge from './VerifiedBadge';
import { resolveMediaSrc } from '../../utils/mediaUrl';

export default function MarketplaceOfferCard({ offer, onClick, topBadge }) {
  const store = offer?.store;
  const isVerified = store?.isVerifiedStore;
  const imageSrc = resolveMediaSrc(offer?.image);

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
            alt={offer.title}
            loading="lazy"
            decoding="async"
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

        {store?.logo && (
          <img
            src={store.logo}
            alt=""
            className="marketplace-offer-card__logo"
            loading="lazy"
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
