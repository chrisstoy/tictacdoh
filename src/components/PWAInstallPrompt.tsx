import { useEffect, useState, useCallback } from 'react';
import { Platform, Text, View, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const INSTALL_PROMPT_DISMISSED_KEY = '@tic-tac-doh/install-prompt-dismissed';
const PROMPT_DELAY_MS = 30000; // 30 seconds

// Type for the beforeinstallprompt event (Chrome-specific)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * PWA Install Prompt component that shows a custom install prompt
 * after the user has engaged with the app for 30 seconds.
 * Only renders on web platform with beforeinstallprompt support.
 */
export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if prompt was previously dismissed
  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== 'web') {
      return;
    }

    // SSR safety check
    if (typeof window === 'undefined') {
      return;
    }

    const checkDismissed = async () => {
      try {
        const wasDismissed = await AsyncStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY);
        if (wasDismissed === 'true') {
          setDismissed(true);
        }
      } catch (error) {
        console.error('Failed to check install prompt dismissed state:', error);
      }
    };

    checkDismissed();
  }, []);

  // Listen for beforeinstallprompt event
  useEffect(() => {
    // Only run on web platform
    if (Platform.OS !== 'web') {
      return;
    }

    // SSR safety check
    if (typeof window === 'undefined') {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle app installed event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowPrompt(false);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Show prompt after delay
  useEffect(() => {
    if (!deferredPrompt || dismissed) {
      return;
    }

    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, PROMPT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [deferredPrompt, dismissed]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the native install prompt
    await deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(async () => {
    setShowPrompt(false);
    setDismissed(true);

    try {
      await AsyncStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
    } catch (error) {
      console.error('Failed to save install prompt dismissed state:', error);
    }
  }, []);

  // Don't render if not on web, no prompt available, or was dismissed
  if (Platform.OS !== 'web' || !showPrompt || dismissed) {
    return null;
  }

  return (
    <View className="absolute bottom-4 left-4 right-4 bg-background border-4 border-border rounded-2xl p-4 shadow-lg">
      <Text className="ui-text text-xl text-center mb-4">Install Tic-Tac-Doh</Text>
      <Text className="text-text text-center mb-4">
        Add to your home screen for quick access and offline play!
      </Text>
      <View className="flex-row justify-center gap-4">
        <Pressable
          className="bg-highlight px-6 py-3 rounded-xl border-2 border-border"
          onPress={handleInstall}
          accessibilityRole="button"
          accessibilityLabel="Install Tic-Tac-Doh"
        >
          <Text className="ui-text text-lg text-background">Install</Text>
        </Pressable>
        <Pressable
          className="bg-background px-6 py-3 rounded-xl border-2 border-border"
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Not Now"
        >
          <Text className="ui-text text-lg text-text">Not Now</Text>
        </Pressable>
      </View>
    </View>
  );
}
