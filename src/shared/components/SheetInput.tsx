import React, { type ReactNode } from 'react';
import {
  Text,
  TextInput,
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
  type KeyboardTypeOptions,
} from 'react-native';
import { colors, fonts, fontSize, radius, spacing, text } from '@/shared/theme';

export type FieldLabelProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
};

export function FieldLabel({ children, style }: FieldLabelProps) {
  return <Text style={[text.eyebrow as TextStyle, { marginBottom: spacing.xs }, style]}>{children}</Text>;
}

export type SheetInputProps = {
  style?: StyleProp<ViewStyle | TextStyle>;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  selectionColor?: string;
  multiline?: boolean;
};

export function SheetInput({
  style,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoCapitalize,
  selectionColor,
  multiline,
}: SheetInputProps) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.multiline, style as StyleProp<TextStyle>]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      returnKeyType="done"
      multiline={multiline}
      selectionColor={selectionColor ?? colors.success}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.mono,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});
