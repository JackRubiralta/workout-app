import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, macroColors, spacing, surfaces, text } from '../../theme';
import { BarChart, SectionLabel, TrendChip } from '../../components/primitives';
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
      <SectionLabel style={s.label}>LAST 7 DAYS</SectionLabel>

      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Calories</Text>
            <Text style={s.cardSub}>avg <Text style={s.cardSubVal}>{avg7Cal}</Text> · goal {goals.calories}</Text>
          </View>
          <TrendChip delta={calDelta} downColor={colors.warning} />
        </View>
        <BarChart bars={calBars} color={macroColors.calories} goal={goals.calories} height={120} />
      </View>

      <View style={s.card}>
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitle}>Protein</Text>
            <Text style={s.cardSub}>avg <Text style={s.cardSubVal}>{avg7Pro}g</Text> · goal {goals.protein}g</Text>
          </View>
          <TrendChip delta={proDelta} downColor={colors.warning} />
        </View>
        <BarChart bars={proteinBars} color={macroColors.protein} goal={goals.protein} height={110} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: spacing.sm },
  label: { marginTop: spacing.sm },
  card: {
    ...surfaces.card,
    padding: spacing.md, gap: spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  cardTitle: { ...text.title3, fontSize: 17 },
  cardSub: { ...text.bodySecondary, fontSize: 13 },
  cardSubVal: { color: colors.text, fontWeight: '700' },
});
