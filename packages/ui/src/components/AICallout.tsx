import { Stack, Text } from '@tamagui/core';
import { XStack } from '../primitives';

export interface AICalloutProps {
  title: string;
  body: string;
  badge?: string;
}

/** Left-accent insight block with a badge (used for tips / AI insights). */
export function AICallout({ title, body, badge = 'AI' }: AICalloutProps) {
  return (
    <Stack
      backgroundColor="$aiBg"
      borderLeftWidth={4}
      borderLeftColor="$ai"
      borderRadius="$lg"
      padding="$base"
      marginBottom="$base"
    >
      <XStack alignItems="center" gap="$sm" marginBottom="$xs">
        <Stack backgroundColor="$ai" paddingHorizontal="$sm" paddingVertical={3} borderRadius="$full">
          <Text fontFamily="$body" fontSize={10} fontWeight="800" color="#ffffff">
            {badge}
          </Text>
        </Stack>
        <Text fontFamily="$body" fontWeight="800" fontSize="$3" color="$color">
          {title}
        </Text>
      </XStack>
      <Text fontFamily="$body" fontSize="$3" color="$color" opacity={0.92} lineHeight={20}>
        {body}
      </Text>
    </Stack>
  );
}
