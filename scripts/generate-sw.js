/**
 * Service Worker Generator
 *
 * Generates a service worker with Workbox for offline caching.
 * Must be run after expo export to generate precache manifest from dist/.
 *
 * Features:
 * - Precaches all static assets (HTML, CSS, JS)
 * - Excludes large audio files from precache (setup-music.mp3, game-setup-music.mp3)
 * - Runtime caching for images, audio, and fonts
 */

const { generateSW } = require('workbox-build');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');

// Determine base path from environment
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const BASE_PATH = isGitHubPages ? '/tictacdoh/' : '/';

async function buildServiceWorker() {
  console.log('Service Worker Generator');
  console.log('========================');
  console.log(`GITHUB_PAGES: ${isGitHubPages}`);
  console.log(`Base path: ${BASE_PATH}`);
  console.log(`Output: ${DIST_DIR}/sw.js`);
  console.log('');

  try {
    const { count, size, warnings } = await generateSW({
      swDest: path.join(DIST_DIR, 'sw.js'),
      globDirectory: DIST_DIR,

      // Precache all static assets except large audio files
      globPatterns: ['**/*.{html,css,js,json,ico,png,svg,woff,woff2,ttf}'],

      // Exclude large music files from precache (they'll be cached at runtime)
      globIgnores: [
        '**/setup-music*.mp3',
        '**/game-setup-music*.mp3',
        // Also ignore any very large files
        '**/*.map',
      ],

      // Navigation fallback for SPA
      navigateFallback: `${BASE_PATH}index.html`,
      navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],

      // Runtime caching strategies
      runtimeCaching: [
        // Cache images with cache-first strategy
        {
          urlPattern: /\.(?:png|jpg|jpeg|gif|svg|ico|webp)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
          },
        },
        // Cache audio files with cache-first strategy (for runtime loading)
        {
          urlPattern: /\.(?:mp3|wav|ogg|m4a)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'audio-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Cache fonts with cache-first strategy
        {
          urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'font-cache',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
            },
          },
        },
      ],

      // Clean up old caches
      cleanupOutdatedCaches: true,

      // Skip waiting to activate immediately
      skipWaiting: true,

      // Claim clients immediately
      clientsClaim: true,
    });

    if (warnings.length > 0) {
      console.log('Warnings:');
      warnings.forEach((warning) => console.log(`  - ${warning}`));
      console.log('');
    }

    console.log(`Generated service worker with ${count} files to precache.`);
    console.log(`Total precache size: ${(size / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    console.log('Runtime caching configured for:');
    console.log('  - Images (cache-first, 30 days)');
    console.log('  - Audio (cache-first, 30 days)');
    console.log('  - Fonts (cache-first, 1 year)');
    console.log('');
    console.log('Done!');
  } catch (error) {
    console.error('Error generating service worker:', error);
    process.exit(1);
  }
}

buildServiceWorker();
