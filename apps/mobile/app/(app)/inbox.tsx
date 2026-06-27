import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Body,
  Button,
  Caption,
  Card,
  Chip,
  EmptyState,
  Grid,
  Input,
  SectionHeader,
  StatusPill,
  XStack,
  YStack,
} from '@aropon/ui';
import { api } from '../../lib/trpc';
import { useAuth } from '../../lib/auth';
import { ConversationRow } from '../../components/ConversationRow';
import { MessageBubble } from '../../components/MessageBubble';

const FILTERS = ['all', 'open', 'escalated'] as const;
const FILTER_LABEL = { all: 'সব', open: 'ওপেন', escalated: 'এস্কেলেটেড' };

export default function InboxScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const orgId = useAuth((s) => s.orgId)!;
  const qc = useQueryClient();

  const orgQ = useQuery({ queryKey: ['org', orgId], queryFn: () => api.org.current.query() });
  const ent = orgQ.data?.entitlements;
  const allowed = ent?.['social.inbox'] ?? false;
  const canAuto = ent?.['social.auto_reply'] ?? false;
  const canEscalate = ent?.['social.manual_escalation'] ?? false;

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const listQ = useQuery({
    queryKey: ['inbox', orgId, filter],
    queryFn: () => api.inbox.list.query({ orgId, status: filter }),
    enabled: allowed,
  });
  const threadQ = useQuery({
    queryKey: ['thread', orgId, selected],
    queryFn: () => api.inbox.thread.query({ orgId, conversationId: selected! }),
    enabled: !!selected,
  });

  const refreshThread = () => {
    void qc.invalidateQueries({ queryKey: ['thread', orgId, selected] });
    void qc.invalidateQueries({ queryKey: ['inbox', orgId] });
  };
  const seed = useMutation({
    mutationFn: () => api.inbox.seedDemo.mutate({ orgId }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['inbox', orgId] }),
  });
  const sendReply = useMutation({
    mutationFn: () => api.inbox.reply.mutate({ orgId, conversationId: selected!, body: reply }),
    onSuccess: () => {
      setReply('');
      refreshThread();
    },
  });
  const autoReply = useMutation({
    mutationFn: () => api.inbox.autoReply.mutate({ orgId, conversationId: selected! }),
    onSuccess: refreshThread,
  });
  const escalate = useMutation({
    mutationFn: () => api.inbox.escalate.mutate({ orgId, conversationId: selected! }),
    onSuccess: refreshThread,
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
        <SectionHeader title={t('nav.inbox')} />
        <EmptyState
          title={t('gate.locked')}
          subtitle={t('tier.t1')}
          action={<Button label={t('gate.upgrade')} variant="primary" onPress={() => router.push('/settings')} />}
        />
      </YStack>
    );
  }

  // Conversation thread view
  if (selected && threadQ.data) {
    const c = threadQ.data;
    return (
      <YStack flex={1} gap="$md">
        <XStack alignItems="center" gap="$sm">
          <Button size="sm" variant="ghost" label="← পেছনে" onPress={() => setSelected(null)} />
          <YStack flex={1}>
            <Body fontWeight="600">{c.customerName ?? 'গ্রাহক'}</Body>
            <Caption>{c.channel}</Caption>
          </YStack>
          <StatusPill
            label={c.status === 'escalated' ? 'এস্কেলেটেড' : 'ওপেন'}
            tone={c.status === 'escalated' ? 'error' : 'info'}
          />
        </XStack>

        <YStack gap="$sm">
          {c.messages.map((m) => (
            <MessageBubble key={m.id} sender={m.sender} body={m.body} />
          ))}
        </YStack>

        <Card gap="$sm">
          <Input placeholder="উত্তর লিখুন…" value={reply} onChangeText={setReply} />
          <XStack gap="$sm" flexWrap="wrap">
            <Button
              size="sm"
              label="পাঠান"
              disabled={sendReply.isPending || !reply.trim()}
              onPress={() => sendReply.mutate()}
            />
            {canAuto ? (
              <Button
                size="sm"
                variant="secondary"
                label="অটো-রিপ্লাই"
                disabled={autoReply.isPending}
                onPress={() => autoReply.mutate()}
              />
            ) : null}
            {canEscalate && c.status !== 'escalated' ? (
              <Button size="sm" variant="outline" label="এস্কেলেট" onPress={() => escalate.mutate()} />
            ) : null}
          </XStack>
        </Card>
      </YStack>
    );
  }

  // Conversation list view
  return (
    <YStack flex={1} gap="$md">
      <SectionHeader title={t('nav.inbox')} />
      <XStack gap="$sm">
        {FILTERS.map((f) => (
          <Chip key={f} label={FILTER_LABEL[f]} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </XStack>
      {listQ.data && listQ.data.length === 0 ? (
        <EmptyState
          title="কোনো কথোপকথন নেই"
          subtitle="ফেসবুক/ইনস্টাগ্রাম সংযোগ করুন বা ডেমো লোড করুন"
          action={<Button label="ডেমো লোড করুন" disabled={seed.isPending} onPress={() => seed.mutate()} />}
        />
      ) : (
        <Grid minItemWidth={320}>
          {(listQ.data ?? []).map((c) => (
            <ConversationRow key={c.id} conv={c} onPress={() => setSelected(c.id)} />
          ))}
        </Grid>
      )}
    </YStack>
  );
}
