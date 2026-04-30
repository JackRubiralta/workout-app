import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, fontSize, radius, spacing, text } from '../../theme';
import { BarChart } from '../../components/primitives/BarChart';
import {
  sessionVolume, workoutsByDayLastN, weeklyVolume, volumeTrend,
} from '../workout/logic/volume';

const SESSIONS = 8;

function shortDate(d) {
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
}

function compactNum(v) {
  if (v >= 10000) return `${(v / 1000).toFixed(1)}k`;
  if (v >= 1000) return `${Math.round(v / 100) / 10}k`;
  return String(Math.round(v));
}

function ArrowUp({ color, size = 12 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12l7-7 7 7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function ArrowDown({ color, size = 12 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12l7 7 7-7" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function TrendChip({ deltaPercent }) {
  if (deltaPercent == null) return null;
  const flat = Math.abs(deltaPercent) < 3;
  const up = deltaPercent > 0;
  const accent = flat ? colors.textSecondary : up ? colors.success : colors.danger;
  const bg = flat ? colors.surfaceElevated : (up ? colors.success : colors.danger) + '22';
  const border = flat ? colors.border : accent + '50';
  return (
    <View style={[chip.wrap, { borderColor: border, backgroundColor: bg }]}>
      {!flat && (up
        ? <ArrowUp color={accent} />
        : <ArrowDown color={accent} />)}
      <Text style={[chip.text, { color: accent }]}>
        {up && !flat ? '+' : ''}{deltaPercent}%
      </Text>
    </View>
  );
}

const chip = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full, borderWidth: 1,
  },
  text: { fontSize: 11, fontWeight: '800', fontFamily: fonts.mono, letterSpacing: 0.4 },
});

export function HistoryCharts({ sessions }) {
  const last7 = useMemo(() => workoutsByDayLastN(sessions, 7), [sessions]);
  const weekly = useMemo(() => weeklyVolume(sessions, 4), [sessions]);
  const perSession = useMemo(() => {
    const valid = sessions.filter(s => s.completedAt && !s.abandonedAt);
    return valid.slice(0, SESSIONS).reverse().map(s => ({
      value: sessionVolume(s),
      label: shortDate(new Date(s.completedAt ?? s.startedAt)),
      accent: s.dayColor,
    }));
  }, [sessions]);
  const trend = useMemo(() => volumeTrend(sessions, 4), [sessions]);

  const totalCount = last7.reduce((a, b) => a + b.count, 0);

  if (totalCount === 0 && perSession.length === 0 && trend.current === 0) return null;

  const last7Bars = last7.map(d => ({
    value: d.volume,
    label: d.dayLabel,
    accent: d.isToday ? colors.text : colors.textSecondary,
  }));

  const weeklyBars = weekly.map(w => ({ value: w.volume, label: w.label }));

  return (
    <View style={s.wrap}>
      <Text style={[text.eyebrow, s.eyebrow]}>TRENDS</Text>

      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Last 7 days</Text>
            <Text style={s.cardSub}>{totalCount} workout{totalCount === 1 ? '' : 's'}</Text>
          </View>
        </View>
        <BarChart bars={last7Bars} color={colors.text} height={110} width={320} />
      </View>

      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Volume this period</Text>
            <Text style={s.cardSub}>
              <Text style={s.cardSubVal}>{compactNum(trend.current)}</Text> lb · last 4 weeks
            </Text>
          </View>
          <TrendChip deltaPercent={trend.deltaPercent} />
        </View>
        <BarChart bars={weeklyBars} color={colors.success} height={110} width={320} />
      </View>

      {perSession.length > 0 && (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Volume per session</Text>
              <Text style={s.cardSub}>last {perSession.length} · color = day</Text>
            </View>
          </View>
          <BarChart bars={perSession} color={colors.text} height={120} width={320} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: spacing.sm, marginTop: spacing.sm },
  eyebrow: { color: colors.textTertiary, marginLeft: 2, marginBottom: 2 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { ...text.title3, fontSize: 17 },
  cardSub: { ...text.bodySecondary, fontSize: 13 },
  cardSubVal: { color: colors.text, fontWeight: '700', fontFamily: fonts.mono },
});
