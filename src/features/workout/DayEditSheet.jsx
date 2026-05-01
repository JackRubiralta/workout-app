import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, radius, spacing, text } from '../../theme';
import { Button, Sheet, SheetHeader } from '../../components/primitives';
import { FieldLabel, SheetInput } from '../../components/primitives/SheetInput';
import { ExerciseEditSheet } from './ExerciseEditSheet';
import { defaultExercise } from '../../utils/exercise';
import { confirm } from '../../utils/confirm';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';

export function DayEditSheet({ visible, day, dayIndex, onSave, onDelete, onClose, daysCount }) {
  const [title, setTitle] = useState('');
  const [focus, setFocus] = useState('');
  const [exerciseRestSecs, setExerciseRestSecs] = useState('180');
  const [exercises, setExercises] = useState([]);
  const [editingExIndex, setEditingExIndex] = useState(null);
  const kbVisible = useKeyboardVisible();

  useEffect(() => {
    if (!day || !visible) return;
    setTitle(day.title);
    setFocus(day.focus ?? '');
    setExerciseRestSecs(String(day.exerciseRestSeconds ?? 180));
    setExercises(day.exercises.map(ex => ({ ...ex })));
    setEditingExIndex(null);
  }, [day, visible]);

  const handleSaveDay = () => {
    if (!day) return;
    const rest = parseInt(exerciseRestSecs, 10);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSave(dayIndex, {
      title: title.trim() || day.title,
      focus: focus.trim(),
      exerciseRestSeconds: !isNaN(rest) && rest >= 30 ? Math.min(rest, 600) : (day.exerciseRestSeconds ?? 180),
      exercises,
    });
    onClose();
  };

  const handleSaveExercise = (exIndex, updates) => {
    setExercises(prev => prev.map((ex, i) => (i === exIndex ? { ...ex, ...updates } : ex)));
    setEditingExIndex(null);
  };

  const handleDeleteExercise = () => {
    if (exercises.length <= 1) return;
    setExercises(prev => prev.filter((_, i) => i !== editingExIndex));
    setEditingExIndex(null);
  };

  const addExercise = () => {
    setExercises(prev => [...prev, defaultExercise(`Exercise ${prev.length + 1}`)]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const moveExercise = (from, to) => {
    if (to < 0 || to >= exercises.length) return;
    setExercises(prev => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
  };

  const handleDeletePress = () => {
    if (!day) return;
    confirm({
      title: `Delete Day ${day.day}?`,
      message: `"${day.title}${day.focus ? ' · ' + day.focus : ''}" and any in-progress workouts for it will be removed.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: () => { onDelete(dayIndex); onClose(); },
    });
  };

  if (!day) return null;

  return (
    <>
      <Sheet visible={visible && editingExIndex === null} onClose={onClose} flex height="92%">
        <SheetHeader
          left={
            <View style={[s.dayDot, { backgroundColor: day.color + '20', borderColor: day.color + '40' }]}>
              <Text style={[s.dayDotText, { color: day.color }]}>{day.day}</Text>
            </View>
          }
          title={`Edit Day ${day.day}`}
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
          <FieldLabel>DAY TITLE</FieldLabel>
          <SheetInput value={title} onChangeText={setTitle} placeholder="e.g. PUSH" autoCapitalize="characters" selectionColor={day.color} />

          <FieldLabel style={{ marginTop: spacing.md }}>FOCUS</FieldLabel>
          <SheetInput value={focus} onChangeText={setFocus} placeholder="e.g. Chest Focus" selectionColor={day.color} />

          <FieldLabel style={{ marginTop: spacing.md }}>REST BETWEEN EXERCISES</FieldLabel>
          <View style={s.inlineRow}>
            <SheetInput style={{ flex: 1 }} value={exerciseRestSecs} onChangeText={setExerciseRestSecs} keyboardType="number-pad" selectionColor={day.color} />
            <Text style={s.unit}>sec</Text>
          </View>
          <Text style={s.hint}>Rest after finishing all sets of an exercise (30 – 600 sec)</Text>

          <FieldLabel style={{ marginTop: spacing.md }}>EXERCISES</FieldLabel>
          <View style={s.exList}>
            {exercises.map((ex, i) => {
              const warmupLabel = ex.warmup ? '1 warm-up + ' : '';
              const tag = ex.tracksWeight === false && ex.tracksReps === false ? 'timed' : ex.tracksWeight === false ? 'bodyweight' : null;
              return (
                <View key={i} style={s.exRowWrap}>
                  <TouchableOpacity style={s.exRow} onPress={() => setEditingExIndex(i)} activeOpacity={0.7}>
                    <View style={[s.exBadge, { backgroundColor: day.color + '18' }]}>
                      <Text style={[s.exBadgeText, { color: day.color }]}>{i + 1}</Text>
                    </View>
                    <View style={s.exInfo}>
                      <Text style={s.exName} numberOfLines={1}>{ex.name}</Text>
                      <Text style={s.exMeta} numberOfLines={1}>
                        {warmupLabel}{ex.sets} sets · {ex.reps} · {ex.restSeconds}s rest{tag ? ` · ${tag}` : ''}
                      </Text>
                    </View>
                    <View style={s.exReorder}>
                      <TouchableOpacity onPress={() => moveExercise(i, i - 1)} hitSlop={8} style={s.reBtn}>
                        <Text style={s.reBtnText}>↑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => moveExercise(i, i + 1)} hitSlop={8} style={s.reBtn}>
                        <Text style={s.reBtnText}>↓</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
          <TouchableOpacity onPress={addExercise} style={s.addRow} activeOpacity={0.7}>
            <Text style={s.addRowText}>+ Add Exercise</Text>
          </TouchableOpacity>

          <View style={{ height: spacing.lg }} />
        </ScrollView>

        {!kbVisible && (
          <View style={s.footer}>
            <Button label="Save Day" onPress={handleSaveDay} color={day.color} style={s.saveBtn} />
            {daysCount > 1 && (
              <TouchableOpacity style={s.deleteBtn} onPress={handleDeletePress} hitSlop={8}>
                <Text style={s.deleteBtnText}>Delete Day</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Sheet>

      <ExerciseEditSheet
        visible={visible && editingExIndex !== null}
        exercise={editingExIndex !== null ? exercises[editingExIndex] : null}
        exIndex={editingExIndex ?? 0}
        dayColor={day.color}
        onSave={handleSaveExercise}
        onClose={() => setEditingExIndex(null)}
        onDelete={handleDeleteExercise}
        canDelete={exercises.length > 1}
      />
    </>
  );
}

const s = StyleSheet.create({
  dayDot: { width: 28, height: 28, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  dayDotText: { ...text.eyebrowSmall, color: colors.text, fontSize: fontSize.footnote, fontWeight: '700' },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unit: { ...text.monoSubhead, fontWeight: '600', width: 28 },
  hint: { ...text.monoCaption, marginTop: spacing.xs, letterSpacing: 0.3 },

  exList: { gap: spacing.xs, marginTop: spacing.xs },
  exRowWrap: {},
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  exBadge: { width: 28, height: 28, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  exBadgeText: { ...text.eyebrowSmall, fontSize: fontSize.footnote, fontWeight: '700' },
  exInfo: { flex: 1, gap: 2 },
  exName: { ...text.monoSubhead, color: colors.text, fontWeight: '600' },
  exMeta: { ...text.monoCaption, color: colors.textSecondary, letterSpacing: 0.2 },
  exReorder: { gap: 2 },
  reBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  reBtnText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },

  addRow: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addRowText: { ...text.monoSubhead, fontWeight: '600' },

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
