import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, macroColors, radius, spacing, text } from '../../theme';
import { Sheet, SheetHeader } from '../../components/primitives';
import { useKeyboardVisible } from '../../utils/useKeyboardVisible';

const FIELDS = [
  { key: 'calories', label: 'CALORIES', unit: 'kcal', accent: macroColors.calories },
  { key: 'protein', label: 'PROTEIN', unit: 'g', accent: macroColors.protein },
  { key: 'carbs', label: 'CARBS', unit: 'g', accent: macroColors.carbs },
  { key: 'fat', label: 'FAT', unit: 'g', accent: macroColors.fat },
  { key: 'fiber', label: 'FIBER', unit: 'g', accent: macroColors.fiber },
];

export function GoalsSheet({ visible, goals, onSave, onClose }) {
  const [values, setValues] = useState({});
  const kbVisible = useKeyboardVisible();

  useEffect(() => {
    if (visible) {
      const next = {};
      for (const f of FIELDS) next[f.key] = String(goals[f.key] ?? 0);
      setValues(next);
    }
  }, [visible, goals]);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const parsed = {};
    for (const f of FIELDS) {
      const n = parseInt(values[f.key], 10);
      parsed[f.key] = !isNaN(n) && n >= 0 ? n : goals[f.key];
    }
    onSave(parsed);
    onClose();
  };

  const setField = (key, val) => {
    setValues(prev => ({ ...prev, [key]: val.replace(/[^0-9]/g, '').slice(0, 5) }));
  };

  return (
    <Sheet visible={visible} onClose={onClose} flex height="92%">
      <SheetHeader title="Daily Goals" onClose={onClose} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.body}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.hint}>
          Set your daily targets. The progress rings on the Nutrition tab fill toward these.
        </Text>

        {FIELDS.map(f => (
          <View key={f.key} style={s.field}>
            <Text style={[s.fieldLabel, { color: f.accent }]}>{f.label}</Text>
            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                value={values[f.key] ?? ''}
                onChangeText={t => setField(f.key, t)}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                selectionColor={f.accent}
                returnKeyType="done"
                maxLength={5}
              />
              <Text style={s.unitLabel}>{f.unit}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: spacing.md }} />
      </ScrollView>

      {!kbVisible && (
        <View style={s.footer}>
          <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={s.saveBtnText}>Save Goals</Text>
          </TouchableOpacity>
        </View>
      )}
    </Sheet>
  );
}

const s = StyleSheet.create({
  body: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.md },
  hint: { ...text.monoFootnote, lineHeight: 18, marginBottom: spacing.xs },
  field: { gap: spacing.xs },
  fieldLabel: { ...text.eyebrow, fontWeight: '700', letterSpacing: 1.4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1, backgroundColor: colors.surfaceElevated, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2,
    fontSize: fontSize.body, color: colors.text, borderWidth: 1, borderColor: colors.border,
    fontFamily: fonts.mono,
  },
  unitLabel: { ...text.monoSubhead, fontWeight: '600', width: 40 },

  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveBtn: { height: 52, backgroundColor: colors.success, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { ...text.button, color: '#fff', letterSpacing: 0.3 },
});
