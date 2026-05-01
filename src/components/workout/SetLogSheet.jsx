import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius, spacing, text } from '../../theme';
import { Sheet } from '../primitives/Sheet';
import { Toggle } from '../primitives/Toggle';
import { ScrollPicker } from '../primitives/ScrollPicker';

const WEIGHT_STEP = 2.5;
const WEIGHT_MAX = 600;
const REPS_MAX = 100;

function formatWeight(v) {
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

const WEIGHT_VALUES = (() => {
  const out = [];
  for (let v = 0; v <= WEIGHT_MAX; v += WEIGHT_STEP) out.push(Math.round(v * 10) / 10);
  return out;
})();
const REPS_VALUES = Array.from({ length: REPS_MAX + 1 }, (_, i) => i);

export function SetLogSheet({
  visible,
  exerciseName,
  setLabel,
  isWarmup,
  dayColor,
  defaultWeight,
  defaultReps,
  tracksWeight = true,
  tracksReps = true,
  trendHint,
  onSave,
  onDismiss,
}) {
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [toFailure, setToFailure] = useState(false);
  const [openKey, setOpenKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setWeight(defaultWeight ?? 0);
      setReps(defaultReps ?? 0);
      setToFailure(false);
      setOpenKey(k => k + 1); // re-mount pickers so they snap to new defaults
    }
  }, [visible, defaultWeight, defaultReps]);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSave({
      weight: tracksWeight ? weight : 0,
      reps: tracksReps ? reps : 0,
      toFailure,
    });
  };

  const trackingAnything = tracksWeight || tracksReps;

  return (
    <Sheet visible={visible} onClose={onDismiss}>
      <View style={s.body}>
        <View style={s.header}>
          <View style={[s.dot, { backgroundColor: dayColor }]} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.exerciseName} numberOfLines={1}>{exerciseName}</Text>
            <Text style={[s.setLabel, { color: isWarmup ? colors.textTertiary : dayColor }]}>
              {(setLabel ?? '').toUpperCase()}
            </Text>
          </View>
          <TouchableOpacity onPress={onDismiss} hitSlop={12} style={s.skipBtn}>
            <Text style={s.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {trendHint ? (
          <View style={s.trend}>
            <Text style={s.trendLabel}>TREND</Text>
            <Text style={s.trendValue}>{trendHint}</Text>
          </View>
        ) : null}

        {trackingAnything ? (
          <View style={s.controls}>
            {tracksWeight && (
              <View style={s.col}>
                <Text style={s.colLabel}>WEIGHT (lb)</Text>
                <ScrollPicker
                  key={`w${openKey}`}
                  values={WEIGHT_VALUES}
                  value={weight}
                  onChange={setWeight}
                  format={formatWeight}
                  accent={dayColor}
                />
              </View>
            )}
            {tracksReps && (
              <View style={s.col}>
                <Text style={s.colLabel}>REPS</Text>
                <ScrollPicker
                  key={`r${openKey}`}
                  values={REPS_VALUES}
                  value={reps}
                  onChange={setReps}
                  format={String}
                  accent={dayColor}
                />
              </View>
            )}
          </View>
        ) : (
          <View style={s.noTrack}>
            <Text style={s.noTrackText}>Nothing to log — nice work.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.failRow, toFailure && { borderColor: dayColor + '50', backgroundColor: dayColor + '08' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setToFailure(p => !p);
          }}
          activeOpacity={0.7}
        >
          <Text style={[s.failLabel, toFailure && { color: colors.text }]}>To Failure</Text>
          <Toggle value={toFailure} onChange={setToFailure} accent={dayColor} />
        </TouchableOpacity>

        <TouchableOpacity style={[s.saveBtn, { backgroundColor: dayColor }]} onPress={handleSave} activeOpacity={0.85}>
          <Text style={s.saveText}>Save Set</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  exerciseName: { ...text.title3, fontSize: fontSize.headline },
  setLabel: { ...text.setLabel, fontSize: fontSize.caption, letterSpacing: 2 },
  skipBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  skipText: { ...text.monoSubhead, color: colors.textSecondary, fontWeight: '500' },

  trend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trendLabel: { ...text.eyebrowSmall, color: colors.textTertiary },
  trendValue: { flex: 1, ...text.monoSubhead, color: colors.textSecondary, textAlign: 'right' },

  controls: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1, gap: spacing.xs },
  colLabel: { ...text.eyebrowSmall, textAlign: 'center' },

  noTrack: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
  },
  noTrackText: { ...text.monoSubhead },

  failRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceElevated, justifyContent: 'space-between',
  },
  failLabel: { ...text.monoSubhead, fontWeight: '600' },

  saveBtn: { height: 52, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  saveText: { ...text.button, color: '#fff', fontFamily: fonts.mono, letterSpacing: 0.5 },
});
