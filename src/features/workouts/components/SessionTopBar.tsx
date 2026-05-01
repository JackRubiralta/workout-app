import React from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { colors, fontSize, spacing, text } from '@/shared/theme';
import { IconButton } from '@/shared/components';
import { ChevronLeft, UndoIcon } from '@/shared/components/icons';
import type { DayTemplate } from '../types/workoutTypes';

export type SessionTopBarProps = {
  day: DayTemplate;
  canUndo: boolean;
  onBack: () => void;
  onUndo: () => void;
};

export function SessionTopBar({ day, canUndo, onBack, onUndo }: SessionTopBarProps) {
  return (
    <View style={s.row}>
      <IconButton onPress={onBack}>
        <ChevronLeft color={colors.text} />
      </IconButton>
      <View style={s.center}>
        <Text style={s.title} numberOfLines={1}>
          Day {day.day}
          {'  '}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    height: 48,
    gap: spacing.sm,
  },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sm },
  title: {
    ...(text.title3 as TextStyle),
    fontSize: fontSize.headline,
    color: colors.text,
    fontWeight: '700',
  },
  focus: { ...(text.bodySecondary as TextStyle), fontSize: 12, marginTop: 1 },
  placeholder: { width: 36, height: 36 },
});
