import { Slot, useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AdaptiveShell, Heading, type NavItem } from '@aropon/ui';

export default function AppLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const navItems: NavItem[] = [
    { key: '/finance', label: t('nav.finance') },
    { key: '/inbox', label: t('nav.inbox') },
    { key: '/brand-studio', label: t('nav.brandStudio') },
    { key: '/settings', label: t('nav.settings') },
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
