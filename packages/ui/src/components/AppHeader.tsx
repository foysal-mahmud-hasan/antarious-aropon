import type { ReactNode } from 'react';
import { XStack, YStack } from '../primitives';
import { Caption, Heading } from './Typography';

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** Trailing slot (notifications, avatar, org switcher). */
  right?: ReactNode;
}

export function AppHeader({ title, subtitle, right }: AppHeaderProps) {
  return (
    <XStack alignItems="center" justifyContent="space-between" paddingVertical="$md">
      <YStack gap={2}>
        <Heading>{title}</Heading>
        {subtitle ? <Caption>{subtitle}</Caption> : null}
      </YStack>
      {right}
    </XStack>
  );
}
