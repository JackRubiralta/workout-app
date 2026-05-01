import React, { type ReactNode } from 'react';
import { Text, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { colors, layout, text } from '@/shared/theme';

export type SectionLabelProps = {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
};

export function SectionLabel({ children, style }: SectionLabelProps) {
  return <Text style={[text.eyebrow as TextStyle, styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    color: colors.textTertiary,
    marginLeft: layout.sectionIndent,
  },
});
