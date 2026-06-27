import { Body, Caption, Card, StatusPill, XStack, YStack } from '@aropon/ui';

export interface ConversationRowData {
  id: string;
  channel: string;
  customerName: string | null;
  status: 'open' | 'escalated' | 'closed';
}

const STATUS = {
  open: { label: 'ওপেন', tone: 'info' as const },
  escalated: { label: 'এস্কেলেটেড', tone: 'error' as const },
  closed: { label: 'বন্ধ', tone: 'neutral' as const },
};

export function ConversationRow({ conv, onPress }: { conv: ConversationRowData; onPress: () => void }) {
  const s = STATUS[conv.status];
  return (
    <Card onPress={onPress} pressStyle={{ opacity: 0.85 }} cursor="pointer">
      <XStack justifyContent="space-between" alignItems="center" gap="$md">
        <YStack flex={1}>
          <Body fontWeight="600">{conv.customerName ?? 'গ্রাহক'}</Body>
          <Caption>{conv.channel}</Caption>
        </YStack>
        <StatusPill label={s.label} tone={s.tone} />
      </XStack>
    </Card>
  );
}
