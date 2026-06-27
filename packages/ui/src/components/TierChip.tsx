import { Text } from '@tamagui/core';
import { XStack } from '../primitives';

/** The crown tier pill (e.g. "টায়ার ১ — সোশ্যাল কমার্স"). */
export function TierChip({ label, emoji = '👑' }: { label: string; emoji?: string }) {
  return (
    <XStack
      alignSelf="flex-start"
      alignItems="center"
      gap="$xs"
      backgroundColor="$chip"
      paddingHorizontal="$base"
      paddingVertical={7}
      borderRadius="$full"
      marginBottom="$sm"
    >
      <Text fontSize={13}>{emoji}</Text>
      <Text fontFamily="$body" fontWeight="700" fontSize="$2" color="$chipInk">
        {label}
      </Text>
    </XStack>
  );
}
