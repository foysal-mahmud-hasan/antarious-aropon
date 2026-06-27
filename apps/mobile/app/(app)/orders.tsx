import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { formatBDT } from '@aropon/i18n';
import {
  Body,
  Button,
  Caption,
  Card,
  Chip,
  EmptyState,
  Input,
  SectionHeader,
  XStack,
  YStack,
} from '@aropon/ui';
import { api } from '../../lib/trpc';
import { useAuth } from '../../lib/auth';
import { OrderRow } from '../../components/OrderRow';

const CHANNELS = ['manual', 'facebook', 'instagram', 'website'] as const;

export default function OrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const orgId = useAuth((s) => s.orgId)!;
  const locale = useAuth((s) => s.locale);
  const qc = useQueryClient();

  const orgQ = useQuery({ queryKey: ['org', orgId], queryFn: () => api.org.current.query() });
  const allowed = orgQ.data?.entitlements['orders.confirmation'] ?? false;

  const ordersQ = useQuery({
    queryKey: ['orders', orgId],
    queryFn: () => api.orders.list.query({ orgId }),
    enabled: allowed,
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>('manual');
  const [product, setProduct] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['orders', orgId] });

  const create = useMutation({
    mutationFn: async () => {
      const unit = Math.round(Number.parseFloat(price || '0') * 100);
      const quantity = Math.max(1, Number.parseInt(qty || '1', 10));
      if (!name.trim()) throw new Error('গ্রাহকের নাম দিন');
      if (!product.trim()) throw new Error('পণ্যের নাম দিন');
      if (!Number.isFinite(unit) || unit <= 0) throw new Error('সঠিক দাম দিন');
      return api.orders.create.mutate({
        orgId,
        customerName: name.trim(),
        customerPhone: phone || undefined,
        channel,
        items: [{ productName: product.trim(), quantity, unitPricePoisha: unit }],
      });
    },
    onSuccess: () => {
      setName('');
      setPhone('');
      setProduct('');
      setQty('1');
      setPrice('');
      invalidate();
    },
  });

  const setStatus = useMutation({
    mutationFn: (p: { orderId: string; status: 'confirmed' | 'delivered' | 'cancelled' }) =>
      api.orders.setStatus.mutate({ orgId, orderId: p.orderId, status: p.status }),
    onSuccess: invalidate,
  });
  const setPay = useMutation({
    mutationFn: (p: { orderId: string; paymentStatus: 'due' | 'paid' }) =>
      api.orders.setPayment.mutate({ orgId, orderId: p.orderId, paymentStatus: p.paymentStatus }),
    onSuccess: invalidate,
  });

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
        <SectionHeader title={t('nav.orders')} />
        <EmptyState
          title={t('gate.locked')}
          subtitle={t('tier.t1')}
          action={<Button label={t('gate.upgrade')} variant="primary" onPress={() => router.push('/settings')} />}
        />
      </YStack>
    );
  }

  return (
    <YStack gap="$md">
      <SectionHeader title={t('nav.orders')} />
      <Card gap="$md">
        <Body fontWeight="600">নতুন অর্ডার</Body>
        <Input label="গ্রাহকের নাম" value={name} onChangeText={setName} />
        <Input label="ফোন (ঐচ্ছিক)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <XStack gap="$sm" flexWrap="wrap">
          {CHANNELS.map((c) => (
            <Chip key={c} label={c} active={channel === c} onPress={() => setChannel(c)} />
          ))}
        </XStack>
        <Input label="পণ্য" value={product} onChangeText={setProduct} />
        <XStack gap="$sm">
          <YStack flex={1}>
            <Input label="পরিমাণ" value={qty} onChangeText={setQty} keyboardType="number-pad" />
          </YStack>
          <YStack flex={2}>
            <Input label="একক দাম (৳)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
          </YStack>
        </XStack>
        <Button label="অর্ডার তৈরি করুন" disabled={create.isPending} onPress={() => create.mutate()} />
        {create.error ? <Body color="$expense">{(create.error as Error).message}</Body> : null}
      </Card>

      <SectionHeader title="অর্ডার সমূহ" />
      <YStack gap="$sm">
        {(ordersQ.data ?? []).map((o) => (
          <OrderRow
            key={o.id}
            order={o}
            total={formatBDT(o.totalPoisha, locale)}
            onConfirm={() => setStatus.mutate({ orderId: o.id, status: 'confirmed' })}
            onDeliver={() => setStatus.mutate({ orderId: o.id, status: 'delivered' })}
            onCancel={() => setStatus.mutate({ orderId: o.id, status: 'cancelled' })}
            onTogglePay={() =>
              setPay.mutate({ orderId: o.id, paymentStatus: o.paymentStatus === 'paid' ? 'due' : 'paid' })
            }
          />
        ))}
        {ordersQ.data && ordersQ.data.length === 0 ? <Caption>কোনো অর্ডার নেই</Caption> : null}
      </YStack>
    </YStack>
  );
}
