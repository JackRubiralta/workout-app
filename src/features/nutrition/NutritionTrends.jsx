import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, macroColors, radius, spacing, text } from '../../theme';
import { BarChart } from '../../components/primitives/BarChart';
import { totalsForDay } from './hooks/useNutritionLog';

const DAYS = 7;

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function shortDay(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1);
}

function buildSeries(logsByDate, days = DAYS) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const items = logsByDate[dateKey(d)] ?? [];
    const t = totalsForDay(items);
    out.push({ d, calories: t.calories, protein: t.protein, isToday: i === 0 });
  }
  return out;
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

function TrendChip({ delta, suffix = '%' }) {
  if (delta == null) return null;
  const flat = Math.abs(delta) < 3;
  const up = delta > 0;
  const accent = flat ? colors.textSecondary : up ? colors.success : colors.warning;
  const bg = flat ? colors.surfaceElevated : (up ? colors.success : colors.warning) + '22';
  const border = flat ? colors.border : accent + '50';
  return (
    <View style={chip.wrap}>
      <View style={[chip.inner, { backgroundColor: bg, borderColor: border }]}>
        {!flat && (up ? <ArrowUp color={accent} /> : <ArrowDown color={accent} />)}
        <Text style={[chip.text, { color: accent }]}>{up && !flat ? '+' : ''}{delta}{suffix}</Text>
      </View>
    </View>
  );
}

const chip = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  inner: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full, borderWidth: 1,
  },
  text: { fontSize: 11, fontWeight: '800', fontFamily: fonts.mono, letterSpacing: 0.4 },
});

function avgVs(prev, recent) {
  if (!prev || prev <= 0) return null;
  return Math.round(((recent - prev) / prev) * 100);
}

export function NutritionTrends({ logsByDate, goals }) {
  const series = buildSeries(logsByDate);
  const prevSeries = (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const out = [];
    for (let i = 13; i >= 7; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const items = logsByDate[dateKey(d)] ?? [];
      const t = totalsForDay(items);
      out.push({ calories: t.calories, protein: t.protein });
    }
    return out;
  })();

  const calBars = series.map(s => ({ value: Math.round(s.calories), label: shortDay(s.d) }));
  const proteinBars = series.map(s => ({ value: Math.round(s.protein), label: shortDay(s.d) }));
  const avg7Cal = Math.round(series.reduce((a, b) => a + b.calories, 0) / series.length);
  const avg7Pro = Math.round(series.reduce((a, b) => a + b.protein, 0) / series.length);
  const prevAvgCal = prevSeries.reduce((a, b) => a + b.calories, 0) / prevSeries.length;
  const prevAvgPro = prevSeries.reduce((a, b) => a + b.protein, 0) / prevSeries.length;
  const calDelta = avgVs(prevAvgCal, avg7Cal);
  const proDelta = avgVs(prevAvgPro, avg7Pro);

  return (
    <View style={s.wrap}>
      <View style={s.headerRow}>
        <Text style={text.eyebrow}>LAST 7 DAYS</Text>
      </View>

      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Calories</Text>
            <Text style={s.cardSub}>avg <Text style={s.cardSubVal}>{avg7Cal}</Text> · goal {goals.calories}</Text>
          </View>
          <TrendChip delta={calDelta} />
        </View>
        <BarChart bars={calBars} color={macroColors.calories} goal={goals.calories} height={120} width={320} />
      </View>

      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Protein</Text>
            <Text style={s.cardSub}>avg <Text style={s.cardSubVal}>{avg7Pro}g</Text> · goal {goals.protein}g</Text>
          </View>
          <TrendChip delta={proDelta} />
        </View>
        <BarChart bars={proteinBars} color={macroColors.protein} goal={goals.protein} height={110} width={320} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: spacing.sm },
  headerRow: { paddingHorizontal: 2, marginTop: spacing.sm },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  cardTitle: { ...text.title3, fontSize: 17 },
  cardSub: { ...text.bodySecondary, fontSize: 13 },
  cardSubVal: { color: colors.text, fontWeight: '700' },
});
