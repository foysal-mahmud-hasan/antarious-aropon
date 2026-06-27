import { styled, Stack, Text } from '@tamagui/core';

const PillFrame = styled(Stack, {
  name: 'StatusPill',
  paddingHorizontal: '$sm',
  paddingVertical: 2,
  borderRadius: '$full',
  alignSelf: 'flex-start',
  variants: {
    tone: {
      success: { backgroundColor: '$income' },
      warning: { backgroundColor: '$warning' },
      error: { backgroundColor: '$expense' },
      info: { backgroundColor: '$secondary' },
      neutral: { backgroundColor: '$backgroundPress' },
    },
  } as const,
  defaultVariants: { tone: 'neutral' },
});

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusPillProps {
  label: string;
  tone?: StatusTone;
}

export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  return (
    <PillFrame tone={tone}>
      <Text
        fontFamily="$body"
        fontSize="$1"
        fontWeight="600"
        color={tone === 'neutral' ? '$color' : '$colorInverse'}
      >
        {label}
      </Text>
    </PillFrame>
  );
}
