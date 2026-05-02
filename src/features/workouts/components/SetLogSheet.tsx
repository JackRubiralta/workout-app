import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, radius, spacing, surfaces, text } from '@/shared/theme';
import { Button, ScrollPicker, Sheet, Toggle } from '@/shared/components';
import { useSettingsData } from '@/shared/state/store';
import {
  fromLb,
  toLb,
  unitLabel,
  WEIGHT_PICKER,
  type UnitSystemValue,
} from '@/shared/utils/units';
import { REPS_MAX } from '../constants/workoutConstants';

function formatWeight(v: number): string {
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

function weightValuesFor(system: UnitSystemValue): number[] {
  const { min, max, step } = WEIGHT_PICKER[system];
  return ScrollPicker.range(min, max, step);
}

const REPS_VALUES = ScrollPicker.range(0, REPS_MAX, 1);

export type SetLogSaveValues = {
  weight: number;
  reps: number;
  toFailure: boolean;
};

export type SetLogSheetProps = {
  visible: boolean;
  exerciseName: string;
  setLabel: string;
  isWarmup: boolean;
  dayColor: string;
  defaultWeight: number;
  defaultReps: number;
  /**
   * Number of working sets that contributed to `defaultWeight`/`defaultReps`.
   * 0 means no history; 1..5 means the picker is seeded from that many
   * recent working sets. Drives the "FROM N-SET AVG" eyebrow above the picker.
   */
  defaultsSampleSize?: number;
  tracksWeight?: boolean;
  tracksReps?: boolean;
  trendHint?: string | null;
  onSave: (values: SetLogSaveValues) => void;
  onDismiss: () => void;
};

export function SetLogSheet({
  visible,
  exerciseName,
  setLabel,
  isWarmup,
  dayColor,
  defaultWeight,
  defaultReps,
  defaultsSampleSize = 0,
  tracksWeight = true,
  tracksReps = true,
  trendHint,
  onSave,
  onDismiss,
}: SetLogSheetProps) {
  const { unitSystem } = useSettingsData();
  const weightValues = useMemo(() => weightValuesFor(unitSystem), [unitSystem]);

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
      setOpenKey(k => k + 1);
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

        {(defaultsSampleSize > 0 || trendHint) ? (
          <View style={s.contextStack}>
            {defaultsSampleSize > 0 ? (
              <View style={s.contextRow}>
                <Text style={s.contextLabel}>
                  {defaultsSampleSize >= 5
                    ? 'AVG · LAST 5'
                    : `AVG · LAST ${defaultsSampleSize}`}
                </Text>
                <Text style={[s.contextValue, { color: colors.text }]}>
                  {tracksWeight
                    ? `${formatWeight(Math.round(fromLb(defaultWeight, unitSystem) * 10) / 10)} ${unitLabel(unitSystem)}`
                    : ''}
                  {tracksWeight && tracksReps ? ' × ' : ''}
                  {tracksReps ? `${defaultReps}` : ''}
                </Text>
              </View>
            ) : null}
            {trendHint ? (
              <View style={s.contextRow}>
                <Text style={s.contextLabel}>LAST</Text>
                <Text style={s.contextValue}>{trendHint.replace(/^last\s+/i, '')}</Text>
              </View>
            ) : null}
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
  exerciseName: { ...(text.title3 as TextStyle), fontSize: fontSize.headline },
  setLabel: { ...(text.setLabel as TextStyle), fontSize: fontSize.caption, letterSpacing: 2 },
  skipBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  skipText: { ...(text.monoSubhead as TextStyle), color: colors.textSecondary, fontWeight: '500' },

  contextStack: {
    ...surfaces.inset,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    gap: 2,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  contextLabel: {
    ...(text.eyebrowSmall as TextStyle),
    color: colors.textTertiary,
    minWidth: 76,
  },
  contextValue: {
    flex: 1,
    ...(text.monoSubhead as TextStyle),
    color: colors.textSecondary,
    textAlign: 'right',
  },

  controls: { flexDirection: 'row', gap: spacing.md },
  col: { flex: 1, gap: spacing.xs },
  colLabel: { ...(text.eyebrowSmall as TextStyle), textAlign: 'center' },

  noTrack: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
  },
  noTrackText: { ...(text.monoSubhead as TextStyle) },

  failRow: {
    ...surfaces.inset,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
  },
  failLabel: { ...(text.monoSubhead as TextStyle), fontWeight: '600' },

  saveBtn: { height: 52 },
});
