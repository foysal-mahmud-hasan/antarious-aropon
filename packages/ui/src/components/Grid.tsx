import { Children, type ReactNode } from 'react';
import { Stack } from '@tamagui/core';
import { XStack } from '../primitives';

export interface GridProps {
  children: ReactNode;
  /** Minimum width per item; the grid fits as many columns as the available width allows. */
  minItemWidth?: number;
}

/**
 * Fluid, device-agnostic grid. Items are at least `minItemWidth` wide and grow to fill the row,
 * wrapping as space runs out — so a small phone shows 1 column, a large phone (e.g. Pixel 9 Pro XL)
 * 2, a tablet 2–3, and desktop 3–4, all from the available width (no hardcoded device breakpoints).
 */
export function Grid({ children, minItemWidth = 260 }: GridProps) {
  return (
    <XStack flexWrap="wrap" gap="$md">
      {Children.map(children, (child, i) => (
        <Stack key={i} flexGrow={1} flexBasis={minItemWidth} minWidth={minItemWidth} maxWidth="100%">
          {child}
        </Stack>
      ))}
    </XStack>
  );
}
