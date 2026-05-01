import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, radius, spacing, surfaces, text } from '../../../theme';
import { Button, ScrollPicker, Sheet, Toggle } from '../../../ui';
import { useSettingsData } from '../../../shell/store';
import { fromLb, toLb, unitLabel, WEIGHT_PICKER } from '../../../utils/units';
import { REPS_MAX } from '../../../constants/workout';

function formatWeight(v) {
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

// Picker values built per-system: imperial = 2.5 lb steps, metric = 1 kg
// steps. We rebuild on system change so flipping the unit selector
// rerenders the picker against the new bounds.
function weightValuesFor(system) {
  const { min, max, step } = WEIGHT_PICKER[system];
  return ScrollPicker.range(min, max, step);
}

const REPS_VALUES = ScrollPicker.range(0, REPS_MAX, 1);

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
  const { unitSystem } = useSettingsData();
  const weightValues = useMemo(() => weightValuesFor(unitSystem), [unitSystem]);

  // Picker state lives in display unit (whatever the user prefers); we
  // convert to lb on save so storage stays uniform.
  const [displayWeight, setDisplayWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [toFailure, setToFailure] = useState(false);
  const [openKey, setOpenKey] = useState(0);

  useEffect(() => {
    if (visible) {
      const seedDisplay = Math.round(fromLb(defaultWeight ?? 0, unitSystem) * 10) / 10;
      setDisplayWeight(seedDisplay);
      setReps(defaultReps ?? 0);
      setToFailure(false);
      setOpenKey(k => k + 1); // re-mount pickers so they snap to new defaults
    }
  }, [visible, defaultWeight, defaultReps, unitSystem]);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSave({
      weight: tracksWeight ? Math.round(toLb(displayWeight, unitSystem) * 10) / 10 : 0,
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
                <Text style={s.colLabel}>WEIGHT ({unitLabel(unitSystem)})</Text>
                <ScrollPicker
                  key={`w${openKey}-${unitSystem}`}
                  values={weightValues}
                  value={displayWeight}
                  onChange={setDisplayWeight}
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

        <Button label="Save Set" onPress={handleSave} color={dayColor} style={s.saveBtn} />
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
    ...surfaces.inset,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
    ...surfaces.inset,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  failLabel: { ...text.monoSubhead, fontWeight: '600' },

  saveBtn: { height: 52 },
});
