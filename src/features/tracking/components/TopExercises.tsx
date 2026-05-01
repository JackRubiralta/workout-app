import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, type TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Polyline, Circle } from 'react-native-svg';
import { colors, fonts, spacing, surfaces, text } from '@/shared/theme';
import { SectionLabel } from '@/shared/components/SectionLabel';
import { useSettingsData } from '@/shared/state/store';
import { fromLb, unitLabel } from '@/shared/utils/units';
import { topExercises, topSetPerSession, epley } from '@/features/workouts/utils/suggestionsUtils';
import { TOP_EXERCISES_COUNT, TOP_EXERCISES_POINTS } from '../constants/trackingConstants';
import type { WorkoutSession } from '@/features/workouts/types/workoutTypes';

type MiniSparklineProps = {
  points: number[];
  color: string;
  width?: number;
  height?: number;
};

function MiniSparkline({ points, color, width = 90, height = 32 }: MiniSparklineProps) {
  if (points.length < 2) {
    return (
      <View style={{ width, height, alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text style={{ ...(text.monoCaption as TextStyle), color: colors.textTertiary }}>—</Text>
      </View>
    );
  }
  const padX = 2;
  const padY = 4;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);
  const stepX = innerW / (points.length - 1);
  const xy = points.map((v, i) => ({
    x: padX + i * stepX,
    y: padY + innerH - ((v - min) / range) * innerH,
  }));
  const polyline = xy.map(p => `${p.x},${p.y}`).join(' ');
  const last = xy[xy.length - 1];
  return (
    <Svg width={width} height={height}>
      <Polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={last.x} cy={last.y} r={2.5} fill={color} />
    </Svg>
  );
}

function ChevronIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export type TopExercisesProps = {
  sessions: ReadonlyArray<WorkoutSession>;
  onPressExercise?: (name: string) => void;
};

export function TopExercises({ sessions, onPressExercise }: TopExercisesProps) {
  const { unitSystem } = useSettingsData();
  const unit = unitLabel(unitSystem);
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const tops = useMemo(() => topExercises(sessions, TOP_EXERCISES_COUNT), [sessions]);

  const rows = useMemo(
    () =>
      tops.map(({ name, sessionCount }) => {
        const series = topSetPerSession(sessions, name).slice(0, TOP_EXERCISES_POINTS).reverse();
        const weights = series.map(({ entry }) => round1(fromLb(entry.weight, unitSystem)));
        const last = series[series.length - 1]?.entry;
        const first = series[0]?.entry;
        const deltaWeight =
          last && first
            ? round1(fromLb(last.weight, unitSystem) - fromLb(first.weight, unitSystem))
            : null;
        return {
          name,
          sessionCount,
          weights,
          last,
          lastDisplay: last ? round1(fromLb(last.weight, unitSystem)) : null,
          deltaWeight,
        };
      }),
    [tops, sessions, unitSystem],
  );

  if (rows.length === 0) return null;

  return (
    <View style={s.wrap}>
      <SectionLabel>TOP EXERCISES</SectionLabel>
      <View style={s.list}>
        {rows.map((r, i) => {
          const trendColor =
            r.deltaWeight == null
              ? colors.textSecondary
              : r.deltaWeight > 0
                ? colors.success
                : r.deltaWeight < 0
                  ? colors.warning
                  : colors.textSecondary;
          return (
            <TouchableOpacity
              key={i}
              style={s.row}
              activeOpacity={0.75}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onPressExercise?.(r.name);
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.name} numberOfLines={1}>
                  {r.name}
                </Text>
                <View style={s.metaRow}>
                  <Text style={s.meta}>
                    <Text style={[s.metaVal, { color: colors.text }]}>
                      {r.lastDisplay ?? '—'}
                    </Text>{' '}
                    {unit} × {r.last?.reps ?? '—'}
                  </Text>
                  {r.deltaWeight != null && r.deltaWeight !== 0 && (
                    <Text style={[s.deltaText, { color: trendColor }]}>
                      {r.deltaWeight > 0 ? '+' : ''}
                      {r.deltaWeight} {unit}
                    </Text>
                  )}
                </View>
              </View>
              <View style={s.sparkWrap}>
                <MiniSparkline points={r.weights} color={trendColor} />
              </View>
              <ChevronIcon color={colors.textTertiary} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: spacing.sm, marginTop: spacing.sm },
  list: { gap: 6 },
  row: {
    ...surfaces.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  name: { ...(text.title3 as TextStyle), fontSize: 15, color: colors.text, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  meta: { ...(text.bodySecondary as TextStyle), fontSize: 12, color: colors.textSecondary, fontFamily: fonts.mono },
  metaVal: { fontWeight: '700' },
  deltaText: { fontSize: 11, fontFamily: fonts.mono, fontWeight: '700', letterSpacing: 0.2 },
  sparkWrap: { width: 90, height: 32, alignItems: 'flex-end' },
});
