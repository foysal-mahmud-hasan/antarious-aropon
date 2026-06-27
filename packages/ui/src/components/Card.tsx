import { styled, Stack } from '@tamagui/core';

export const Card = styled(Stack, {
  name: 'Card',
  backgroundColor: '$backgroundStrong',
  borderRadius: '$lg',
  borderWidth: 1,
  borderColor: '$borderColor',
  padding: '$lg',
  gap: '$sm',
  shadowColor: '$shadowColor',
  shadowOpacity: 0.12,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
});
