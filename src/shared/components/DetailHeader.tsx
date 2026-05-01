import React, { type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/shared/theme';
import { IconButton } from './Button';
import { ChevronLeft } from './icons';

export type DetailHeaderProps = {
  onBack: () => void;
  center?: ReactNode;
  right?: ReactNode;
};

export function DetailHeader({ onBack, center, right }: DetailHeaderProps) {
  return (
    <View style={styles.row}>
      <IconButton onPress={onBack}>
        <ChevronLeft color={colors.text} size={20} />
      </IconButton>
      <View style={styles.center}>{center}</View>
      <View>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
