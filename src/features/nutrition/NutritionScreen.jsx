import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, layout, macroColors, spacing } from '../../theme';
import { useNutritionData } from '../../shell/store';
import { CalorieRing, MacroRing } from '../../components/nutrition/MacroRing';
import { ScreenHeader } from '../../components/primitives/ScreenHeader';
import { GoalsSheet } from './GoalsSheet';
import { AddFoodSheet } from './AddFoodSheet/AddFoodSheet';
import { FoodLog } from './FoodLog';
import { NutritionTrends } from './NutritionTrends';
import { DateStrip } from './DateStrip';
import { CaptureCard } from './CaptureCard';
import { formatDateKey, totalsForDay } from './hooks/useNutritionLog';
import { startOfDay } from '../../utils/date';

function RingsBlock({ totals, goals }) {
  return (
    <View style={rb.wrap}>
      <CalorieRing value={totals.calories} goal={goals.calories} color={macroColors.calories} />
      <View style={rb.row}>
        <MacroRing label="Protein" value={totals.protein} goal={goals.protein} color={macroColors.protein} />
        <MacroRing label="Carbs" value={totals.carbs} goal={goals.carbs} color={macroColors.carbs} />
        <MacroRing label="Fat" value={totals.fat} goal={goals.fat} color={macroColors.fat} />
        <MacroRing label="Fiber" value={totals.fiber} goal={goals.fiber} color={macroColors.fiber} />
      </View>
    </View>
  );
}
const rb = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: spacing.sm },
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
      const fallbackName = newItems.slice(0, 2).map(i => i.name).join(', ')
        + (newItems.length > 2 ? ` +${newItems.length - 2}` : '');
      const meal = {
        name: meta?.mealName || fallbackName,
        quantity: newItems.length,
        unit: 'items',
        ...totalsForDay(newItems),
        source: newItems[0]?.source ?? null,
        notes: newItems[0]?.notes ?? null,
        confidence: newItems[0]?.confidence ?? null,
        components: newItems.map(({ name, quantity, unit, calories, protein, carbs, fat, fiber }) => ({
          name, quantity, unit, calories, protein, carbs, fat, fiber,
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
        <ScreenHeader
          eyebrow={`${Math.round(totals.calories)} / ${goals.calories} KCAL`}
          title="Nutrition"
          actionLabel="Edit goals"
          onActionPress={() => setGoalsOpen(true)}
        />

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

        <View style={{ marginTop: spacing.lg }}>
          <NutritionTrends logsByDate={logsByDate} goals={goals} />
        </View>

        <View style={{ height: layout.tabBarClearance }} />
      </ScrollView>

      <GoalsSheet visible={goalsOpen} goals={goals} onSave={setGoals} onClose={() => setGoalsOpen(false)} />
      <AddFoodSheet visible={addOpen} initialTab={addInitial} onClose={() => setAddOpen(false)} onLogItems={handleLogItems} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg },

  captureWrap: { marginBottom: spacing.md },

  logWrap: { marginTop: spacing.md, marginBottom: spacing.sm },
});
