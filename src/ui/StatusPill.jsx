import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts, radius, spacing } from '../theme';

/**
 * Small uppercase pill with a colored border and tinted background.
 * Used for session status (DONE / ABANDONED / IN PROGRESS), confidence
 * badges (HIGH / LOW), and similar one-word state tags.
 *
 * @param {object} props
 * @param {string} props.label - The pill text (rendered as-is, so caller chooses casing).
 * @param {string} props.color - The accent colour. Used for text + 40%-alpha border + 15%-alpha background.
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [props.style] - Style override on the outer pill.
 *
 * @example
 *   <StatusPill label="DONE" color={colors.success} />
 *   <StatusPill label="HIGH" color={colors.success} />
 *   <StatusPill label="MEDIUM" color={colors.warning} />
 */
export function StatusPill({ label, color, style }) {
  return (
    <View style={[styles.pill, { backgroundColor: color + '15', borderColor: color + '40' }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: fonts.mono,
    letterSpacing: 1,
  },
});
