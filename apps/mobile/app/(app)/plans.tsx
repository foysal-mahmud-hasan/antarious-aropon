import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Body,
  Button,
  Caption,
  Card,
  SectionHeader,
  StatusPill,
  Text,
  useMedia,
  XStack,
  YStack,
} from '@aropon/ui';
import { api } from '../../lib/trpc';
import { useAuth } from '../../lib/auth';
import { PLANS, cumulativeFeatures, tierIndex, type PlanTier } from '../../lib/plans';

export default function PlansScreen() {
  const orgId = useAuth((s) => s.orgId)!;
  const router = useRouter();
  const qc = useQueryClient();

  const orgQ = useQuery({ queryKey: ['org', orgId], queryFn: () => api.org.current.query() });
  const current = (orgQ.data?.tier ?? 't0') as PlanTier;
  const curIdx = tierIndex(current);

  const switchTier = useMutation({
    mutationFn: (tier: PlanTier) => api.billing.setTier.mutate({ orgId, tier }),
    onSuccess: () => void qc.invalidateQueries(),
  });

  const media = useMedia();
  const wide = media.lg; // desktop → grid of cards side-by-side

  return (
    <YStack gap="$md">
      <SectionHeader title="প্যাকেজ" />
      <Caption>আপনি এখন যা পাচ্ছেন, এবং আপগ্রেড করলে যা যোগ হবে</Caption>

      <XStack flexWrap="wrap" gap="$md" justifyContent="space-between">
        {PLANS.map((p) => {
        const idx = tierIndex(p.id);
        const isCurrent = p.id === current;
        const isHigher = idx > curIdx;
        const feats = isCurrent ? cumulativeFeatures(p.id) : p.adds;
        const heading = isCurrent
          ? '✅ আপনি যা পাচ্ছেন'
          : isHigher
            ? '✨ নতুন যা পাবেন'
            : 'এই প্যাকেজে যা থাকবে';

        return (
          <Card
            key={p.id}
            gap="$sm"
            width={wide && !isCurrent ? '48.5%' : '100%'}
            borderWidth={isCurrent ? 2 : 0}
            borderColor="$primary"
            opacity={p.live ? 1 : 0.85}
          >
            <XStack justifyContent="space-between" alignItems="center">
              <XStack alignItems="center" gap="$sm" flex={1}>
                <Text fontSize={24}>{p.emoji}</Text>
                <YStack flex={1}>
                  <Body fontWeight="800">{p.name}</Body>
                  <Caption>{p.price}/মাস</Caption>
                </YStack>
              </XStack>
              {isCurrent ? (
                <StatusPill label="বর্তমান" tone="success" />
              ) : !p.live ? (
                <StatusPill label="শীঘ্রই" tone="neutral" />
              ) : isHigher ? (
                <StatusPill label="আপগ্রেড" tone="info" />
              ) : null}
            </XStack>

            <Caption>{heading}</Caption>
            <YStack gap={3}>
              {feats.map((f, i) => (
                <Body key={i} fontSize="$2">
                  ✓ {f}
                </Body>
              ))}
            </YStack>
            {isHigher && p.id !== 't0' ? <Caption>＋ নিচের সব প্যাকেজের ফিচার</Caption> : null}

            {!isCurrent && p.live ? (
              <Button
                label={isHigher ? 'এই প্যাকেজে আপগ্রেড করুন' : 'এই প্যাকেজে যান'}
                variant="primary"
                disabled={switchTier.isPending}
                onPress={() => switchTier.mutate(p.id)}
              />
            ) : null}
            {!p.live ? <Button label="শীঘ্রই আসছে" variant="ghost" disabled onPress={() => {}} /> : null}
          </Card>
        );
        })}
      </XStack>

      <Button label="চালিয়ে যান →" variant="outline" onPress={() => router.replace('/finance')} />
    </YStack>
  );
}
