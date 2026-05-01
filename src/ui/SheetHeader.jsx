import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSize, radius, spacing, text } from '../theme';

/**
 * Top row inside a Sheet: optional `left` badge + (optional eyebrow over)
 * the bold title + optional `right` slot + ✕ close pill, with a hairline
 * divider underneath. Used by every full-page sheet so the chrome stays
 * uniform.
 *
 * @param {object} props
 * @param {string} [props.eyebrow] - Small uppercase line above the title (e.g. "EXERCISE 3").
 * @param {string} props.title - The bold sheet title.
 * @param {() => void} [props.onClose] - Tap handler for the ✕ close pill. If omitted, no close button is rendered (useful when the sheet has its own dismiss UI).
 * @param {React.ReactNode} [props.left] - Slot before the title (a colored day dot, an icon).
 * @param {React.ReactNode} [props.right] - Slot between the title and the close button.
 *
 * @example
 *   <SheetHeader title="Daily Goals" onClose={onClose} />
 *   <SheetHeader eyebrow="EXERCISE 3" title="Bench Press" onClose={onClose} />
 */
export function SheetHeader({ eyebrow, title, onClose, left, right }) {
  return (
    <View style={styles.row}>
      {left}
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
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
  eyebrow: { ...text.eyebrowSmall, color: colors.textTertiary, marginBottom: 2 },
  title: { ...text.title3, fontSize: fontSize.headline },
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
