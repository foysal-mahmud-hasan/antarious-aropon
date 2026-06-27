import { useTranslation } from 'react-i18next';
import { hasEntitlement, resolveEntitlements, summarize } from '@aropon/core';
import { formatBDT } from '@aropon/i18n';
import { Body, Caption, Card, Heading, TierGate, XStack, YStack } from '@aropon/ui';
import { useAuth } from '../../lib/auth';

// Demo data — replaced by the local SQLite ledger in M1.
const DEMO_LEDGER = [
  { type: 'income' as const, amountPoisha: 520000 },
  { type: 'expense' as const, amountPoisha: 145000 },
  { type: 'income' as const, amountPoisha: 90000 },
];

export default function FinanceScreen() {
  const { t } = useTranslation();
  const locale = useAuth((s) => s.locale);
  // Demo org on T0 — entitlements resolved by the real engine.
  const ent = resolveEntitlements('t0', 'active');
  const sum = summarize(DEMO_LEDGER);

  return (
    <YStack gap="$lg">
      <Heading>{t('nav.finance')}</Heading>

      <TierGate
        allowed={hasEntitlement(ent, 'finance.bookkeeping')}
        fallback={<Caption>{t('gate.locked')}</Caption>}
      >
        <XStack gap="$md" flexWrap="wrap">
          <Metric label={t('finance.income')} value={formatBDT(sum.incomePoisha, locale)} tone="income" />
          <Metric label={t('finance.expense')} value={formatBDT(sum.expensePoisha, locale)} tone="expense" />
          <Metric label={t('finance.profit')} value={formatBDT(sum.profitPoisha, locale)} tone="default" />
        </XStack>
      </TierGate>

      <Card>
        <Caption>finance.insights (T1+)</Caption>
        <TierGate
          allowed={hasEntitlement(ent, 'finance.insights')}
          fallback={<Body>{t('gate.locked')}</Body>}
        >
          <Body>AI insight…</Body>
        </TierGate>
      </Card>
    </YStack>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'income' | 'expense' | 'default';
}) {
  const color = tone === 'income' ? '$income' : tone === 'expense' ? '$expense' : '$color';
  return (
    <Card flex={1} minWidth={140}>
      <Caption>{label}</Caption>
      <Heading color={color} fontSize="$7">
        {value}
      </Heading>
    </Card>
  );
}
