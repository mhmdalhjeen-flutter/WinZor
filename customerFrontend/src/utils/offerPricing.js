/** Display-only helpers — pricing calculations live in backend pricing.service.js */
import { formatPrice, getCurrencySymbol } from './currency';

export function formatOfferBadge(offer) {
  if (!offer) return '';
  if (offer.pricing?.badge) return offer.pricing.badge;
  switch (offer?.offerType) {
    case 'discount':
      return offer.value != null ? `\u062E\u0635\u0645 ${offer.value}%` : '\u062E\u0635\u0645';
    case 'fixed_price':
      return '\u0633\u0639\u0631 \u062E\u0627\u0635';
    case 'fixed_discount':
      return offer.value != null ? `\u062E\u0635\u0645 ${offer.value} ${getCurrencySymbol(offer?.currency || offer?.pricing?.currency)}` : '\u062E\u0635\u0645 \u062B\u0627\u0628\u062A';
    case 'bogo':
      return '1+1';
    case 'free_item':
      return '\u0647\u062F\u064A\u0629';
    default:
      return '\u0639\u0631\u0636';
  }
}

/** @deprecated Use offer.pricing from API instead. Fallback for unmigrated responses only. */
export function resolveOfferPrices(offer) {
  if (offer?.pricing) {
    const p = offer.pricing;
    return {
      oldPrice: p.originalPrice,
      newPrice: p.finalPrice,
      showCompare: p.showCompare,
    };
  }
  return { oldPrice: null, newPrice: offer?.finalPrice ?? null, showCompare: false };
}
