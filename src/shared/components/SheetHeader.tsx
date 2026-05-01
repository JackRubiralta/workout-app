import React, { type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type TextStyle } from 'react-native';
import { colors, fontSize, radius, spacing, text } from '@/shared/theme';

export type SheetHeaderProps = {
  eyebrow?: string;
  title: string;
  onClose?: () => void;
  left?: ReactNode;
  right?: ReactNode;
};

export function SheetHeader({ eyebrow, title, onClose, left, right }: SheetHeaderProps) {
  return (
    <View style={styles.row}>
      {left}
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>
      {right}
      {onClose ? (
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12} activeOpacity={0.7}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  eyebrow: { ...(text.eyebrowSmall as TextStyle), color: colors.textTertiary, marginBottom: 2 },
  title: { ...(text.title3 as TextStyle), fontSize: fontSize.headline },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
});
