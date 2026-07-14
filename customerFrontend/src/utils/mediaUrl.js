import { API_URL } from '../lib/apiUrl';

const ABSOLUTE_SRC_RE = /^(https?:|data:|blob:)/i;
const CLOUDINARY_HOST_RE = /^(https?:)?\/\/res\.cloudinary\.com\//i;

/**
 * Shared display strategy (React + Flutter):
 * - https:// → Cloudinary / remote URL (new uploads)
 * - relative /offers|/products|/stores/... → prefix API base (legacy Base64 served by backend)
 * - data:image/... → legacy Base64 (supported for backward compatibility)
 *
 * Upload strategy (see imageUpload.js / Flutter ImageUploadService):
 * File → POST /api/upload/image → Cloudinary → HTTPS → save URL in MongoDB
 *
 * Display-only: Cloudinary delivery URLs get f_auto / q_auto / w_* without
 * changing stored DB values or API payloads.
 */

/** True when URL is a Cloudinary delivery URL with an /upload/ segment. */
export function isCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return CLOUDINARY_HOST_RE.test(url) && url.includes('/upload/');
}

/**
 * Insert or replace Cloudinary delivery transforms.
 * @param {string} url
 * @param {{ width?: number, height?: number, crop?: string }} [options]
 */
export function optimizeCloudinaryUrl(url, options = {}) {
  if (!url || typeof url !== 'string' || !isCloudinaryUrl(url)) return url;

  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + marker.length);
  let rest = url.slice(idx + marker.length);

  // Drop an existing transformation segment so we do not stack duplicates.
  const slash = rest.indexOf('/');
  const firstSeg = slash === -1 ? rest : rest.slice(0, slash);
  const isVersion = /^v\d+$/i.test(firstSeg);
  const looksLikeTransform =
    !isVersion &&
    firstSeg.length > 0 &&
    (/^[^/]*_/i.test(firstSeg) || firstSeg.includes(','));

  if (looksLikeTransform) {
    rest = slash === -1 ? '' : rest.slice(slash + 1);
  }

  if (!rest) return url;

  const transforms = ['f_auto', 'q_auto'];
  if (options.width) transforms.push(`w_${Number(options.width)}`);
  if (options.height) transforms.push(`h_${Number(options.height)}`);
  if (options.crop) transforms.push(`c_${options.crop}`);

  return `${prefix}${transforms.join(',')}/${rest}`;
}

/**
 * Responsive srcset for Cloudinary (no-op for non-Cloudinary URLs).
 * @param {string} url
 * @param {number[]} [widths]
 */
export function cloudinarySrcSet(url, widths = [300, 600]) {
  if (!isCloudinaryUrl(url)) return undefined;
  return widths
    .map((w) => `${optimizeCloudinaryUrl(url, { width: w })} ${w}w`)
    .join(', ');
}

export function resolveImageUrl(src, options = {}) {
  if (!src || typeof src !== 'string') return null;
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (ABSOLUTE_SRC_RE.test(trimmed)) {
    return optimizeCloudinaryUrl(trimmed, options);
  }

  const base = API_URL.replace(/\/+$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

/** @alias resolveImageUrl */
export const resolveMediaSrc = resolveImageUrl;

export function resolveOfferImage(offer, options = {}) {
  if (!offer) return null;
  const direct = resolveImageUrl(offer.image, options);
  if (direct) return direct;
  if (offer.hasImage && offer._id) {
    return resolveImageUrl(`/offers/${offer._id}/image`, options);
  }
  return null;
}

export function resolveProductImage(product, options = {}) {
  if (!product) return null;
  const direct = resolveImageUrl(product.image, options);
  if (direct) return direct;
  if (product.hasImage && product._id) {
    return resolveImageUrl(`/products/${product._id}/image`, options);
  }
  return null;
}

export function resolveStoreLogo(store, options = { width: 150 }) {
  if (!store) return null;
  const direct = resolveImageUrl(store.logo, options);
  if (direct) return direct;
  if (store.hasLogo && store._id) {
    return resolveImageUrl(`/stores/${store._id}/logo`, options);
  }
  return null;
}

export function resolveStoreCover(store, options = { width: 800 }) {
  if (!store) return null;
  const direct = resolveImageUrl(store.coverImage, options);
  if (direct) return direct;
  if (store.hasCoverImage && store._id) {
    return resolveImageUrl(`/stores/${store._id}/cover`, options);
  }
  return null;
}

export function storeLogoPlaceholder(store) {
  const name = encodeURIComponent(store?.name || 'S');
  return `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`;
}

export default resolveImageUrl;
