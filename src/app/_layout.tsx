import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [loaded, error] = useFonts({
    // TODO - add fonts here
    // Oravetica: require('@/assets/fonts/Oravetica Font/OraveticaNormal-ap5g.ttf'),
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
      <SafeAreaView className="flex-1 bg-dough-200">
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
