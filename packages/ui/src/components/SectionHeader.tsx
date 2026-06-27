import type { ReactNode } from 'react';
import { XStack } from '../primitives';
import { Heading } from './Typography';

export interface SectionHeaderProps {
  title: string;
  /** Optional trailing slot (e.g. a "See all" action). */
  action?: ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <XStack alignItems="center" justifyContent="space-between" paddingVertical="$sm">
      <Heading fontSize="$5">{title}</Heading>
      {action}
    </XStack>
  );
}
