import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, text } from '../../theme';
import { Button, Sheet, SheetHeader } from '../../ui';
import { FieldLabel, SheetInput } from '../../ui/SheetInput';
import { Stepper } from '../../ui/Stepper';
import { Toggle } from '../../ui/Toggle';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';

export function ExerciseEditSheet({ visible, exercise, exIndex, dayColor, onSave, onClose, onDelete, canDelete }) {
  const [name, setName] = useState('');
  const [sets, setSets] = useState(3);
  const [warmup, setWarmup] = useState(false);
  const [restSecs, setRestSecs] = useState('90');
  const [nextRestSecs, setNextRestSecs] = useState('');
  const [reps, setReps] = useState('');
  const [warmupReps, setWarmupReps] = useState('');
  const [tracksWeight, setTracksWeight] = useState(true);
  const [tracksReps, setTracksReps] = useState(true);
  const [tracksTime, setTracksTime] = useState(false);
  const [durationSecs, setDurationSecs] = useState('60');
  const kbVisible = useKeyboardVisible();

  useEffect(() => {
    if (!exercise || !visible) return;
    setName(exercise.name);
    setSets(exercise.sets);
    setWarmup(!!exercise.warmup);
    setRestSecs(String(exercise.restSeconds));
    setNextRestSecs(exercise.nextRestSeconds == null ? '' : String(exercise.nextRestSeconds));
    setReps(exercise.reps);
    setWarmupReps(exercise.warmupReps);
    setTracksWeight(exercise.tracksWeight !== false);
    setTracksReps(exercise.tracksReps !== false);
    setTracksTime(!!exercise.tracksTime);
    setDurationSecs(String(exercise.durationSeconds ?? 60));
  }, [exercise, visible]);

  const handleSave = () => {
    if (!exercise) return;
    const rest = parseInt(restSecs, 10);
    const nextRestTrimmed = nextRestSecs.trim();
    let nextRest = null;
    if (nextRestTrimmed !== '') {
      const parsed = parseInt(nextRestTrimmed, 10);
      if (!isNaN(parsed) && parsed >= 0) nextRest = Math.min(parsed, 600);
      else nextRest = exercise.nextRestSeconds ?? null;
    }
    const dur = parseInt(durationSecs, 10);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSave(exIndex, {
      name: name.trim() || exercise.name,
      sets,
      warmup,
      restSeconds: !isNaN(rest) && rest >= 10 ? Math.min(rest, 600) : exercise.restSeconds,
      nextRestSeconds: nextRest,
      reps: reps.trim() || exercise.reps,
      warmupReps: warmupReps.trim() || exercise.warmupReps,
      tracksWeight,
      tracksReps,
      tracksTime,
      durationSeconds: !isNaN(dur) && dur >= 5 ? Math.min(dur, 3600) : (exercise.durationSeconds ?? 60),
    });
  };

  if (!exercise) return null;

  return (
    <Sheet visible={visible} onClose={onClose} flex height="92%">
      <SheetHeader
        eyebrow={`EXERCISE ${exIndex + 1}`}
        title={name || exercise.name}
        onClose={onClose}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <FieldLabel>NAME</FieldLabel>
        <SheetInput value={name} onChangeText={setName} placeholder="Exercise name" selectionColor={dayColor} />

        <FieldLabel style={{ marginTop: spacing.md }}>WORKING SETS</FieldLabel>
        <Stepper value={sets} min={1} max={6} onChange={setSets} accent={dayColor} />

        <FieldLabel style={{ marginTop: spacing.md }}>REPS / GUIDE</FieldLabel>
        <SheetInput value={reps} onChangeText={setReps} placeholder="e.g. 6–10 reps" selectionColor={dayColor} />

        <FieldLabel style={{ marginTop: spacing.md }}>REST BETWEEN SETS</FieldLabel>
        <View style={s.inlineRow}>
          <SheetInput style={{ flex: 1 }} value={restSecs} onChangeText={setRestSecs} keyboardType="number-pad" selectionColor={dayColor} />
          <Text style={s.unit}>sec</Text>
        </View>
        <Text style={s.hint}>10 – 600 seconds</Text>

        <FieldLabel style={{ marginTop: spacing.md }}>REST BEFORE NEXT EXERCISE</FieldLabel>
        <View style={s.inlineRow}>
          <SheetInput
            style={{ flex: 1 }}
            value={nextRestSecs}
            onChangeText={setNextRestSecs}
            keyboardType="number-pad"
            placeholder="Use day default"
            selectionColor={dayColor}
          />
          <Text style={s.unit}>sec</Text>
        </View>
        <Text style={s.hint}>Leave blank to use the day's default</Text>

        <FieldLabel style={{ marginTop: spacing.md }}>TRACKING</FieldLabel>
        <View style={s.toggleRow}>
          <Text style={s.toggleDesc}>Track weight</Text>
          <Toggle value={tracksWeight} onChange={setTracksWeight} accent={dayColor} />
        </View>
        <View style={{ height: spacing.xs }} />
        <View style={s.toggleRow}>
          <Text style={s.toggleDesc}>Track reps</Text>
          <Toggle value={tracksReps} onChange={setTracksReps} accent={dayColor} />
        </View>
        <View style={{ height: spacing.xs }} />
        <View style={s.toggleRow}>
          <Text style={s.toggleDesc}>Time the set (countdown timer)</Text>
          <Toggle value={tracksTime} onChange={setTracksTime} accent={dayColor} />
        </View>

        {tracksTime && (
          <>
            <FieldLabel style={{ marginTop: spacing.md }}>SET DURATION</FieldLabel>
            <View style={s.inlineRow}>
              <SheetInput
                style={{ flex: 1 }}
                value={durationSecs}
                onChangeText={setDurationSecs}
                keyboardType="number-pad"
                selectionColor={dayColor}
              />
              <Text style={s.unit}>sec</Text>
            </View>
            <Text style={s.hint}>5 – 3600 seconds. Set hits zero → auto-completes the set.</Text>
          </>
        )}

        <FieldLabel style={{ marginTop: spacing.md }}>WARM-UP SET</FieldLabel>
        <View style={s.toggleRow}>
          <Text style={s.toggleDesc}>Add a warm-up set before working sets</Text>
          <Toggle value={warmup} onChange={setWarmup} accent={dayColor} />
        </View>
        {warmup && (
          <>
            <FieldLabel style={{ marginTop: spacing.md }}>WARM-UP REPS / GUIDE</FieldLabel>
            <SheetInput value={warmupReps} onChangeText={setWarmupReps} placeholder="e.g. Light weight, 12–15 reps" selectionColor={dayColor} />
          </>
        )}

        <View style={{ height: spacing.lg }} />
      </ScrollView>
      {!kbVisible && (
        <View style={s.footer}>
          <Button label="Save Exercise" onPress={handleSave} color={dayColor} style={s.saveBtn} />
          {canDelete && (
            <TouchableOpacity style={s.deleteBtn} onPress={onDelete} hitSlop={8}>
              <Text style={s.deleteBtnText}>Delete Exercise</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Sheet>
  );
}

const s = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unit: { ...text.monoSubhead, fontWeight: '600', width: 28 },
  hint: { ...text.monoCaption, marginTop: spacing.xs, letterSpacing: 0.3 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, gap: spacing.md,
  },
  toggleDesc: { flex: 1, ...text.monoSubhead },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  saveBtn: { height: 52 },
  deleteBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  deleteBtnText: { ...text.monoSubhead, fontWeight: '600', color: colors.danger, letterSpacing: 0.3 },
});
