import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type TextStyle } from 'react-native';
import { colors, spacing, text } from '@/shared/theme';

export type ScreenHeaderProps = {
  eyebrow?: string;
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function ScreenHeader({ eyebrow, title, actionLabel, onActionPress }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={text.hero as TextStyle}>{title}</Text>
      </View>
      {actionLabel && onActionPress ? (
        <TouchableOpacity onPress={onActionPress} hitSlop={10} activeOpacity={0.6} style={styles.actionBtn}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  eyebrow: { ...(text.eyebrowSmall as TextStyle), color: colors.textTertiary, marginBottom: 4 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: spacing.sm },
  actionText: { ...(text.buttonSmall as TextStyle), color: colors.textSecondary, fontWeight: '600' },
});
