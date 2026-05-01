import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fontSize, spacing, text } from '../../theme';
import { IconButton } from '../../ui';
import { ChevronLeft, UndoIcon } from '../../ui/icons';

/**
 * Top bar of the active session screen — back chevron, centered day title
 * (with day-color title text), and an undo button (or a placeholder spacer
 * when there's nothing to undo, so the layout doesn't shift).
 *
 * @param {object} props
 * @param {{ day: number, title: string, color: string, focus?: string }} props.day
 * @param {boolean} props.canUndo
 * @param {() => void} props.onBack
 * @param {() => void} props.onUndo
 */
export function SessionTopBar({ day, canUndo, onBack, onUndo }) {
  return (
    <View style={s.row}>
      <IconButton onPress={onBack}>
        <ChevronLeft color={colors.text} />
      </IconButton>
      <View style={s.center}>
        <Text style={s.title} numberOfLines={1}>
          Day {day.day}{'  '}
          <Text style={{ color: day.color }}>{day.title}</Text>
        </Text>
        {day.focus ? <Text style={s.focus}>{day.focus}</Text> : null}
      </View>
      {canUndo ? (
        <IconButton onPress={onUndo}>
          <UndoIcon color={colors.textSecondary} />
        </IconButton>
      ) : (
        <View style={s.placeholder} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, height: 48, gap: spacing.sm },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  title: { ...text.title3, fontSize: fontSize.headline, color: colors.text, fontWeight: '700' },
  focus: { ...text.bodySecondary, fontSize: 12, marginTop: 1 },
  placeholder: { width: 36, height: 36 },
});
