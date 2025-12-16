import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Slot } from 'expo-router';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-dough-200">
        <Slot />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
