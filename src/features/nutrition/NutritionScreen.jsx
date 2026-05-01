import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, fonts, fontSize, macroColors, radius, shadow, spacing, text } from '../../theme';
import { useNutritionData } from '../../shell/store';
import { CalorieRing, MacroRing } from '../../components/nutrition/MacroRing';
import { GoalsSheet } from './GoalsSheet';
import { AddFoodSheet } from './AddFoodSheet/AddFoodSheet';
import { FoodLog } from './FoodLog';
import { DailyTotalsBar } from './DailyTotalsBar';
import { NutritionTrends } from './NutritionTrends';
import { formatDateKey, totalsForDay } from './hooks/useNutritionLog';

function startOfDay(d) {
  const c = new Date(d); c.setHours(0, 0, 0, 0); return c;
}
function addDays(d, n) {
  const c = new Date(d); c.setDate(c.getDate() + n); return c;
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatDateLong(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function ChevLeft({ color, size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function ChevRight({ color, size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function CameraIcon({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9V19a1 1 0 0 0 1 1H20a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H17l-2-3H9L7 8H4a1 1 0 0 0-1 1z"
            stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <Circle cx={12} cy={13} r={3.5} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

function DateStrip({ date, onChange }) {
  const today = startOfDay(new Date());
  const isToday = isSameDay(date, today);
  const goPrev = () => { Haptics.selectionAsync().catch(() => {}); onChange(addDays(date, -1)); };
  const goNext = () => { if (isToday) return; Haptics.selectionAsync().catch(() => {}); onChange(addDays(date, 1)); };
  const goToday = () => { if (isToday) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onChange(today); };

  return (
    <View style={ds.row}>
      <TouchableOpacity onPress={goPrev} hitSlop={8} style={ds.arrow} activeOpacity={0.6}>
        <ChevLeft color={colors.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={goToday} activeOpacity={0.7} style={ds.center}>
        <Text style={ds.label}>{isToday ? 'Today' : formatDateLong(date)}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={goNext} hitSlop={8} style={[ds.arrow, isToday && { opacity: 0.3 }]} activeOpacity={0.6} disabled={isToday}>
        <ChevRight color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}
const ds = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: 4, paddingVertical: 4,
    alignSelf: 'center',
  },
  arrow: { width: 32, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  center: { paddingHorizontal: spacing.md, minWidth: 140, alignItems: 'center' },
  label: { ...text.callout, fontWeight: '700', color: colors.text },
});

function CaptureCard({ onScan }) {
  return (
    <TouchableOpacity style={cap.primary} onPress={onScan} activeOpacity={0.85}>
      <View style={cap.iconCircle}>
        <CameraIcon color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={cap.title}>Add food</Text>
        <Text style={cap.sub}>Photo, describe, or enter manually</Text>
      </View>
    </TouchableOpacity>
  );
}
const cap = StyleSheet.create({
  primary: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    ...shadow.sm,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...text.title3, fontSize: 17 },
  sub: { ...text.bodySecondary, fontSize: 13, marginTop: 2 },
});

function RingsBlock({ totals, goals }) {
  return (
    <View style={rb.wrap}>
      <CalorieRing value={totals.calories} goal={goals.calories} color={macroColors.calories} />
      <View style={rb.row}>
        <MacroRing label="Protein" value={totals.protein} goal={goals.protein} color={macroColors.protein} />
        <MacroRing label="Carbs" value={totals.carbs} goal={goals.carbs} color={macroColors.carbs} />
        <MacroRing label="Fat" value={totals.fat} goal={goals.fat} color={macroColors.fat} />
      </View>
    </View>
  );
}
const rb = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: spacing.lg },
});

export function NutritionScreen({ navigation }) {
  const { logsByDate, goals, addFood, setGoals } = useNutritionData();
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addInitial, setAddInitial] = useState('scan');

  const dateKey = formatDateKey(date);
  const items = useMemo(() => logsByDate[dateKey] ?? [], [logsByDate, dateKey]);
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.addedAt ?? '').localeCompare(b.addedAt ?? '')),
    [items],
  );
  const totals = useMemo(() => totalsForDay(items), [items]);

  const openAdd = (tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAddInitial(tab);
    setAddOpen(true);
  };

  const handleLogItems = (newItems, photos, meta) => {
    if (!newItems || newItems.length === 0) {
      setAddOpen(false);
      return;
    }
    if (newItems.length === 1) {
      addFood(dateKey, newItems[0], photos);
    } else {
      // Multi-component meal — collapse into ONE entry with a components
      // breakdown. Tapping the food log row reveals each part's nutrition.
      const totals = newItems.reduce((acc, it) => ({
        calories: acc.calories + (it.calories ?? 0),
        protein: acc.protein + (it.protein ?? 0),
        carbs: acc.carbs + (it.carbs ?? 0),
        fat: acc.fat + (it.fat ?? 0),
        fiber: acc.fiber + (it.fiber ?? 0),
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

      const fallbackName = newItems.slice(0, 2).map(i => i.name).join(', ')
        + (newItems.length > 2 ? ` +${newItems.length - 2}` : '');

      const meal = {
        name: meta?.mealName || fallbackName,
        quantity: newItems.length,
        unit: newItems.length === 1 ? 'item' : 'items',
        ...totals,
        source: newItems[0]?.source ?? null,
        notes: newItems[0]?.notes ?? null,
        confidence: newItems[0]?.confidence ?? null,
        components: newItems.map(it => ({
          name: it.name,
          quantity: it.quantity,
          unit: it.unit,
          calories: it.calories,
          protein: it.protein,
          carbs: it.carbs,
          fat: it.fat,
          fiber: it.fiber,
        })),
      };
      addFood(dateKey, meal, photos);
    }
    setAddOpen(false);
  };

  const openItem = (id) => {
    navigation.navigate('FoodItemDetail', { dateKey, itemId: id });
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>{totals.calories > 0 ? `${Math.round(totals.calories)} / ${goals.calories} KCAL` : 'NUTRITION'}</Text>
            <Text style={text.hero}>Today</Text>
          </View>
          <TouchableOpacity onPress={() => setGoalsOpen(true)} hitSlop={10} activeOpacity={0.6} style={s.editGoalsBtn}>
            <Text style={s.editGoalsText}>Edit goals</Text>
          </TouchableOpacity>
        </View>

        <View style={s.captureWrap}>
          <CaptureCard onScan={() => openAdd('scan')} />
        </View>

        <DateStrip date={date} onChange={setDate} />

        <View key={dateKey}>
          <RingsBlock totals={totals} goals={goals} />
        </View>

        <View style={s.logWrap}>
          <FoodLog items={sortedItems} onPressItem={openItem} />
        </View>

        <DailyTotalsBar totals={totals} goals={goals} />

        <View style={{ marginTop: spacing.lg }}>
          <NutritionTrends logsByDate={logsByDate} goals={goals} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <GoalsSheet visible={goalsOpen} goals={goals} onSave={setGoals} onClose={() => setGoalsOpen(false)} />
      <AddFoodSheet visible={addOpen} initialTab={addInitial} onClose={() => setAddOpen(false)} onLogItems={handleLogItems} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eyebrow: { ...text.eyebrowSmall, color: colors.textTertiary, marginBottom: 4 },
  editGoalsBtn: { paddingVertical: 6, paddingHorizontal: spacing.sm },
  editGoalsText: { ...text.buttonSmall, color: colors.textSecondary, fontWeight: '600' },

  captureWrap: { marginTop: spacing.md, marginBottom: spacing.md },

  logWrap: { marginTop: spacing.md, marginBottom: spacing.sm },
});
