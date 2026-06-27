import { Body, Button, Caption, Card, Heading, StatusPill, XStack, YStack } from '@aropon/ui';
import type { StatusTone } from '@aropon/ui';

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

export interface OrderRowData {
  id: string;
  customerName: string;
  customerPhone: string | null;
  channel: string;
  status: OrderStatus;
  paymentStatus: 'due' | 'paid';
}

const STATUS_TONE: Record<OrderStatus, StatusTone> = {
  pending: 'warning',
  confirmed: 'info',
  delivered: 'success',
  cancelled: 'error',
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'অপেক্ষমাণ',
  confirmed: 'নিশ্চিত',
  delivered: 'ডেলিভার্ড',
  cancelled: 'বাতিল',
};

export interface OrderRowProps {
  order: OrderRowData;
  total: string;
  onConfirm: () => void;
  onDeliver: () => void;
  onCancel: () => void;
  onTogglePay: () => void;
}

export function OrderRow({ order, total, onConfirm, onDeliver, onCancel, onTogglePay }: OrderRowProps) {
  return (
    <Card gap="$sm">
      <XStack justifyContent="space-between" alignItems="flex-start" gap="$md">
        <YStack flex={1}>
          <Body fontWeight="600">{order.customerName}</Body>
          <Caption>
            {order.channel}
            {order.customerPhone ? ` · ${order.customerPhone}` : ''}
          </Caption>
        </YStack>
        <Heading fontSize="$5">{total}</Heading>
      </XStack>
      <XStack gap="$sm" alignItems="center" flexWrap="wrap">
        <StatusPill label={STATUS_LABEL[order.status]} tone={STATUS_TONE[order.status]} />
        <StatusPill
          label={order.paymentStatus === 'paid' ? 'পরিশোধিত' : 'বাকি'}
          tone={order.paymentStatus === 'paid' ? 'success' : 'neutral'}
        />
      </XStack>
      <XStack gap="$sm" flexWrap="wrap">
        {order.status === 'pending' ? <Button size="sm" label="নিশ্চিত করুন" onPress={onConfirm} /> : null}
        {order.status === 'confirmed' ? (
          <Button size="sm" variant="secondary" label="ডেলিভার্ড" onPress={onDeliver} />
        ) : null}
        <Button
          size="sm"
          variant="outline"
          label={order.paymentStatus === 'paid' ? 'বাকি করুন' : 'পরিশোধিত'}
          onPress={onTogglePay}
        />
        {order.status !== 'cancelled' && order.status !== 'delivered' ? (
          <Button size="sm" variant="ghost" label="বাতিল" onPress={onCancel} />
        ) : null}
      </XStack>
    </Card>
  );
}
