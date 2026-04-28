import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Manifest handled dynamically per-route via useManifest hook.
      // This plugin generates the service worker and caches the app shell.
      manifest: false,
      workbox: {
        // Cache the app shell and all static assets
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // Also pre-cache all manifests so PWA installs work offline
        additionalManifestEntries: [
          { url: '/manifest.json', revision: null },
          { url: '/manifest-pos.json', revision: null },
          { url: '/manifest-ims.json', revision: null },
        ],
        // Navigation fallback — essential for SPA + PWA
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/manifest.*\.json$/],
      },
    }),
  ],
})
