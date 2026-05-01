import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, text } from '../theme';

/**
 * Shared header for the top-level tab screens (Workout / Nutrition / Tracking).
 * Renders the small uppercase eyebrow above a hero title, with an optional
 * right-side text action (Reset / Edit goals / Clear).
 *
 * @param {object} props
 * @param {string} [props.eyebrow] - Small uppercase line above the title.
 * @param {string} props.title - The hero title shown in `text.hero`.
 * @param {string} [props.actionLabel] - Text on the right-side action button. If omitted, no button is rendered.
 * @param {() => void} [props.onActionPress] - Tap handler for the right-side action. Required when `actionLabel` is set.
 *
 * @example
 *   <ScreenHeader
 *     eyebrow="MONDAY, JAN 5"
 *     title="Workout"
 *     actionLabel="Reset"
 *     onActionPress={handleReset}
 *   />
 */
export function ScreenHeader({ eyebrow, title, actionLabel, onActionPress }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={text.hero}>{title}</Text>
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
  eyebrow: { ...text.eyebrowSmall, color: colors.textTertiary, marginBottom: 4 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: spacing.sm },
  actionText: { ...text.buttonSmall, color: colors.textSecondary, fontWeight: '600' },
});
