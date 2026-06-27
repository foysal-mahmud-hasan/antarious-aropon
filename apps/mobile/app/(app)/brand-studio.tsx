import { useTranslation } from 'react-i18next';
import { hasEntitlement, resolveEntitlements } from '@aropon/core';
import { Body, Button, Card, Heading, TierGate, YStack } from '@aropon/ui';

export default function BrandStudioScreen() {
  const { t } = useTranslation();
  const ent = resolveEntitlements('t0', 'active'); // T0 includes Brand Studio AI

  return (
    <YStack gap="$lg">
      <Heading>{t('nav.brandStudio')}</Heading>
      <TierGate allowed={hasEntitlement(ent, 'brand.ai_caption')} fallback={<Body>{t('gate.locked')}</Body>}>
        <Card gap="$md">
          <Body>AI Logo · AI Caption · AI Copywriting</Body>
          <Button label="Generate" variant="primary" />
        </Card>
      </TierGate>
    </YStack>
  );
}
