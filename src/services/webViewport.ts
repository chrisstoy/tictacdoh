/**
 * Shared by the GitHub Pages export and the Capacitor bundle.
 * `viewport-fit=cover` lets `SafeAreaView` read notch, home-indicator, and
 * status-bar insets. Desktop insets stay zero, so the browser PWA is not padded twice.
 */
export const WEB_VIEWPORT_CONTENT =
  'width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover';
