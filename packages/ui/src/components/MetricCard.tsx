import { Card } from './Card';
import { Caption, Heading } from './Typography';

export type MetricTone = 'income' | 'expense' | 'default';

export interface MetricCardProps {
  label: string;
  value: string;
  tone?: MetricTone;
}

/** KPI tile (income/expense/profit etc.). Value is pre-formatted (e.g. via @aropon/i18n formatBDT). */
export function MetricCard({ label, value, tone = 'default' }: MetricCardProps) {
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
