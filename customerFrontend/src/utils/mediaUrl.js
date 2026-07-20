import { API_URL } from '../lib/apiUrl';

const ABSOLUTE_SRC_RE = /^(https?:|data:|blob:)/i;
const CLOUDINARY_HOST_RE = /^(https?:)?\/\/res\.cloudinary\.com\//i;
/** Blocked external hosts (Google thumbnails / CSP violations). */
const BLOCKED_IMAGE_PATTERNS = [
  /encrypted-tbn0\.gstatic\.com/i,
  /\/images\?q=tbn/i,
  /[?&]tbn[=:]/i,
  /gstatic\.com\/images\?.*tbn/i,
];

export function isBlockedExternalImageUrl(src) {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  return BLOCKED_IMAGE_PATTERNS.some((re) => re.test(trimmed));
}
/** Single Cloudinary transform token (w_300, f_auto, c_fill, …) — not a folder name. */
const CLOUDINARY_TRANSFORM_TOKEN_RE =
  /^(a|ar|b|bo|c|co|cs|d|dl|dn|du|e|f|fl|g|h|l|o|p|q|r|t|u|w|x|y|z|dpr|if|so|eo|ac|af|br|vs)[_:].+/i;

/**
 * Display-only image resolver (parity with Flutter media_url.dart).
 *
 * - Absolute http(s)/data/blob → use as-is (optimize Cloudinary /upload/ only)
 * - Relative /offers|/products|/stores/... → prefix API base
 * - Invalid / non-URL strings (e.g. accidental text in image fields) → null
 *
 * Does not change API responses or database fields.
 * Does not proxy Facebook/Google through Cloudinary fetch or wsrv.nl.
 */

export function isCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return CLOUDINARY_HOST_RE.test(url) && /\/upload\//i.test(url);
}

/** True when the value is safe to use as an <img src>. */
export function isDisplayableImageSrc(src) {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim();
  if (!trimmed) return false;
  if (ABSOLUTE_SRC_RE.test(trimmed)) {
    if (isBlockedExternalImageUrl(trimmed)) return false;
    return true;
  }
  // API-relative media paths only (not arbitrary relative text)
  return (
    trimmed.startsWith('/offers/')
    || trimmed.startsWith('/products/')
    || trimmed.startsWith('/stores/')
    || trimmed.startsWith('/brand/')
    || trimmed.startsWith('/uploads/')
  );
}

function isCloudinaryTransformSegment(seg) {
  if (!seg || /^v\d+$/i.test(seg)) return false;
  const parts = seg.split(',');
  if (parts.length === 0) return false;
  return parts.every((part) => CLOUDINARY_TRANSFORM_TOKEN_RE.test(part));
}

function buildTransformSegment(options = {}) {
  const parts = ['f_auto', 'q_auto'];
  if (options.width) parts.push(`w_${Number(options.width)}`);
  if (options.height) parts.push(`h_${Number(options.height)}`);
  if (options.crop) parts.push(`c_${options.crop}`);
  return parts.join(',');
}

/**
 * Insert/replace Cloudinary transforms after /upload/ on delivery URLs.
 * Non-Cloudinary absolute URLs are returned unchanged.
 */
export function optimizeCloudinaryUrl(url, options = {}) {
  if (!url || typeof url !== 'string' || !isCloudinaryUrl(url)) return url;

  const marker = '/upload/';
  const idx = url.indexOf(marker);
  if (idx === -1) return url;

  const prefix = url.slice(0, idx + marker.length);
  let rest = url.slice(idx + marker.length);

  const slash = rest.indexOf('/');
  const firstSeg = slash === -1 ? rest : rest.slice(0, slash);

  if (isCloudinaryTransformSegment(firstSeg)) {
    rest = slash === -1 ? '' : rest.slice(slash + 1);
  }
  if (!rest) return url;

  return `${prefix}${buildTransformSegment(options)}/${rest}`;
}

export function cloudinarySrcSet(url, widths = [300, 600]) {
  if (!isCloudinaryUrl(url)) return undefined;
  return widths
    .map((w) => `${optimizeCloudinaryUrl(url, { width: w })} ${w}w`)
    .join(', ');
}

export function resolveImageUrl(src, options = {}) {
  if (!isDisplayableImageSrc(src)) return null;
  const trimmed = src.trim();

  if (ABSOLUTE_SRC_RE.test(trimmed)) {
    if (/^(data:|blob:)/i.test(trimmed)) return trimmed;
    return optimizeCloudinaryUrl(trimmed, options);
  }

  const base = API_URL.replace(/\/+$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

export const resolveMediaSrc = resolveImageUrl;

/** Alias kept for callers that used the remote-optimizer name. */
export function optimizeRemoteImageUrl(url, options = {}) {
  return optimizeCloudinaryUrl(url, options);
}

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

export function resolveStoreLogo(store, options = {}) {
  if (!store) return null;
  const opts = { width: 64, ...options };
  const direct = resolveImageUrl(store.logo, opts);
  if (direct) return direct;
  if (store.hasLogo && store._id) {
    return resolveImageUrl(`/stores/${store._id}/logo`, opts);
  }
  return null;
}

export function resolveStoreCover(store, options = {}) {
  if (!store) return null;
  const opts = { width: 800, ...options };
  const direct = resolveImageUrl(store.coverImage, opts);
  if (direct) return direct;
  if (store.hasCoverImage && store._id) {
    return resolveImageUrl(`/stores/${store._id}/cover`, opts);
  }
  return null;
}

export function storeLogoPlaceholder(store) {
  if (store?.name) {
    const name = encodeURIComponent(store.name);
    return `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff&size=128`;
  }
  return '/brand/logo-128.webp';
}

export default resolveImageUrl;
