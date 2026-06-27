import { Stack, Text } from '@tamagui/core';
import { XStack } from '../primitives';

export interface Tool {
  emoji: string;
  label: string;
  onPress?: () => void;
}

/** 3-up grid of emoji tool buttons (the studio's tool sections). */
export function ToolGrid({ tools }: { tools: Tool[] }) {
  return (
    <XStack flexWrap="wrap" gap="$md" marginBottom="$base">
      {tools.map((t, i) => (
        <ToolButton key={i} {...t} />
      ))}
    </XStack>
  );
}

function ToolButton({ emoji, label, onPress }: Tool) {
  return (
    <Stack
      onPress={onPress}
      flexBasis="30%"
      flexGrow={1}
      minWidth={92}
      backgroundColor="$backgroundStrong"
      borderRadius="$btn"
      paddingVertical="$base"
      paddingHorizontal="$sm"
      alignItems="center"
      gap="$xs"
      cursor="pointer"
      animation="quick"
      pressStyle={{ scale: 0.96 }}
      hoverStyle={{ y: -3 }}
      shadowColor="$shadowColor"
      shadowOpacity={0.1}
      shadowRadius={10}
      shadowOffset={{ width: 0, height: 4 }}
    >
      <Text fontSize={23}>{emoji}</Text>
      <Text fontFamily="$body" fontSize="$2" fontWeight="700" color="$color" textAlign="center">
        {label}
      </Text>
    </Stack>
  );
}
