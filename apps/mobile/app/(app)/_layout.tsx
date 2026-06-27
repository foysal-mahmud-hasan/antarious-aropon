import { Redirect, Slot, useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AdaptiveShell, Heading, Text, type NavItem } from '@aropon/ui';
import { useAuth } from '../../lib/auth';

export default function AppLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const hydrated = useAuth((s) => s.hydrated);
  const userId = useAuth((s) => s.userId);

  if (hydrated && !userId) return <Redirect href="/sign-in" />;

  const navItems: NavItem[] = [
    { key: '/finance', label: t('nav.finance'), icon: emoji('📒') },
    { key: '/orders', label: t('nav.orders'), icon: emoji('📦') },
    { key: '/inbox', label: t('nav.inbox'), icon: emoji('💬') },
    { key: '/calendar', label: t('nav.calendar'), icon: emoji('📅') },
    { key: '/settings', label: t('nav.settings'), icon: emoji('⚙️') },
  ];

  const active = navItems.find((n) => pathname.startsWith(n.key))?.key ?? '/finance';

  return (
    <AdaptiveShell
      navItems={navItems}
      activeKey={active}
      onNavigate={(key) => router.push(key as never)}
      header={
        <Heading paddingVertical="$sm" paddingHorizontal="$md" color="$primary">
          আরোপন
        </Heading>
      }
    >
      <Slot />
    </AdaptiveShell>
  );
}

function emoji(e: string) {
  return <Text fontSize={20}>{e}</Text>;
}
