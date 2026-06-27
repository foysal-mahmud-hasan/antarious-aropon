import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { formatBDT, formatDate } from '@aropon/i18n';
import {
  Body,
  Button,
  Caption,
  Card,
  Chip,
  EmptyState,
  Heading,
  SectionHeader,
  XStack,
  YStack,
} from '@aropon/ui';
import { api } from '../../lib/trpc';
import { useAuth } from '../../lib/auth';

type CalEvent = {
  date: string;
  kind: 'order' | 'income' | 'expense';
  title: string;
  amount: string;
};

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export default function CalendarScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const orgId = useAuth((s) => s.orgId)!;
  const locale = useAuth((s) => s.locale);
  const [view, setView] = useState<'day' | 'week'>('day');

  const orgQ = useQuery({ queryKey: ['org', orgId], queryFn: () => api.org.current.query() });
  const allowed = orgQ.data?.entitlements['calendar.daily_weekly'] ?? false;

  const ordersQ = useQuery({
    queryKey: ['orders', orgId],
    queryFn: () => api.orders.list.query({ orgId }),
    enabled: allowed,
  });
  const txnsQ = useQuery({
    queryKey: ['txns', orgId],
    queryFn: () => api.finance.list.query({ orgId, limit: 100 }),
    enabled: allowed,
  });

  const grouped = useMemo(() => {
    const events: CalEvent[] = [];
    for (const o of ordersQ.data ?? []) {
      events.push({
        date: o.createdAt,
        kind: 'order',
        title: `অর্ডার · ${o.customerName || 'গ্রাহক'}`,
        amount: formatBDT(o.totalPoisha, locale),
      });
    }
    for (const tx of txnsQ.data ?? []) {
      events.push({
        date: tx.occurredAt,
        kind: tx.type,
        title: tx.category,
        amount: `${tx.type === 'income' ? '+' : '−'}${formatBDT(tx.amountPoisha, locale)}`,
      });
    }

    const now = new Date();
    const start = new Date(now);
    if (view === 'day') start.setHours(0, 0, 0, 0);
    else start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const inRange = events.filter((e) => new Date(e.date).getTime() >= start.getTime());
    inRange.sort((a, b) => b.date.localeCompare(a.date));

    const byDay = new Map<string, CalEvent[]>();
    for (const e of inRange) {
      const k = dayKey(e.date);
      const arr = byDay.get(k) ?? [];
      arr.push(e);
      byDay.set(k, arr);
    }
    return [...byDay.entries()];
  }, [ordersQ.data, txnsQ.data, view, locale]);

  if (orgQ.isLoading) {
    return (
      <YStack padding="$lg">
        <Caption>{t('common.loading')}</Caption>
      </YStack>
    );
  }

  if (!allowed) {
    return (
      <YStack flex={1} gap="$md">
        <SectionHeader title={t('nav.calendar')} />
        <EmptyState
          title={t('gate.locked')}
          subtitle={t('tier.t1')}
          action={<Button label={t('gate.upgrade')} variant="primary" onPress={() => router.push('/settings')} />}
        />
      </YStack>
    );
  }

  return (
    <YStack flex={1} gap="$md">
      <SectionHeader title={t('nav.calendar')} />
      <XStack gap="$sm">
        <Chip label="আজ" active={view === 'day'} onPress={() => setView('day')} />
        <Chip label="সপ্তাহ" active={view === 'week'} onPress={() => setView('week')} />
      </XStack>

      {grouped.length === 0 ? (
        <Caption>এই সময়ে কোনো কার্যকলাপ নেই</Caption>
      ) : (
        grouped.map(([day, events]) => (
          <YStack key={day} gap="$sm">
            <Heading fontSize="$4">{formatDate(`${day}T00:00:00.000Z`, locale)}</Heading>
            {events.map((e, i) => (
              <Card key={`${day}-${i}`} paddingVertical="$md">
                <XStack justifyContent="space-between" alignItems="center" gap="$md">
                  <Body flex={1}>{e.title}</Body>
                  <Body
                    fontWeight="600"
                    color={e.kind === 'income' ? '$income' : e.kind === 'expense' ? '$expense' : '$color'}
                  >
                    {e.amount}
                  </Body>
                </XStack>
              </Card>
            ))}
          </YStack>
        ))
      )}
    </YStack>
  );
}
