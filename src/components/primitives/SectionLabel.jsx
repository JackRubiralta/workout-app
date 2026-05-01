import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, layout, text } from '../../theme';

// Small uppercase label above a section of content (FOOD LOG, SESSIONS,
// PROGRAM, TOP EXERCISES, etc.). Applies the standard 2px optical indent
// so the label aligns with rounded card edges below.
//
//   <SectionLabel>FOOD LOG</SectionLabel>
//   <SectionLabel style={{ marginTop: spacing.md }}>SESSIONS</SectionLabel>
export function SectionLabel({ children, style }) {
  return <Text style={[text.eyebrow, styles.label, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    color: colors.textTertiary,
    marginLeft: layout.sectionIndent,
  },
});
