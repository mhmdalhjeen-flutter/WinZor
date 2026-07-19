import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: [
        'brand/**/*',
        'fonts/**/*',
        'robots.txt',
        'og-image.webp',
      ],
      manifest: {
        id: '/',
        name: 'Win Gold | عروض، نقاط وجوائز',
        short_name: 'Win Gold',
        description:
          'تسوّق من متاجر موثوقة، اجمع نقاطاً، شارك في المسابقات واكتشف عروض يومية وجوائز حقيقية.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'ar',
        dir: 'rtl',
        categories: ['shopping', 'lifestyle'],
        shortcuts: [
          {
            name: 'إدخال الكود',
            short_name: 'الكود',
            description: 'افتح شاشة إدخال الكود مباشرة',
            url: '/?pwaAction=code',
            icons: [{ src: '/brand/logo-64.webp', sizes: '64x64', type: 'image/webp' }],
          },
          {
            name: 'السوق العام',
            short_name: 'السوق',
            description: 'تصفّح السوق العام',
            url: '/marketplace',
            icons: [{ src: '/brand/logo-64.webp', sizes: '64x64', type: 'image/webp' }],
          },
          {
            name: 'المتاجر',
            short_name: 'المتاجر',
            description: 'استكشف المتاجر',
            url: '/explore',
            icons: [{ src: '/brand/logo-64.webp', sizes: '64x64', type: 'image/webp' }],
          },
          {
            name: 'مسابقاتي',
            short_name: 'مسابقات',
            description: 'مسابقاتي ومشاركاتي',
            url: '/competitions',
            icons: [{ src: '/brand/logo-64.webp', sizes: '64x64', type: 'image/webp' }],
          },
        ],
        icons: [
          {
            src: '/brand/logo-64.webp',
            sizes: '64x64',
            type: 'image/webp',
            purpose: 'any',
          },
          {
            src: '/brand/logo-128.webp',
            sizes: '128x128',
            type: 'image/webp',
            purpose: 'any',
          },
          {
            src: '/brand/logo-192.webp',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'any',
          },
          {
            src: '/brand/logo-256.webp',
            sizes: '256x256',
            type: 'image/webp',
            purpose: 'any',
          },
          {
            src: '/brand/logo-384.webp',
            sizes: '384x384',
            type: 'image/webp',
            purpose: 'any',
          },
          {
            src: '/brand/logo-512.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any',
          },
          {
            src: '/brand/logo-192-maskable.webp',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'maskable',
          },
          {
            src: '/brand/logo-512-maskable.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'maskable',
          },
          {
            src: '/brand/logo-64.png',
            sizes: '64x64',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,svg,ico,woff,woff2,txt}'],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: true,
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\.(webp|png|svg|ico|woff2?)$/i.test(url.pathname),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'winzor-static-assets',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'winzor-cloudinary-images',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Logic must be inlined — vite-plugin-pwa does not emit external helpers into sw.js
            urlPattern: ({ url, request }) => {
              if (request.method !== 'GET') return false
              const host = url.hostname
              if (host !== 'winzor.onrender.com' && host !== 'localhost' && host !== '127.0.0.1') {
                return false
              }
              const path = url.pathname
              return (
                /^\/api\/offers\/reels/.test(path)
                || /^\/api\/categories\/tree/.test(path)
                || /^\/api\/regions(\/?|$)/.test(path)
                || /^\/api\/stores\/browse/.test(path)
                || /^\/api\/bazaar\/?$/.test(path)
                || /^\/api\/competitions(\/featured|\/?$)/.test(path)
              )
            },
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'winzor-api-readonly',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 6 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url, request }) => {
              if (request.method !== 'GET') return false
              const host = url.hostname
              if (host !== 'winzor.onrender.com' && host !== 'localhost' && host !== '127.0.0.1') {
                return false
              }
              return /\/api\/(offers|products|stores)\/[^/]+\/(image|logo|cover)(\/|\?|$)/i.test(
                url.pathname,
              )
            },
            handler: 'CacheFirst',
            options: {
              cacheName: 'winzor-api-media-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 14 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'winzor-viewed-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'winzor-pages',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    // يمنع Vite من التبديل إلى 5174 — يجب أن يطابق Authorized JavaScript origins في Google
    strictPort: true,
    // Match production _headers: GIS popup must postMessage back to opener after account select.
    // https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid#cross_origin_opener_policy
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    modulePreload: {
      // Avoid preloading every async chunk on Home — only the entry graph
      resolveDependencies: (_filename, deps) =>
        deps.filter((d) => !/vendor-(swiper|motion)|html5-qrcode|HorizontalSwipe|PointsBalance|Verification|OfferReel|FloatingCode/i.test(d)),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router')) {
            return 'vendor-react';
          }
          if (id.includes('@tanstack')) return 'vendor-query';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('axios')) return 'vendor-axios';
          if (id.includes('swiper')) return 'vendor-swiper';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('html5-qrcode')) return 'vendor-qr';
          return undefined;
        },
      },
    },
  },
})
