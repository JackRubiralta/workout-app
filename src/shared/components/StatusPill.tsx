import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { fonts, radius, spacing } from '@/shared/theme';

export type StatusPillProps = {
  label: string;
  color: string;
  style?: StyleProp<ViewStyle>;
};

export function StatusPill({ label, color, style }: StatusPillProps) {
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
