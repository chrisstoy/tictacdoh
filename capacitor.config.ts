import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chrisstoy.tictacdoh',
  appName: 'Tic-Tac-Doh',
  webDir: 'dist',
  // WebView background shown before the page paints. Default is white, which flashes after the splash.
  backgroundColor: '#fdde97',
  plugins: {
    SplashScreen: {
      backgroundColor: '#fdde97',
    },
    StatusBar: {
      backgroundColor: '#fdde97',
      // LIGHT is dark status-bar content (dark icons on the yellow background).
      style: 'LIGHT',
      overlaysWebView: true,
    },
  },
};

export default config;
