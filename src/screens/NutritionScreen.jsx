import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, spacing, radius, fontSize, shadow } from '../constants/theme';
import { CalorieRing, MacroRing } from '../components/MacroRing';
import { GoalsModal } from '../components/GoalsModal';
import { AddFoodModal } from '../components/AddFoodModal';
import { formatDateKey, totalsForDay } from '../hooks/useNutritionLog';

// ─── Date helpers ──────────────────────────────────────────────────────────

function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function addDays(d, n) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatDateLong(d) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const MACRO_COLORS = {
  calories: '#FF4757',
  protein: '#3742FA',
  carbs: '#FFA502',
  fat: '#A55EEA',
};

// ─── Date Pager ────────────────────────────────────────────────────────────

function DatePager({ date, onChange }) {
  const today = startOfDay(new Date());
  const isToday = isSameDay(date, today);
  const isFuture = date > today;

  const goPrev = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onChange(addDays(date, -1));
  }, [date, onChange]);

  const goNext = useCallback(() => {
    if (isToday) return;
    Haptics.selectionAsync().catch(() => {});
    onChange(addDays(date, 1));
  }, [date, isToday, onChange]);

  const goToday = useCallback(() => {
    if (isToday) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onChange(today);
  }, [isToday, onChange, today]);

  return (
    <View style={pager.outer}>
      <TouchableOpacity onPress={goPrev} hitSlop={12} style={pager.arrowBtn} activeOpacity={0.6}>
        <Text style={pager.arrow}>‹</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goToday} activeOpacity={0.7} style={pager.dateBtn}>
        <Text style={pager.date}>{isToday ? 'Today' : formatDateLong(date)}</Text>
        {!isToday && <Text style={pager.dateSub}>tap for today</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={goNext}
        hitSlop={12}
        style={[pager.arrowBtn, isToday && { opacity: 0.25 }]}
        activeOpacity={0.6}
        disabled={isToday || isFuture}
      >
        <Text style={pager.arrow}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const pager = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  arrowBtn: {
    width: 40, height: 40, borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  arrow: { fontSize: 22, color: colors.text, fontWeight: '300', lineHeight: 26, marginTop: -2 },
  dateBtn: { alignItems: 'center', flex: 1, gap: 1 },
  date: {
    fontSize: fontSize.title2,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fonts.serif,
    letterSpacing: 0.3,
  },
  dateSub: { fontSize: 10, color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 0.6, fontWeight: '600' },
});

// ─── Capture Bar (top of page) ─────────────────────────────────────────────

function CaptureBar({ onScan, onDescribe }) {
  return (
    <View style={cap.wrap}>
      <TouchableOpacity style={cap.scanBtn} onPress={onScan} activeOpacity={0.85}>
        <Text style={cap.scanIcon}>📷</Text>
        <View style={cap.scanTextWrap}>
          <Text style={cap.scanTitle}>Snap a photo</Text>
          <Text style={cap.scanSub}>Logs the food and the time automatically</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={cap.descBtn} onPress={onDescribe} activeOpacity={0.7}>
        <Text style={cap.descText}>Describe instead</Text>
      </TouchableOpacity>
    </View>
  );
}

const cap = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    backgroundColor: colors.text,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadow.sm,
  },
  scanIcon: { fontSize: 28 },
  scanTextWrap: { flex: 1, gap: 2 },
  scanTitle: {
    fontSize: fontSize.headline,
    fontWeight: '700',
    color: colors.background,
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
  },
  scanSub: {
    fontSize: fontSize.caption,
    color: colors.background,
    fontFamily: fonts.mono,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  descBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
  },
  descText: {
    fontSize: fontSize.footnote,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
});

// ─── Rings Block ───────────────────────────────────────────────────────────

function RingsBlock({ totals, goals, onSetGoals }) {
  return (
    <View style={rings.wrap}>
      <CalorieRing value={totals.calories} goal={goals.calories} color={MACRO_COLORS.calories} />
      <View style={rings.row}>
        <MacroRing label="Protein" value={totals.protein} goal={goals.protein} color={MACRO_COLORS.protein} />
        <MacroRing label="Carbs" value={totals.carbs} goal={goals.carbs} color={MACRO_COLORS.carbs} />
        <MacroRing label="Fat" value={totals.fat} goal={goals.fat} color={MACRO_COLORS.fat} />
      </View>
      <TouchableOpacity onPress={onSetGoals} style={rings.goalsBtn} activeOpacity={0.7}>
        <Text style={rings.goalsText}>Set Goals</Text>
      </TouchableOpacity>
    </View>
  );
}

const rings = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingHorizontal: spacing.md },
  goalsBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalsText: {
    fontSize: fontSize.footnote,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    letterSpacing: 0.5,
  },
});

// ─── Food log (chronological) ──────────────────────────────────────────────

function FoodRow({ item, onRemove }) {
  const handleLong = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      'Remove item?',
      `Remove "${item.name}" from this day?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onRemove },
      ],
    );
  }, [item.name, onRemove]);

  return (
    <TouchableOpacity onLongPress={handleLong} style={log.row} activeOpacity={0.7}>
      <View style={log.timeCol}>
        <Text style={log.time}>{formatTime(item.addedAt) || '—'}</Text>
      </View>
      <View style={log.rowMain}>
        <Text style={log.rowName} numberOfLines={1}>{item.name}</Text>
        <Text style={log.rowMeta} numberOfLines={1}>
          {item.quantity} {item.unit} · {item.protein}P / {item.carbs}C / {item.fat}F
        </Text>
      </View>
      <Text style={log.rowKcal}>{item.calories}</Text>
    </TouchableOpacity>
  );
}

function FoodLog({ items, onRemove }) {
  if (!items.length) {
    return (
      <View style={log.emptyBox}>
        <Text style={log.emptyTitle}>Nothing logged yet</Text>
        <Text style={log.emptySub}>
          Tap "Snap a photo" above to record what you just ate.
        </Text>
      </View>
    );
  }

  return (
    <View style={log.section}>
      <View style={log.headerRow}>
        <Text style={log.title}>FOOD LOG</Text>
        <Text style={log.count}>{items.length} item{items.length === 1 ? '' : 's'}</Text>
      </View>
      <View style={log.list}>
        {items.map(item => (
          <FoodRow key={item.id} item={item} onRemove={() => onRemove(item.id)} />
        ))}
      </View>
    </View>
  );
}

const log = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    ...shadow.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    letterSpacing: 1.5,
  },
  count: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
  },
  list: { gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm + 2,
    gap: spacing.sm,
  },
  timeCol: { width: 56 },
  time: {
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  rowMain: { flex: 1, gap: 2 },
  rowName: { fontSize: fontSize.subhead, fontWeight: '700', color: colors.text, fontFamily: fonts.mono },
  rowMeta: { fontSize: fontSize.caption, color: colors.textSecondary, fontFamily: fonts.mono, letterSpacing: 0.2 },
  rowKcal: {
    fontSize: fontSize.subhead,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fonts.mono,
    minWidth: 50,
    textAlign: 'right',
  },

  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSize.title3,
    fontWeight: '700',
    color: colors.textSecondary,
    fontFamily: fonts.serif,
  },
  emptySub: {
    fontSize: fontSize.footnote,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    textAlign: 'center',
    lineHeight: 18,
  },
});

// ─── Daily Totals Bar ──────────────────────────────────────────────────────

function DailyTotalsBar({ totals, goals }) {
  const cells = [
    { label: 'Cal', val: totals.calories, goal: goals.calories, color: MACRO_COLORS.calories, unit: '' },
    { label: 'P', val: totals.protein, goal: goals.protein, color: MACRO_COLORS.protein, unit: 'g' },
    { label: 'C', val: totals.carbs, goal: goals.carbs, color: MACRO_COLORS.carbs, unit: 'g' },
    { label: 'F', val: totals.fat, goal: goals.fat, color: MACRO_COLORS.fat, unit: 'g' },
    { label: 'Fiber', val: totals.fiber, goal: null, color: colors.textSecondary, unit: 'g' },
  ];
  return (
    <View style={tb.wrap}>
      <Text style={tb.heading}>DAILY TOTALS</Text>
      <View style={tb.row}>
        {cells.map(c => (
          <View key={c.label} style={tb.cell}>
            <Text style={[tb.val, { color: c.color }]}>
              {Math.round(c.val)}
              {c.unit ? <Text style={tb.unit}>{c.unit}</Text> : null}
            </Text>
            <Text style={tb.label}>{c.label}</Text>
            {c.goal != null ? (
              <Text style={tb.remaining}>{Math.max(c.goal - Math.round(c.val), 0)} left</Text>
            ) : (
              <Text style={tb.remaining}> </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const tb = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
  },
  heading: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 1.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  cell: { alignItems: 'center', flex: 1, gap: 2 },
  val: { fontSize: fontSize.title3, fontWeight: '700', fontFamily: fonts.mono },
  unit: { fontSize: fontSize.footnote, fontWeight: '600', color: colors.textTertiary },
  label: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 1, textTransform: 'uppercase' },
  remaining: { fontSize: 9, color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 0.3 },
});

// ─── Screen ────────────────────────────────────────────────────────────────

export function NutritionScreen({ logsByDate, goals, addFood, removeFood, setGoals }) {
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addInitialTab, setAddInitialTab] = useState('scan');

  const dateKey = formatDateKey(date);
  const items = useMemo(() => logsByDate[dateKey] ?? [], [logsByDate, dateKey]);
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.addedAt ?? '').localeCompare(b.addedAt ?? '')),
    [items],
  );
  const totals = useMemo(() => totalsForDay(items), [items]);

  const openAdd = useCallback((tab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAddInitialTab(tab);
    setAddOpen(true);
  }, []);

  const handleLogItems = useCallback((newItems) => {
    for (const item of newItems) {
      addFood(dateKey, item);
    }
    setAddOpen(false);
  }, [dateKey, addFood]);

  const handleRemoveItem = useCallback((itemId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    removeFood(dateKey, itemId);
  }, [dateKey, removeFood]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Nutrition</Text>
          <Text style={styles.headerSub}>
            {totals.calories > 0
              ? `${Math.round(totals.calories)} / ${goals.calories} kcal`
              : `Goal · ${goals.calories} kcal`}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollPad}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <DatePager date={date} onChange={setDate} />

        <CaptureBar onScan={() => openAdd('scan')} onDescribe={() => openAdd('search')} />

        <View key={dateKey}>
          <RingsBlock totals={totals} goals={goals} onSetGoals={() => setGoalsOpen(true)} />
        </View>

        <View style={styles.logWrap}>
          <FoodLog items={sortedItems} onRemove={handleRemoveItem} />
        </View>

        <DailyTotalsBar totals={totals} goals={goals} />

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <GoalsModal
        visible={goalsOpen}
        goals={goals}
        onSave={setGoals}
        onClose={() => setGoalsOpen(false)}
      />

      <AddFoodModal
        visible={addOpen}
        initialTab={addInitialTab}
        onClose={() => setAddOpen(false)}
        onLogItems={handleLogItems}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: fontSize.largeTitle,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.37,
    fontFamily: fonts.serif,
  },
  headerSub: {
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
    fontFamily: fonts.mono,
  },
  scrollPad: { paddingBottom: spacing.lg },
  logWrap: { paddingHorizontal: spacing.md, marginTop: spacing.xs, marginBottom: spacing.sm },
});
