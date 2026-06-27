import '../lib/i18n';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  HindSiliguri_300Light,
  HindSiliguri_400Regular,
  HindSiliguri_500Medium,
  HindSiliguri_600SemiBold,
  HindSiliguri_700Bold,
} from '@expo-google-fonts/hind-siliguri';
import { ConfettiHost, UIProvider } from '@aropon/ui';
import { queryClient } from '../lib/query';
import { useAuth } from '../lib/auth';
import { initObservability } from '../lib/observability';

initObservability();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    HindSiliguri_300Light,
    HindSiliguri_400Regular,
    HindSiliguri_500Medium,
    HindSiliguri_600SemiBold,
    HindSiliguri_700Bold,
  });

  // Rehydrate the persisted session once on boot.
  useEffect(() => {
    void useAuth.getState().hydrate();
  }, []);

  // Hold render until the Bengali font is ready, to avoid a flash of fallback text.
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <UIProvider defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
          <ConfettiHost />
        </QueryClientProvider>
      </UIProvider>
    </SafeAreaProvider>
  );
}
