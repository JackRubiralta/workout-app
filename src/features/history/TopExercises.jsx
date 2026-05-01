import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Polyline, Circle } from 'react-native-svg';
import { colors, fonts, spacing, surfaces, text } from '../../theme';
import { SectionLabel } from '../../components/primitives/SectionLabel';
import { topExercises, topSetPerSession, epley } from '../workout/logic/suggestions';

const MAX_POINTS = 10;

function MiniSparkline({ points, color, width = 90, height = 32 }) {
  if (points.length < 2) {
    return <View style={{ width, height, alignItems: 'flex-end', justifyContent: 'center' }}>
      <Text style={{ ...text.monoCaption, color: colors.textTertiary }}>—</Text>
    </View>;
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

function ChevronIcon({ color, size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function TopExercises({ sessions, onPressExercise }) {
  const tops = useMemo(() => topExercises(sessions, 4), [sessions]);

  const rows = useMemo(() => tops.map(({ name, sessionCount }) => {
    const series = topSetPerSession(sessions, name).slice(0, MAX_POINTS).reverse();
    const weights = series.map(({ entry }) => entry.weight);
    const e1rms = series.map(({ entry }) => Math.round(epley(entry.weight, entry.reps)));
    const last = series[series.length - 1]?.entry;
    const first = series[0]?.entry;
    const deltaWeight = last && first ? Math.round((last.weight - first.weight) * 10) / 10 : null;
    return {
      name,
      sessionCount,
      weights,
      e1rms,
      last,
      deltaWeight,
    };
  }), [tops, sessions]);

  if (rows.length === 0) return null;

  return (
    <View style={s.wrap}>
      <SectionLabel>TOP EXERCISES</SectionLabel>
      <View style={s.list}>
        {rows.map((r, i) => {
          const trendColor = r.deltaWeight == null ? colors.textSecondary
            : r.deltaWeight > 0 ? colors.success
            : r.deltaWeight < 0 ? colors.warning
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
                <Text style={s.name} numberOfLines={1}>{r.name}</Text>
                <View style={s.metaRow}>
                  <Text style={s.meta}>
                    <Text style={[s.metaVal, { color: colors.text }]}>{r.last?.weight ?? '—'}</Text> lb × {r.last?.reps ?? '—'}
                  </Text>
                  {r.deltaWeight != null && r.deltaWeight !== 0 && (
                    <Text style={[s.deltaText, { color: trendColor }]}>
                      {r.deltaWeight > 0 ? '+' : ''}{r.deltaWeight} lb
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
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
  },
  name: { ...text.title3, fontSize: 15, color: colors.text, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  meta: { ...text.bodySecondary, fontSize: 12, color: colors.textSecondary, fontFamily: fonts.mono },
  metaVal: { fontWeight: '700' },
  deltaText: { fontSize: 11, fontFamily: fonts.mono, fontWeight: '700', letterSpacing: 0.2 },
  sparkWrap: { width: 90, height: 32, alignItems: 'flex-end' },
});
