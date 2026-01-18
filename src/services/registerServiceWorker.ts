/**
 * Registers the service worker for PWA functionality.
 * Only runs on web platform with service worker support.
 */
export async function registerServiceWorker(): Promise<void> {
  // SSR safety check - only run in browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Check for service worker support
  if (!('serviceWorker' in navigator)) {
    console.log('Service workers are not supported');
    return;
  }

  try {
    // Determine base path from current location
    // On GitHub Pages, the app runs at /tictacdoh/
    // Locally, it runs at /
    const basePath = window.location.pathname.startsWith('/tictacdoh')
      ? '/tictacdoh/'
      : '/';

    const swUrl = `${basePath}sw.js`;

    const registration = await navigator.serviceWorker.register(swUrl, {
      scope: basePath,
    });

    console.log('Service Worker registered with scope:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New content available; please refresh.');
          }
        });
      }
    });
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
}
