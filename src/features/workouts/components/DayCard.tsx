import React, { type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, shadow, spacing, surfaces, text } from '@/shared/theme';
import { CheckCircle, ChevronRight } from '@/shared/components/icons';
import type { DayTemplate } from '../types/workoutTypes';

export type DayCardProps = {
  day: DayTemplate;
  doneSets: number;
  totalSets: number;
  exerciseCount: number;
  isDone: boolean;
  isInProgress: boolean;
  onPress?: () => void;
  /**
   * Replaces the trailing chevron / check icon. Used by the workout list to
   * inject a drag handle when the program is in edit mode.
   */
  rightSlot?: ReactNode;
  /** Disables the press handler (keeps the visual unchanged). */
  disabled?: boolean;
};

export function DayCard({
  day,
  doneSets,
  totalSets,
  exerciseCount,
  isDone,
  isInProgress,
  onPress,
  rightSlot,
  disabled = false,
}: DayCardProps) {
  const accent = isDone ? colors.success : day.color;
  const pct = totalSets > 0 ? doneSets / totalSets : 0;

  return (
    <TouchableOpacity
      style={[styles.card, isInProgress && { borderColor: day.color, ...shadow.glow(day.color, 0.4) }]}
      onPress={() => {
        if (disabled || !onPress) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      disabled={disabled || !onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.tint, { backgroundColor: accent + '12' }]} pointerEvents="none" />

      <View style={[styles.numBubble, { backgroundColor: accent, ...shadow.glow(accent, 0.55) }]}>
        <Text style={styles.numText}>{day.day}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {day.title}
        </Text>
        {day.focus ? (
          <Text style={styles.focus} numberOfLines={1}>
            {day.focus}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{exerciseCount} ex</Text>
          <View style={styles.metaDot} />
          <Text style={styles.meta}>{totalSets} sets</Text>
          {isInProgress && (
            <>
              <View style={styles.metaDot} />
              <Text style={[styles.meta, { color: day.color }]}>
                {doneSets}/{totalSets} done
              </Text>
            </>
          )}
        </View>
        {isInProgress && (
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: day.color }]} />
          </View>
        )}
      </View>

      <View style={styles.right}>
        {rightSlot ?? (isDone ? (
          <CheckCircle color={colors.success} />
        ) : (
          <ChevronRight color={colors.textSecondary} size={20} />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    ...surfaces.card,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    minHeight: 84,
    overflow: 'hidden',
    ...shadow.sm,
  },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  numBubble: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: { fontSize: 18, fontWeight: '800', color: '#fff', fontFamily: fonts.sans },
  body: { flex: 1, gap: 3 },
  title: { ...(text.title2 as TextStyle), fontSize: 19 },
  focus: { ...(text.bodySecondary as TextStyle), fontSize: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  meta: { ...(text.monoCaption as TextStyle), fontWeight: '600' },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.textMuted },
  track: { height: 3, backgroundColor: colors.border, borderRadius: radius.full, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.full },
  right: { paddingHorizontal: 4 },
});
