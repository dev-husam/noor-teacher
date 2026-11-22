import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isArtifact = loadEnv(mode, '.', 'VITE_').VITE_ARTIFACT === '1';
  return {
    // Relative asset paths so the build works at any sub-path (e.g. GitHub Pages /noor-teacher/).
    base: './',
    plugins: [
      react(),
      // The claude.ai artifact build is a single sandboxed page: no service worker there.
      !isArtifact &&
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: false, // registered in src/lib/pwa.ts (auto-reloads on new deploys)
          includeAssets: ['logo.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
          manifest: {
            id: './',
            name: 'نور المعلّم',
            short_name: 'نور',
            description: 'المعلّم الإسلامي الذكي — إدارة صفوف التربية الإسلامية وحلقات القرآن للأطفال',
            lang: 'ar',
            dir: 'rtl',
            start_url: './',
            scope: './',
            display: 'standalone',
            orientation: 'any',
            background_color: '#F6F8F4',
            theme_color: '#0FA968',
            categories: ['education', 'kids'],
            icons: [
              { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
              { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
              { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
              { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            ],
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
            navigateFallback: 'index.html',
            cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: { cacheName: 'google-fonts-css' },
              },
              {
                urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-files',
                  expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
                  cacheableResponse: { statuses: [0, 200] },
                },
              },
            ],
          },
        }),
    ],
    server: { port: 5180 },
  };
});
