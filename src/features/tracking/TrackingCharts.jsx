import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, spacing, surfaces, text } from '../../theme';
import { BarChart, SectionLabel, TrendChip } from '../../ui';
import { useSettingsData } from '../../shell/store';
import { fromLb, unitLabel } from '../../utils/units';
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


export function TrackingCharts({ sessions }) {
  const { unitSystem } = useSettingsData();
  const unit = unitLabel(unitSystem);
  const last7 = useMemo(() => workoutsByDayLastN(sessions, 7), [sessions]);
  // Volume math stays in lb (storage unit); we project to display unit at
  // the boundary so the bar heights and trend chip scale identically.
  const weekly = useMemo(
    () => weeklyVolume(sessions, 4).map(w => ({ ...w, volume: fromLb(w.volume, unitSystem) })),
    [sessions, unitSystem],
  );
  const perSession = useMemo(() => {
    const valid = sessions.filter(s => s.completedAt && !s.abandonedAt);
    return valid.slice(0, SESSIONS).reverse().map(s => ({
      value: fromLb(sessionVolume(s), unitSystem),
      label: shortDate(new Date(s.completedAt ?? s.startedAt)),
      accent: s.dayColor,
    }));
  }, [sessions, unitSystem]);
  const trend = useMemo(() => volumeTrend(sessions, 4), [sessions]);
  const trendCurrentDisplay = fromLb(trend.current, unitSystem);

  const totalCount = last7.reduce((a, b) => a + b.count, 0);

  if (totalCount === 0 && perSession.length === 0 && trend.current === 0) return null;

  // Filled days get a clear success-green; today is highlighted via the
  // bold X-axis label (handled inside BarChart). Empty days fade out via
  // the chart's built-in low-opacity rule for value=0 bars.
  const last7Bars = last7.map(d => ({
    value: d.volume,
    label: d.dayLabel,
    accent: colors.success,
    isToday: d.isToday,
  }));

  const weeklyBars = weekly.map(w => ({ value: w.volume, label: w.label }));

  return (
    <View style={s.wrap}>
      <SectionLabel>TRENDS</SectionLabel>

      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Last 7 days</Text>
            <Text style={s.cardSub}>{totalCount} workout{totalCount === 1 ? '' : 's'}</Text>
          </View>
        </View>
        <BarChart bars={last7Bars} color={colors.success} height={110} />
      </View>

      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Volume this period</Text>
            <Text style={s.cardSub}>
              <Text style={s.cardSubVal}>{compactNum(trendCurrentDisplay)}</Text> {unit} · last 4 weeks
            </Text>
          </View>
          <TrendChip delta={trend.deltaPercent} />
        </View>
        <BarChart bars={weeklyBars} color={colors.success} height={110} />
      </View>

      {perSession.length > 0 && (
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Volume per session</Text>
              <Text style={s.cardSub}>last {perSession.length} · color = day</Text>
            </View>
          </View>
          <BarChart bars={perSession} color={colors.text} height={120} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: spacing.sm, marginTop: spacing.sm },
  card: {
    ...surfaces.card,
    padding: spacing.md, gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { ...text.title3, fontSize: 17 },
  cardSub: { ...text.bodySecondary, fontSize: 13 },
  cardSubVal: { color: colors.text, fontWeight: '700', fontFamily: fonts.mono },
});
