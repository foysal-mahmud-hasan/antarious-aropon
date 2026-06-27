import { styled, Stack, Text } from '@tamagui/core';

const ChipFrame = styled(Stack, {
  name: 'ChipFrame',
  role: 'button',
  flexDirection: 'row',
  alignItems: 'center',
  gap: '$xs',
  paddingHorizontal: '$md',
  height: 36,
  justifyContent: 'center',
  borderRadius: '$full',
  backgroundColor: '$backgroundPress',
  cursor: 'pointer',
  pressStyle: { opacity: 0.85 },
  variants: {
    active: {
      true: { backgroundColor: '$primary' },
    },
  } as const,
});

export interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
}

export function Chip({ label, active, onPress }: ChipProps) {
  return (
    <ChipFrame active={active} onPress={onPress}>
      <Text
        fontFamily="$body"
        fontSize="$2"
        fontWeight="500"
        color={active ? '$colorInverse' : '$primary'}
      >
        {label}
      </Text>
    </ChipFrame>
  );
}
