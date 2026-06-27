import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CATEGORIES } from '@aropon/core';
import { formatBDT, formatDate } from '@aropon/i18n';
import {
  Body,
  Button,
  Caption,
  Card,
  Chip,
  HeroCard,
  Input,
  MetricCard,
  SectionHeader,
  XStack,
  YStack,
} from '@aropon/ui';
import { api } from '../../lib/trpc';
import { useAuth } from '../../lib/auth';
import { newId } from '../../lib/id';
import { TransactionRow } from '../../components/TransactionRow';

function monthRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
  };
}

export default function FinanceScreen() {
  const { t } = useTranslation();
  const orgId = useAuth((s) => s.orgId)!;
  const locale = useAuth((s) => s.locale);
  const qc = useQueryClient();

  const balanceQ = useQuery({
    queryKey: ['balance', orgId],
    queryFn: () => api.finance.balance.query({ orgId }),
  });
  const range = monthRange();
  const summaryQ = useQuery({
    queryKey: ['summary', orgId],
    queryFn: () => api.finance.summary.query({ orgId, from: range.from, to: range.to }),
  });
  const listQ = useQuery({
    queryKey: ['txns', orgId],
    queryFn: () => api.finance.list.query({ orgId, limit: 50 }),
  });

  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES.income[0]);
  const [note, setNote] = useState('');

  const add = useMutation({
    mutationFn: async () => {
      const poisha = Math.round(Number.parseFloat(amount || '0') * 100);
      if (!Number.isFinite(poisha) || poisha <= 0) throw new Error('সঠিক পরিমাণ দিন');
      return api.finance.addTransaction.mutate({
        id: newId(),
        orgId,
        type,
        amountPoisha: poisha,
        category,
        note: note || undefined,
        occurredAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      setAmount('');
      setNote('');
      void qc.invalidateQueries({ queryKey: ['balance', orgId] });
      void qc.invalidateQueries({ queryKey: ['summary', orgId] });
      void qc.invalidateQueries({ queryKey: ['txns', orgId] });
    },
  });

  const cats = CATEGORIES[type];

  return (
    <YStack gap="$md">
      <SectionHeader title={t('nav.finance')} />

      <HeroCard
        label={`💚 ${t('finance.balance')}`}
        value={formatBDT(balanceQ.data?.balancePoisha ?? 0, locale)}
        sublabel="এই মাসের সারাংশ"
        stats={[
          { label: t('finance.income'), value: formatBDT(summaryQ.data?.incomePoisha ?? 0, locale) },
          { label: t('finance.profit'), value: formatBDT(summaryQ.data?.profitPoisha ?? 0, locale) },
        ]}
      />

      <XStack gap="$md" flexWrap="wrap">
        <MetricCard label={t('finance.income')} value={formatBDT(summaryQ.data?.incomePoisha ?? 0, locale)} tone="income" />
        <MetricCard label={t('finance.expense')} value={formatBDT(summaryQ.data?.expensePoisha ?? 0, locale)} tone="expense" />
        <MetricCard label={t('finance.profit')} value={formatBDT(summaryQ.data?.profitPoisha ?? 0, locale)} tone="default" />
      </XStack>

      <Card gap="$md">
        <Body fontWeight="600">{t('finance.addTransaction')}</Body>
        <XStack gap="$sm">
          <Chip
            label={t('finance.income')}
            active={type === 'income'}
            onPress={() => {
              setType('income');
              setCategory(CATEGORIES.income[0]);
            }}
          />
          <Chip
            label={t('finance.expense')}
            active={type === 'expense'}
            onPress={() => {
              setType('expense');
              setCategory(CATEGORIES.expense[0]);
            }}
          />
        </XStack>
        <Input label="পরিমাণ (৳)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" />
        <XStack gap="$sm" flexWrap="wrap">
          {cats.map((c) => (
            <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
          ))}
        </XStack>
        <Input label="নোট (ঐচ্ছিক)" value={note} onChangeText={setNote} />
        <Button
          label={t('finance.addTransaction')}
          variant={type === 'income' ? 'income' : 'expense'}
          disabled={add.isPending}
          onPress={() => add.mutate()}
        />
        {add.error ? <Body color="$expense">{(add.error as Error).message}</Body> : null}
      </Card>

      <SectionHeader title="ইতিহাস" />
      <YStack gap="$sm">
        {(listQ.data ?? []).map((tx) => (
          <TransactionRow
            key={tx.id}
            type={tx.type}
            amount={formatBDT(tx.amountPoisha, locale)}
            category={tx.category}
            note={tx.note}
            date={formatDate(tx.occurredAt, locale)}
          />
        ))}
        {listQ.data && listQ.data.length === 0 ? <Caption>কোনো লেনদেন নেই</Caption> : null}
      </YStack>
    </YStack>
  );
}
