import { LinearGradient } from 'expo-linear-gradient';
import { Stack, Text } from '@tamagui/core';
import { XStack, YStack } from '../primitives';
import { gradients } from '../tokens';

export interface HeroStat {
  label: string;
  value: string;
}

export interface HeroCardProps {
  label: string;
  value: string;
  sublabel?: string;
  stats?: HeroStat[];
  tone?: 'brand' | 'income';
  sparkle?: string;
}

/** Gradient hero card — the centerpiece of each screen (balance, summary, etc.). */
export function HeroCard({ label, value, sublabel, stats, tone = 'brand', sparkle = '✨' }: HeroCardProps) {
  const colors = tone === 'income' ? gradients.income : gradients.hero;
  return (
    <Stack
      borderRadius="$lg"
      overflow="hidden"
      marginBottom="$base"
      shadowColor="$primary"
      shadowOpacity={0.3}
      shadowRadius={18}
      shadowOffset={{ width: 0, height: 10 }}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 18 }}>
        <Text style={{ position: 'absolute', top: 14, right: 16, fontSize: 20, opacity: 0.55 }}>{sparkle}</Text>
        <Text fontFamily="$body" fontSize="$2" color="#ffffff" opacity={0.92} fontWeight="600">
          {label}
        </Text>
        <Text fontFamily="$body" fontSize={34} color="#ffffff" fontWeight="800" marginVertical={2}>
          {value}
        </Text>
        {sublabel ? (
          <Text fontFamily="$body" fontSize="$2" color="#ffffff" opacity={0.9}>
            {sublabel}
          </Text>
        ) : null}
        {stats?.length ? (
          <XStack gap="$xl" marginTop="$sm">
            {stats.map((s, i) => (
              <YStack key={i}>
                <Text fontFamily="$body" fontSize="$1" color="#ffffff" opacity={0.85}>
                  {s.label}
                </Text>
                <Text fontFamily="$body" fontSize="$5" color="#ffffff" fontWeight="800">
                  {s.value}
                </Text>
              </YStack>
            ))}
          </XStack>
        ) : null}
      </LinearGradient>
    </Stack>
  );
}
