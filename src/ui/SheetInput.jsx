import React from 'react';
import { Text, TextInput, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, radius, spacing, text } from '../theme';

export function FieldLabel({ children, style }) {
  return <Text style={[text.eyebrow, { marginBottom: spacing.xs }, style]}>{children}</Text>;
}

export function SheetInput({ style, value, onChangeText, placeholder, keyboardType, autoCapitalize, selectionColor, multiline }) {
  return (
    <TextInput
      style={[styles.input, multiline && styles.multiline, style]}
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
