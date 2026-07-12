import { API_URL } from '../lib/apiUrl';

/** Resolve offer/product image for <img src> — supports https, data URLs, and API image paths. */
export function resolveMediaSrc(src) {
  if (!src || typeof src !== 'string') return null;
  const trimmed = src.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('https://')
    || trimmed.startsWith('http://')
    || trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    const base = API_URL.replace(/\/+$/, '');
    return `${base}${trimmed}`;
  }

  return trimmed;
}

export default resolveMediaSrc;
