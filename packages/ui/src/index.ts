// Config + tokens
export { config, type AppConfig } from '../tamagui.config';
export * from './tokens';

// Provider
export { UIProvider, type UIProviderProps } from './provider';

// Primitives — Stack/Text/etc. from core, XStack/YStack defined locally
export { Stack, Text, Theme, useMedia, useTheme, styled } from '@tamagui/core';
export { XStack, YStack } from './primitives';

// Components
export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from './components/Button';
export { Card } from './components/Card';
export { Heading, Body, Caption } from './components/Typography';
export { HeroCard, type HeroCardProps, type HeroStat } from './components/HeroCard';
export { AICallout, type AICalloutProps } from './components/AICallout';
export { ToolGrid, type Tool } from './components/ToolGrid';
export { TierChip } from './components/TierChip';
export { ConfettiHost } from './components/ConfettiHost';
export { fireConfetti } from './confetti';
export { gradients } from './tokens';
export { Input, type InputProps } from './components/Input';
export { Chip, type ChipProps } from './components/Chip';
export { Badge, type BadgeProps } from './components/Badge';
export { StatusPill, type StatusPillProps, type StatusTone } from './components/StatusPill';
export { SectionHeader, type SectionHeaderProps } from './components/SectionHeader';
export { AppHeader, type AppHeaderProps } from './components/AppHeader';
export { EmptyState, type EmptyStateProps } from './components/EmptyState';
export { MetricCard, type MetricCardProps, type MetricTone } from './components/MetricCard';
export { Grid, type GridProps } from './components/Grid';
export { TierGate, type TierGateProps } from './components/TierGate';
export { AdaptiveShell, type NavItem, type AdaptiveShellProps } from './AdaptiveShell';
