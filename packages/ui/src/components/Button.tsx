import { LinearGradient } from 'expo-linear-gradient';
import { Stack, Text } from '@tamagui/core';
import { XStack } from '../primitives';
import { gradients } from '../tokens';
import { fireConfetti } from '../confetti';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'income'
  | 'expense';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const HEIGHT: Record<ButtonSize, number> = { sm: 36, md: 50, lg: 56, xl: 68 };

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: string;
  onPress?: () => void;
}

const GRADIENT: Partial<Record<ButtonVariant, readonly [string, string, ...string[]]>> = {
  primary: gradients.hero,
  income: gradients.income,
  danger: gradients.expense,
  expense: gradients.expense,
};

/** Playful button — gradient fills, tap-scale, confetti on primary/income CTAs. */
export function Button({
  label,
  variant = 'primary',
  size = 'md',
  disabled,
  fullWidth,
  icon,
  onPress,
}: ButtonProps) {
  const height = HEIGHT[size];
  const grad = GRADIENT[variant];

  const handlePress = () => {
    if (disabled) return;
    if (variant === 'primary' || variant === 'income') fireConfetti();
    onPress?.();
  };

  if (grad) {
    return (
      <Stack
        onPress={handlePress}
        opacity={disabled ? 0.5 : 1}
        borderRadius="$btn"
        overflow="hidden"
        alignSelf={fullWidth ? 'stretch' : 'flex-start'}
        width={fullWidth ? '100%' : undefined}
        cursor="pointer"
        animation="quick"
        pressStyle={{ scale: 0.97 }}
        hoverStyle={{ y: -2 }}
        shadowColor={variant === 'income' ? '$income' : variant === 'primary' ? '$primary' : '$expense'}
        shadowOpacity={0.4}
        shadowRadius={14}
        shadowOffset={{ width: 0, height: 8 }}
      >
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 18 }}
        >
          {icon ? <Text fontSize={16}>{icon}</Text> : null}
          <Text fontFamily="$body" fontSize="$4" fontWeight="700" color="#ffffff">
            {label}
          </Text>
        </LinearGradient>
      </Stack>
    );
  }

  // Non-gradient variants: secondary (solid accent), outline, ghost
  const bg = variant === 'secondary' ? '$accent' : variant === 'ghost' ? '$backgroundPress' : 'transparent';
  const textColor = variant === 'secondary' ? '#ffffff' : '$primary';
  return (
    <Stack
      onPress={handlePress}
      opacity={disabled ? 0.5 : 1}
      height={height}
      borderRadius="$btn"
      paddingHorizontal="$lg"
      alignItems="center"
      justifyContent="center"
      alignSelf={fullWidth ? 'stretch' : 'flex-start'}
      width={fullWidth ? '100%' : undefined}
      backgroundColor={bg}
      borderWidth={variant === 'outline' ? 1.5 : 0}
      borderColor="$primary"
      cursor="pointer"
      animation="quick"
      pressStyle={{ scale: 0.97 }}
    >
      <XStack alignItems="center" gap="$sm">
        {icon ? <Text fontSize={16}>{icon}</Text> : null}
        <Text fontFamily="$body" fontSize="$4" fontWeight="700" color={textColor}>
          {label}
        </Text>
      </XStack>
    </Stack>
  );
}
