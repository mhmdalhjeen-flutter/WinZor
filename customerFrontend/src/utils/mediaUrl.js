import { API_URL } from '../lib/apiUrl';

const ABSOLUTE_SRC_RE = /^(https?:|data:|blob:)/i;

/**
 * Shared display strategy (React + Flutter):
 * - https:// → Cloudinary / remote URL (new uploads)
 * - relative /offers|/products|/stores/... → prefix API base (legacy Base64 served by backend)
 * - data:image/... → legacy Base64 (supported for backward compatibility)
 *
 * Upload strategy (see imageUpload.js / Flutter ImageUploadService):
 * File → POST /api/upload/image → Cloudinary → HTTPS → save URL in MongoDB
 */
export function resolveImageUrl(src) {
  if (!src || typeof src !== 'string') return null;
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (ABSOLUTE_SRC_RE.test(trimmed)) {
    return trimmed;
  }

  const base = API_URL.replace(/\/+$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

/** @alias resolveImageUrl */
export const resolveMediaSrc = resolveImageUrl;

export function resolveOfferImage(offer) {
  if (!offer) return null;
  const direct = resolveImageUrl(offer.image);
  if (direct) return direct;
  if (offer.hasImage && offer._id) {
    return resolveImageUrl(`/offers/${offer._id}/image`);
  }
  return null;
}

export function resolveProductImage(product) {
  if (!product) return null;
  const direct = resolveImageUrl(product.image);
  if (direct) return direct;
  if (product.hasImage && product._id) {
    return resolveImageUrl(`/products/${product._id}/image`);
  }
  return null;
}

export function resolveStoreLogo(store) {
  if (!store) return null;
  const direct = resolveImageUrl(store.logo);
  if (direct) return direct;
  if (store.hasLogo && store._id) {
    return resolveImageUrl(`/stores/${store._id}/logo`);
  }
  return null;
}

export function resolveStoreCover(store) {
  if (!store) return null;
  const direct = resolveImageUrl(store.coverImage);
  if (direct) return direct;
  if (store.hasCoverImage && store._id) {
    return resolveImageUrl(`/stores/${store._id}/cover`);
  }
  return null;
}

export function storeLogoPlaceholder(store) {
  const name = encodeURIComponent(store?.name || 'S');
  return `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`;
}

export default resolveImageUrl;
