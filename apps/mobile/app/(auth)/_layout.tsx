import { Slot } from 'expo-router';
import { YStack } from '@aropon/ui';

/**
 * Auth screens are centered in a narrow max-width column so they don't sprawl edge-to-edge
 * on desktop/web (web-optimized, not a stretched phone form). On phone it's full-width with padding.
 */
export default function AuthLayout() {
  return (
    <YStack flex={1} backgroundColor="$background" alignItems="center" justifyContent="center" padding="$lg">
      <YStack width="100%" maxWidth={440} gap="$lg">
        <Slot />
      </YStack>
    </YStack>
  );
}
