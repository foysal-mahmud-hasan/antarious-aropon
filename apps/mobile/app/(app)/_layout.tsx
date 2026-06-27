import { Ionicons } from '@expo/vector-icons';
import { Redirect, Slot, useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AdaptiveShell, Heading, palette, type NavItem } from '@aropon/ui';
import { useAuth } from '../../lib/auth';

export default function AppLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const hydrated = useAuth((s) => s.hydrated);
  const userId = useAuth((s) => s.userId);

  // Guard: an unauthenticated visit to any in-app route bounces to sign-in.
  if (hydrated && !userId) return <Redirect href="/sign-in" />;

  const navItems: NavItem[] = [
    { key: '/finance', label: t('nav.finance'), icon: icon('wallet-outline') },
    { key: '/orders', label: t('nav.orders'), icon: icon('cube-outline') },
    { key: '/inbox', label: t('nav.inbox'), icon: icon('chatbubbles-outline') },
    { key: '/calendar', label: t('nav.calendar'), icon: icon('calendar-outline') },
    { key: '/settings', label: t('nav.settings'), icon: icon('settings-outline') },
  ];

  const active = navItems.find((n) => pathname.startsWith(n.key))?.key ?? '/finance';

  return (
    <AdaptiveShell
      navItems={navItems}
      activeKey={active}
      onNavigate={(key) => router.push(key as never)}
      header={
        <Heading paddingVertical="$sm" paddingHorizontal="$md">
          {t('common.appName')}
        </Heading>
      }
    >
      <Slot />
    </AdaptiveShell>
  );
}

function icon(name: keyof typeof Ionicons.glyphMap) {
  return <Ionicons name={name} size={22} color={palette.textSecondary} />;
}
