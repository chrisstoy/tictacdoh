import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AudioServiceProvider } from '@/services/audioService';
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

  if (!loaded && !error) {
    return null;
  }

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
