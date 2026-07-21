import { formatPriceWithUnit } from '../utils/currency';
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
  const priceUnit = pricing?.priceUnit || offer?.priceUnit;
  const currency = pricing?.currency || offer?.currency;

  if (newPrice == null && !badge) return null;

  const showTypeBadge = ['bogo', 'free_item', 'discount', 'fixed_discount'].includes(offer?.offerType);

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`.trim()}>
      {showCompare && oldPrice != null && (
        <span className={oldClassName} aria-label="السعر القديم">
          {pricing?.displayOld || formatPriceWithUnit(oldPrice, currency, priceUnit)}
        </span>
      )}
      {newPrice != null ? (
        <span className={newClassName}>{pricing?.displayNew || formatPriceWithUnit(newPrice, currency, priceUnit)}</span>
      ) : (
        <span className={newClassName}>{badge}</span>
      )}
      {showTypeBadge && badge && (
        <span className={badgeClassName}>{badge}</span>
      )}
    </div>
  );
}
