import React from 'react';
import { ImageOff } from 'lucide-react';
import { getOfferBadge } from '../OfferCard';
import OfferPriceDisplay from '../OfferPriceDisplay';
import VerifiedBadge from './VerifiedBadge';

export default function MarketplaceOfferCard({ offer, onClick }) {
  const store = offer?.store;
  const isVerified = store?.isVerifiedStore;

  return (
    <button
      type="button"
      onClick={() => onClick?.(offer)}
      className="marketplace-offer-card group w-full text-right focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-light/60"
      aria-label={`عرض ${offer.title} من ${store?.name || 'متجر'}`}
    >
      <div className="marketplace-offer-card__media">
        {offer.image ? (
          <img
            src={offer.image}
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

        <div className="marketplace-offer-card__badge">{getOfferBadge(offer)}</div>

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
