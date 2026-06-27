import { Stack, Text } from '@tamagui/core';

export interface BadgeProps {
  /** Numeric count; values over 99 render as "99+". */
  count: number;
}

/** Small count badge (e.g. unread messages). Hidden when count <= 0. */
export function Badge({ count }: BadgeProps) {
  if (count <= 0) return null;
  return (
    <Stack
      minWidth={20}
      height={20}
      paddingHorizontal={6}
      borderRadius="$full"
      backgroundColor="$expense"
      alignItems="center"
      justifyContent="center"
    >
      <Text fontFamily="$body" fontSize={11} fontWeight="700" color="$colorInverse">
        {count > 99 ? '99+' : String(count)}
      </Text>
    </Stack>
  );
}
