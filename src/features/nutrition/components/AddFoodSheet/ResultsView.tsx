import React, { useCallback, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, macroColors, radius, spacing } from '@/shared/theme';
import { KeyboardAwareSheetScroll, StatusPill } from '@/shared/components';
import { roundInt, roundTenths } from '@/shared/utils/format';
import { totalsForDay } from '../../utils/nutritionMath';
import { copy } from '@/shared/copy';
import type {
  AnalyzeFoodResult,
  AnalyzedItem,
  ConfidenceValue,
  FoodPhoto,
  FoodSourceValue,
  MacroSet,
} from '../../types/nutritionTypes';

export type ResultsViewItem = AnalyzedItem & { _localId: string };

export type AnalyzeResultsState = Omit<AnalyzeFoodResult, 'items'> & { items: ResultsViewItem[] };

type LogMeta = { mealName: string | null };

export type ResultsViewProps = {
  results: AnalyzeResultsState;
  setResults: (next: AnalyzeResultsState | ((prev: AnalyzeResultsState | null) => AnalyzeResultsState | null)) => void;
  onLog: (
    items: Array<AnalyzedItem & { source: FoodSourceValue | null; notes: string | null; confidence: ConfidenceValue | null }>,
    photos: FoodPhoto[],
    meta: LogMeta,
  ) => void;
  onStartOver: () => void;
  photos: FoodPhoto[];
  source: FoodSourceValue | null;
  notes: string | null;
  confidence?: ConfidenceValue | null;
};

function recomputeTotals(items: ReadonlyArray<ResultsViewItem>): MacroSet {
  const t = totalsForDay(items);
  return {
    calories: roundInt(t.calories),
    protein: roundTenths(t.protein),
    carbs: roundTenths(t.carbs),
    fat: roundTenths(t.fat),
    fiber: roundTenths(t.fiber),
  };
}

function MacroCell({ v, u, c }: { v: number; u: string; c: string }) {
  return (
    <View style={s.macroCell}>
      <Text style={[s.macroVal, { color: c }]}>{v}</Text>
      <Text style={s.macroUnit}>{u}</Text>
    </View>
  );
}

function TotalCell({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View style={s.totalCell}>
      <Text style={[s.totalVal, { color }]}>{value}</Text>
      <Text style={s.totalLabel}>{label}</Text>
    </View>
  );
}

export function ResultsView({
  results,
  setResults,
  onLog,
  onStartOver,
  photos,
  source,
  notes,
  confidence,
}: ResultsViewProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState('');

  const beginEdit = useCallback((item: ResultsViewItem) => {
    setEditingId(item._localId);
    setEditingQty(String(item.quantity));
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingId) return;
    const newQty = parseFloat(editingQty);
    if (isNaN(newQty) || newQty <= 0) {
      setEditingId(null);
      return;
    }
    setResults(prev => {
      if (!prev) return prev;
      const items: ResultsViewItem[] = prev.items.map((it): ResultsViewItem => {
        if (it._localId !== editingId) return it;
        const ratio = newQty / (it.quantity || 1);
        return {
          ...it,
          quantity: newQty,
          calories: roundInt((it.calories || 0) * ratio),
          protein: roundTenths((it.protein || 0) * ratio),
          carbs: roundTenths((it.carbs || 0) * ratio),
          fat: roundTenths((it.fat || 0) * ratio),
          fiber: roundTenths((it.fiber || 0) * ratio),
        };
      });
      return { ...prev, items, totals: recomputeTotals(items) };
    });
    setEditingId(null);
  }, [editingId, editingQty, setResults]);

  const removeItem = useCallback(
    (id: string) => {
      setResults(prev => {
        if (!prev) return prev;
        const items: ResultsViewItem[] = prev.items.filter(it => it._localId !== id);
        return { ...prev, items, totals: recomputeTotals(items) };
      });
    },
    [setResults],
  );

  const handleLog = useCallback(() => {
    if (!results || !results.items.length) return;
    const stamped = results.items.map(({ _localId, ...rest }) => ({
      ...rest,
      source: source ?? null,
      notes: notes ?? results.notes ?? null,
      confidence: confidence ?? results.confidence ?? null,
    }));
    onLog(stamped, photos ?? [], { mealName: results.mealName ?? null });
  }, [results, onLog, photos, source, notes, confidence]);

  const conf = results.confidence;
  const confColor = conf === 'high' ? colors.success : conf === 'low' ? colors.danger : colors.warning;

  return (
    <KeyboardAwareSheetScroll contentContainerStyle={s.pad}>
      <StatusPill label={`${conf.toUpperCase()} CONFIDENCE`} color={confColor} />

      {!!results.notes && (
        <View style={s.noteBox}>
          <Text style={s.noteText}>{results.notes}</Text>
        </View>
      )}

      {results.items.length === 0 && <Text style={s.emptyText}>{copy.empty.resultsRemoved.title}</Text>}

      {results.items.map(it => {
        const isEditing = editingId === it._localId;
        return (
          <View key={it._localId} style={s.itemCard}>
            <View style={s.itemTop}>
              <Text style={s.itemName} numberOfLines={2}>
                {it.name}
              </Text>
              <TouchableOpacity onPress={() => removeItem(it._localId)} hitSlop={8}>
                <Text style={s.itemRemove}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.itemRow}>
              {isEditing ? (
                <View style={s.qtyEdit}>
                  <TextInput
                    style={s.qtyInput}
                    value={editingQty}
                    onChangeText={setEditingQty}
                    keyboardType="decimal-pad"
                    autoFocus
                    onBlur={commitEdit}
                    onSubmitEditing={commitEdit}
                    returnKeyType="done"
                    selectionColor={colors.success}
                  />
                  <Text style={s.itemUnit}>{it.unit}</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={() => beginEdit(it)} style={s.qtyDisplay} activeOpacity={0.7}>
                  <Text style={s.itemQty}>{it.quantity}</Text>
                  <Text style={s.itemUnit}>{it.unit}</Text>
                  <Text style={s.itemEditHint}>edit</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={s.macroRow}>
              <MacroCell v={it.calories} u="kcal" c={macroColors.calories} />
              <MacroCell v={it.protein} u="P" c={macroColors.protein} />
              <MacroCell v={it.carbs} u="C" c={macroColors.carbs} />
              <MacroCell v={it.fat} u="F" c={macroColors.fat} />
              {it.fiber > 0 ? <MacroCell v={it.fiber} u="Fb" c={macroColors.fiber} /> : null}
            </View>
          </View>
        );
      })}

      <View style={s.totalsCard}>
        <Text style={s.totalsLabel}>TOTAL</Text>
        <View style={s.totalsGrid}>
          <TotalCell label="Calories" value={results.totals.calories} color={macroColors.calories} />
          <TotalCell label="Protein" value={`${results.totals.protein}g`} color={macroColors.protein} />
          <TotalCell label="Carbs" value={`${results.totals.carbs}g`} color={macroColors.carbs} />
          <TotalCell label="Fat" value={`${results.totals.fat}g`} color={macroColors.fat} />
          <TotalCell label="Fiber" value={`${results.totals.fiber}g`} color={macroColors.fiber} />
        </View>
      </View>

      <TouchableOpacity
        style={[s.logBtn, !results.items.length && s.logBtnOff]}
        onPress={handleLog}
        activeOpacity={0.8}
        disabled={!results.items.length}
      >
        <Text style={s.logBtnText}>Log Food</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.retakeBtn} onPress={onStartOver} activeOpacity={0.7}>
        <Text style={s.retakeText}>Start over</Text>
      </TouchableOpacity>
    </KeyboardAwareSheetScroll>
  );
}

const s = StyleSheet.create({
  pad: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  emptyText: {
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontSize: fontSize.footnote,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },

  noteBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  noteText: {
    fontSize: fontSize.footnote,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    lineHeight: 18,
  },

  itemCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  itemName: {
    flex: 1,
    fontSize: fontSize.subhead,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fonts.mono,
  },
  itemRemove: { fontSize: 14, color: colors.textTertiary, fontWeight: '600', paddingHorizontal: 4 },

  itemRow: { flexDirection: 'row', alignItems: 'center' },
  qtyDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  qtyEdit: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyInput: {
    minWidth: 60,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: fontSize.subhead,
    color: colors.text,
    fontFamily: fonts.mono,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.success + '60',
  },
  itemQty: { fontSize: fontSize.subhead, color: colors.text, fontFamily: fonts.mono, fontWeight: '700' },
  itemUnit: { fontSize: fontSize.footnote, color: colors.textSecondary, fontFamily: fonts.mono },
  itemEditHint: {
    marginLeft: 6,
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },

  macroRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  macroCell: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  macroVal: { fontSize: fontSize.footnote, fontWeight: '700', fontFamily: fonts.mono },
  macroUnit: { fontSize: 10, color: colors.textTertiary, fontFamily: fonts.mono, fontWeight: '600' },

  totalsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  totalsLabel: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 1.5 },
  totalsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  totalCell: { alignItems: 'center', gap: 2, flex: 1 },
  totalVal: { fontSize: fontSize.title3, fontWeight: '700', fontFamily: fonts.mono },
  totalLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  logBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.xl,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  logBtnOff: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  logBtnText: {
    fontSize: fontSize.headline,
    fontWeight: '700',
    color: '#fff',
    fontFamily: fonts.mono,
    letterSpacing: 0.5,
  },
  retakeBtn: { paddingVertical: spacing.sm, alignItems: 'center' },
  retakeText: { fontSize: fontSize.footnote, color: colors.textTertiary, fontFamily: fonts.mono, fontWeight: '600' },
});
