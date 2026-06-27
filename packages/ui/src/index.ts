// Config + tokens
export { config, type AppConfig } from '../tamagui.config';
export * from './tokens';

// Provider
export { UIProvider, type UIProviderProps } from './provider';

// Primitives — Stack/Text/etc. from core, XStack/YStack defined locally
export { Stack, Text, Theme, useMedia, useTheme, styled } from '@tamagui/core';
export { XStack, YStack } from './primitives';

// Components
export { Button, type ButtonProps } from './components/Button';
export { Card } from './components/Card';
export { Heading, Body, Caption } from './components/Typography';
export { TierGate, type TierGateProps } from './components/TierGate';
export { AdaptiveShell, type NavItem, type AdaptiveShellProps } from './AdaptiveShell';
