import '../lib/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UIProvider } from '@aropon/ui';
import { queryClient } from '../lib/query';
import { initObservability } from '../lib/observability';

initObservability();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <UIProvider defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </QueryClientProvider>
      </UIProvider>
    </SafeAreaProvider>
  );
}
