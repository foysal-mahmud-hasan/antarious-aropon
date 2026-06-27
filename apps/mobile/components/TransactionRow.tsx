import { Body, Caption, Card, Heading, XStack, YStack } from '@aropon/ui';

export interface TransactionRowProps {
  type: 'income' | 'expense';
  amount: string;
  category: string;
  note: string | null;
  date: string;
}

export function TransactionRow({ type, amount, category, note, date }: TransactionRowProps) {
  return (
    <Card paddingVertical="$md">
      <XStack justifyContent="space-between" alignItems="center" gap="$md">
        <YStack flex={1}>
          <Body fontWeight="600">{category}</Body>
          <Caption>
            {date}
            {note ? ` · ${note}` : ''}
          </Caption>
        </YStack>
        <Heading fontSize="$5" color={type === 'income' ? '$income' : '$expense'}>
          {type === 'income' ? '+' : '−'}
          {amount}
        </Heading>
      </XStack>
    </Card>
  );
}
