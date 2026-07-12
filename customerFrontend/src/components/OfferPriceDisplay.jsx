import { formatPrice } from '../utils/currency';
import { formatOfferBadge, resolveOfferPrices } from '../utils/offerPricing';

/** Reads pricing from API SSOT — no local price calculation. */
export function getOfferPricing(offer) {
  if (offer?.pricing) return offer.pricing;
  return resolveOfferPrices(offer);
}

export function getOfferBadge(offer) {
  return offer?.pricing?.badge || formatOfferBadge(offer);
}

export default function OfferPriceDisplay({
  offer,
  className = '',
  oldClassName = 'text-gray-400 font-bold text-base line-through',
  newClassName = 'text-primary font-black text-2xl',
  badgeClassName = 'text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/15 text-primary',
}) {
  const pricing = offer?.pricing;
  const oldPrice = pricing?.originalPrice;
  const newPrice = pricing?.finalPrice;
  const showCompare = pricing?.showCompare ?? false;
  const badge = pricing?.badge || formatOfferBadge(offer);

  if (newPrice == null && !badge) return null;

  const showTypeBadge = ['bogo', 'free_item', 'discount', 'fixed_discount'].includes(offer?.offerType);

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`.trim()}>
      {showCompare && oldPrice != null && (
        <span className={oldClassName} aria-label="السعر القديم">
          {pricing?.displayOld || formatPrice(oldPrice, pricing?.currency || offer?.currency)}
        </span>
      )}
      {newPrice != null ? (
        <span className={newClassName}>{pricing?.displayNew || formatPrice(newPrice, pricing?.currency || offer?.currency)}</span>
      ) : (
        <span className={newClassName}>{badge}</span>
      )}
      {showTypeBadge && badge && (
        <span className={badgeClassName}>{badge}</span>
      )}
    </div>
  );
}
