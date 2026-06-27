import type { ReactNode } from 'react';
import { YStack } from '../primitives';
import { Body, Heading } from './Typography';

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  /** Optional illustration/icon slot (app supplies the icon library). */
  icon?: ReactNode;
  /** Optional action slot (e.g. a Button). */
  action?: ReactNode;
}

export function EmptyState({ title, subtitle, icon, action }: EmptyStateProps) {
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$md" padding="$xl">
      {icon}
      <YStack alignItems="center" gap="$xs">
        <Heading fontSize="$5">{title}</Heading>
        {subtitle ? <Body color="$colorSecondary">{subtitle}</Body> : null}
      </YStack>
      {action}
    </YStack>
  );
}
