import React from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { colors, fonts, radius, spacing, surfaces, text } from '@/shared/theme';
import { workoutsByDayLastN } from '../utils/volumeUtils';
import type { WorkoutSession } from '../types/workoutTypes';

// Compact 7-day activity strip: small dots for each day with the day label
// underneath. Filled = workout that day, hollow = empty, outlined = today.

export type WeekStripProps = {
  sessions: ReadonlyArray<WorkoutSession>;
};

export function WeekStrip({ sessions }: WeekStripProps) {
  const days = workoutsByDayLastN(sessions, 7);
  const total = days.reduce((a, b) => a + b.count, 0);
  const max = Math.max(1, ...days.map(d => d.volume));

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <Text style={text.eyebrowSmall as TextStyle}>THIS WEEK</Text>
        <Text style={s.count}>
          {total} workout{total === 1 ? '' : 's'}
        </Text>
      </View>
      <View style={s.bars}>
        {days.map((d, i) => {
          const ratio = d.volume > 0 ? d.volume / max : 0;
          const filled = d.count > 0;
          return (
            <View key={i} style={s.col}>
              <View style={s.barTrack}>
                <View
                  style={[
                    s.barFill,
                    {
                      height: `${Math.max(filled ? 18 : 0, ratio * 100)}%`,
                      backgroundColor: filled ? colors.success : 'transparent',
                    },
                    d.isToday && !filled && s.todayDot,
                  ]}
                />
              </View>
              <Text style={[s.dayLabel, d.isToday && s.todayLabel]}>{d.dayLabel}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    ...surfaces.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { ...(text.bodySecondary as TextStyle), fontSize: 12, fontWeight: '600' },
  bars: { flexDirection: 'row', gap: 6, height: 56, alignItems: 'flex-end' },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: {
    width: '100%',
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: radius.sm, minHeight: 4 },
  todayDot: {
    borderWidth: 1.5,
    borderColor: colors.text,
    borderRadius: 4,
    height: '20%',
    backgroundColor: 'transparent',
  },
  dayLabel: { fontSize: 10, color: colors.textTertiary, fontFamily: fonts.mono, fontWeight: '700', letterSpacing: 0.4 },
  todayLabel: { color: colors.text },
});
