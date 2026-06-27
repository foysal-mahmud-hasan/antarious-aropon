import { styled, Stack, Text, type GetProps } from '@tamagui/core';

const ButtonFrame = styled(Stack, {
  name: 'ButtonFrame',
  role: 'button',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$sm',
  borderRadius: '$btn',
  paddingHorizontal: '$lg',
  cursor: 'pointer',
  pressStyle: { opacity: 0.85 },
  hoverStyle: { opacity: 0.95 },
  variants: {
    variant: {
      primary: { backgroundColor: '$primary' },
      secondary: { backgroundColor: '$secondary' },
      outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '$primary' },
      ghost: { backgroundColor: '$backgroundPress' },
      danger: { backgroundColor: '$expense' },
      income: { backgroundColor: '$income' },
      expense: { backgroundColor: '$expense' },
    },
    size: {
      sm: { height: 36, paddingHorizontal: '$md' },
      md: { height: 50 },
      lg: { height: 56 },
      xl: { height: 68 },
    },
    disabled: { true: { opacity: 0.5, pointerEvents: 'none' } },
  } as const,
  defaultVariants: { variant: 'primary', size: 'md' },
});

type FrameProps = GetProps<typeof ButtonFrame>;
type Variant = NonNullable<FrameProps['variant']>;

export interface ButtonProps extends FrameProps {
  label: string;
}

const FILLED: Variant[] = ['primary', 'secondary', 'danger', 'income', 'expense'];

export function Button({ label, variant = 'primary', ...rest }: ButtonProps) {
  const onInverse = FILLED.includes(variant);
  return (
    <ButtonFrame variant={variant} {...rest}>
      <Text
        fontFamily="$body"
        fontSize="$4"
        fontWeight="600"
        color={onInverse ? '$colorInverse' : '$primary'}
      >
        {label}
      </Text>
    </ButtonFrame>
  );
}
