import { useTranslation } from 'react-i18next';
import { hasEntitlement, resolveEntitlements } from '@aropon/core';
import { Body, Caption, Card, Heading, TierGate, YStack } from '@aropon/ui';

export default function InboxScreen() {
  const { t } = useTranslation();
  const ent = resolveEntitlements('t0', 'active'); // demo T0 → inbox is locked (T1 feature)

  return (
    <YStack gap="$lg">
      <Heading>{t('nav.inbox')}</Heading>
      <TierGate
        allowed={hasEntitlement(ent, 'social.inbox')}
        fallback={
          <Card backgroundColor="$backgroundPress">
            <Caption>{t('gate.locked')}</Caption>
            <Body>{t('gate.upgrade')} → {t('tier.t1')}</Body>
          </Card>
        }
      >
        <Body>Unified FB/IG inbox…</Body>
      </TierGate>
    </YStack>
  );
}
