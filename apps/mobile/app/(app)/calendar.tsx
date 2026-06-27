import { useTranslation } from 'react-i18next';
import { hasEntitlement, resolveEntitlements } from '@aropon/core';
import { Button, EmptyState, SectionHeader, TierGate, YStack } from '@aropon/ui';

export default function CalendarScreen() {
  const { t } = useTranslation();
  const ent = resolveEntitlements('t0', 'active'); // demo T0 → calendar is a T1 feature → locked

  return (
    <YStack flex={1} gap="$md">
      <SectionHeader title={t('nav.calendar')} />
      <TierGate
        allowed={hasEntitlement(ent, 'calendar.daily_weekly')}
        fallback={
          <EmptyState
            title={t('gate.locked')}
            subtitle={t('tier.t1')}
            action={<Button label={t('gate.upgrade')} variant="primary" />}
          />
        }
      >
        {/* Daily/weekly calendar lands in M2. */}
        <EmptyState title={t('nav.calendar')} subtitle="—" />
      </TierGate>
    </YStack>
  );
}
