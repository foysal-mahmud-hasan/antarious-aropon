import { TextInput, type TextInputProps } from 'react-native';
import { YStack } from '../primitives';
import { Caption } from './Typography';
import { fontSize, palette, radius, space } from '../tokens';

export interface InputProps extends TextInputProps {
  label?: string;
}

/** Token-styled text input with an optional label. 48px min height (tap target), tokens only. */
export function Input({ label, style, ...props }: InputProps) {
  return (
    <YStack gap="$xs">
      {label ? <Caption>{label}</Caption> : null}
      <TextInput
        placeholderTextColor={palette.textSecondary}
        style={[
          {
            borderWidth: 1.5,
            borderColor: palette.border,
            backgroundColor: palette.chipBg,
            borderRadius: radius.md,
            minHeight: 48,
            paddingHorizontal: space.md,
            fontSize: fontSize.md,
            color: palette.textPrimary,
          },
          style,
        ]}
        {...props}
      />
    </YStack>
  );
}
