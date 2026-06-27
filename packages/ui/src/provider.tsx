import type { ReactNode } from 'react';
import { TamaguiProvider } from '@tamagui/core';
import config from '../tamagui.config';

export interface UIProviderProps {
  children: ReactNode;
  defaultTheme?: 'light' | 'dark';
}

/** Wrap the app once at the root. Supplies tokens, themes, and responsive media. */
export function UIProvider({ children, defaultTheme = 'light' }: UIProviderProps) {
  return (
    <TamaguiProvider config={config} defaultTheme={defaultTheme}>
      {children}
    </TamaguiProvider>
  );
}
