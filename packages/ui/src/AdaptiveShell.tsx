import type { ReactNode } from 'react';
import { Stack, Text, useMedia } from '@tamagui/core';
import { XStack, YStack } from './primitives';

export interface NavItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

export interface AdaptiveShellProps {
  navItems: NavItem[];
  activeKey: string;
  onNavigate: (key: string) => void;
  /** Branding/org-switcher slot shown at the top of the sidebar / header. */
  header?: ReactNode;
  children: ReactNode;
}

/**
 * The M0 acceptance primitive: ONE component, two layouts driven by REAL CSS media queries.
 * - Phone (`< lg`): content + a bottom tab bar.
 * - Tablet/desktop (`>= lg`, 900px): persistent left sidebar + max-width (1200px) content.
 * A stretched phone UI on desktop is a bug — this is what prevents it.
 */
export function AdaptiveShell({
  navItems,
  activeKey,
  onNavigate,
  header,
  children,
}: AdaptiveShellProps) {
  const media = useMedia();
  const wide = media.lg; // >= 900px

  const content = (
    <YStack flex={1} width="100%" maxWidth={wide ? 1200 : undefined} alignSelf="center" padding="$lg">
      {children}
    </YStack>
  );

  if (wide) {
    return (
      <XStack flex={1} backgroundColor="$background">
        <YStack
          width={260}
          backgroundColor="$backgroundStrong"
          borderRightWidth={1}
          borderColor="$borderColor"
          padding="$md"
          gap="$xs"
        >
          {header}
          {navItems.map((item) => (
            <NavRow
              key={item.key}
              item={item}
              active={item.key === activeKey}
              wide
              onPress={() => onNavigate(item.key)}
            />
          ))}
        </YStack>
        <YStack flex={1}>{content}</YStack>
      </XStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack flex={1}>{content}</YStack>
      <XStack
        height={64}
        backgroundColor="$backgroundStrong"
        borderTopWidth={1}
        borderColor="$borderColor"
      >
        {navItems.map((item) => (
          <NavRow
            key={item.key}
            item={item}
            active={item.key === activeKey}
            onPress={() => onNavigate(item.key)}
          />
        ))}
      </XStack>
    </YStack>
  );
}

function NavRow({
  item,
  active,
  wide,
  onPress,
}: {
  item: NavItem;
  active: boolean;
  wide?: boolean;
  onPress: () => void;
}) {
  return (
    <Stack
      role="button"
      onPress={onPress}
      flex={wide ? undefined : 1}
      flexDirection={wide ? 'row' : 'column'}
      alignItems="center"
      justifyContent="center"
      gap={wide ? '$sm' : 0}
      paddingVertical="$sm"
      paddingHorizontal={wide ? '$md' : 0}
      borderRadius={wide ? '$md' : 0}
      cursor="pointer"
      backgroundColor={active && wide ? '$backgroundPress' : 'transparent'}
      hoverStyle={{ backgroundColor: '$backgroundPress' }}
    >
      {item.icon}
      <Text
        fontFamily="$body"
        fontSize={wide ? '$4' : '$1'}
        fontWeight={active ? '600' : '400'}
        color={active ? '$primary' : '$colorSecondary'}
      >
        {item.label}
      </Text>
    </Stack>
  );
}
