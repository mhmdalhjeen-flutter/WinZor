import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
