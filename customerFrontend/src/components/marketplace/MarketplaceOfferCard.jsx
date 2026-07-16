import React, { memo } from 'react';

import { ImageOff } from 'lucide-react';

import OfferPriceDisplay, { getOfferBadge } from '../OfferPriceDisplay';

import VerifiedBadge from './VerifiedBadge';

import { resolveOfferImage, resolveStoreLogo } from '../../utils/mediaUrl';



/**

 * Home rail offer card.

 * LCP: first card uses eager + high fetch priority at w_600; others lazy w_300.

 * Store logo is always resolved when the backend provides one.

 */

function MarketplaceOfferCard({ offer, onClick, topBadge, priority = false }) {

  const store = offer?.store;

  const isVerified = store?.isVerifiedStore;

  const imageSrc = resolveOfferImage(offer, { width: priority ? 600 : 300 });

  const storeLogoSrc = resolveStoreLogo(store, { width: 64 });



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

            width={priority ? 600 : 300}

            height={priority ? 960 : 480}

            loading={priority ? 'eager' : 'lazy'}

            fetchpriority={priority ? 'high' : 'low'}

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



        {storeLogoSrc && (

          <img

            src={storeLogoSrc}

            alt=""

            width={64}

            height={64}

            className="marketplace-offer-card__logo"

            loading="lazy"

            fetchpriority="low"

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



export default memo(MarketplaceOfferCard);


