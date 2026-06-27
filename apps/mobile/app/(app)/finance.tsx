import { useTranslation } from 'react-i18next';
import { hasEntitlement, resolveEntitlements, summarize } from '@aropon/core';
import { formatBDT } from '@aropon/i18n';
import { Caption, MetricCard, SectionHeader, TierGate, XStack, YStack } from '@aropon/ui';
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
    <YStack gap="$md">
      <SectionHeader title={t('nav.finance')} />
      <TierGate
        allowed={hasEntitlement(ent, 'finance.bookkeeping')}
        fallback={<Caption>{t('gate.locked')}</Caption>}
      >
        <XStack gap="$md" flexWrap="wrap">
          <MetricCard label={t('finance.income')} value={formatBDT(sum.incomePoisha, locale)} tone="income" />
          <MetricCard label={t('finance.expense')} value={formatBDT(sum.expensePoisha, locale)} tone="expense" />
          <MetricCard label={t('finance.profit')} value={formatBDT(sum.profitPoisha, locale)} tone="default" />
        </XStack>
      </TierGate>
      {/* NOTE: AI Finance Insights / Business Performance Suggestions are ON HOLD (deferred). */}
    </YStack>
  );
}
