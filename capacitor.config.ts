import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chrisstoy.tictacdoh',
  appName: 'Tic-Tac-Doh',
  webDir: 'dist',
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
