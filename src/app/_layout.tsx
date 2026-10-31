import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AudioServiceProvider } from '@/services/audioService';
import { applyNativeStatusBar } from '@/services/nativeStatusBar';
import { registerServiceWorker } from '@/services/registerServiceWorker';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [loaded, error] = useFonts({
    // TODO - add fonts here
    Komigo: require('@/assets/fonts/komigo-font/Komigo3DRegular-rg1lK.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Register service worker for PWA support (web only)
  useEffect(() => {
    if (Platform.OS === 'web') {
      registerServiceWorker();
    }
  }, []);

  useEffect(() => {
    void applyNativeStatusBar();
  }, []);

  // Render before the font loads: the static export prerenders this tree, so a null
  // first client render breaks hydration (React error #418).
  return (
    <SafeAreaProvider>
      <AudioServiceProvider>
        <SafeAreaView className="flex-1 bg-background">
          <Slot />
        </SafeAreaView>
      </AudioServiceProvider>
    </SafeAreaProvider>
  );
}
