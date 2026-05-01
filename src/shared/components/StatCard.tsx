import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { colors, fontSize, spacing, surfaces, text } from '@/shared/theme';

export type StatCardProps = {
  value: string | number;
  label: string;
  sub?: string;
  valueColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function StatCard({ value, label, sub, valueColor, style }: StatCardProps) {
  return (
    <View style={[styles.cell, style]}>
      <Text style={[styles.value, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    ...surfaces.row,
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
  },
  value: { ...(text.monoNumber as TextStyle), fontSize: fontSize.title3 },
  label: { ...(text.eyebrowSmall as TextStyle) },
  sub: { ...(text.monoCaption as TextStyle), color: colors.textSecondary, marginTop: 2 },
});
