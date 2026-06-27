import { Stack, styled } from '@tamagui/core';

/** Column/row flex stacks (the `tamagui` umbrella ships these; we define them on core directly). */
export const YStack = styled(Stack, { name: 'YStack', flexDirection: 'column' });
export const XStack = styled(Stack, { name: 'XStack', flexDirection: 'row' });
