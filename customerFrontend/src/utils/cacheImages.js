import { resolveImageUrl, resolveOfferImage, resolveProductImage, resolveStoreCover, resolveStoreLogo } from './mediaUrl';

const warmed = new Set();

/** Preload a small set of hero/thumbnail images from cached payloads (non-blocking). */
export function warmImageUrls(urls, { width = 320 } = {}) {
  if (typeof window === 'undefined') return;

  urls.filter(Boolean).slice(0, 8).forEach((raw) => {
    const src = resolveImageUrl(raw, { width });
    if (!src || warmed.has(src)) return;
    warmed.add(src);
    const img = new Image();
    img.decoding = 'async';
    img.loading = 'lazy';
    img.src = src;
  });
}

export function warmOfferReelImages(reels = []) {
  const urls = reels.flatMap((reel) => {
    const first = reel?.offers?.[0] || reel?.products?.[0];
    if (!first) return [];
    if (first.image || first.images?.[0]) {
      return [resolveOfferImage(first) || resolveProductImage(first)];
    }
    return [];
  });
  warmImageUrls(urls);
}

export function warmStoreDetailImages(data) {
  if (!data?.store) return;
  const urls = [];
  const cover = resolveStoreCover(data.store, { width: 800 });
  const logo = resolveStoreLogo(data.store, { width: 160 });
  if (cover) urls.push(cover);
  if (logo) urls.push(logo);
  for (const offer of (data.offers || []).slice(0, 12)) {
    urls.push(resolveOfferImage(offer));
  }
  for (const product of (data.products || []).slice(0, 12)) {
    urls.push(resolveProductImage(product));
  }
  warmImageUrls(urls.filter(Boolean), { width: 400 });
}

export function warmStoreBrowseImages(data) {
  const groups = data?.parentGroups?.length ? data.parentGroups : data?.groups || [];
  const urls = [];
  for (const group of groups.slice(0, 3)) {
    for (const section of (group.sections || []).slice(0, 2)) {
      for (const store of (section.stores || []).slice(0, 4)) {
        if (store?.logo) urls.push(store.logo);
        if (store?.cover) urls.push(store.cover);
      }
    }
  }
  warmImageUrls(urls, { width: 240 });
}
