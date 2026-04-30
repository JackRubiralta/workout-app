import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  PanResponder,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, spacing, radius, fontSize } from '../constants/theme';

const FIELDS = [
  { key: 'calories', label: 'CALORIES', unit: 'kcal', accent: '#FF4757' },
  { key: 'protein', label: 'PROTEIN', unit: 'g', accent: '#3742FA' },
  { key: 'carbs', label: 'CARBS', unit: 'g', accent: '#FFA502' },
  { key: 'fat', label: 'FAT', unit: 'g', accent: '#A55EEA' },
];

export function GoalsModal({ visible, goals, onSave, onClose }) {
  const [values, setValues] = useState({});
  const [kbVisible, setKbVisible] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      setValues({
        calories: String(goals.calories),
        protein: String(goals.protein),
        carbs: String(goals.carbs),
        fat: String(goals.fat),
      });
    }
  }, [visible, goals]);

  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardWillShow', () => setKbVisible(true));
    const s2 = Keyboard.addListener('keyboardWillHide', () => setKbVisible(false));
    return () => { s1.remove(); s2.remove(); };
  }, []);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          Animated.timing(translateY, { toValue: 600, duration: 200, useNativeDriver: true })
            .start(() => closeRef.current());
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 5 }).start();
        }
      },
    }),
  ).current;

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const parsed = {};
    for (const f of FIELDS) {
      const n = parseInt(values[f.key], 10);
      parsed[f.key] = !isNaN(n) && n >= 0 ? n : goals[f.key];
    }
    onSave(parsed);
    onClose();
  }, [values, goals, onSave, onClose]);

  const setField = useCallback((key, val) => {
    setValues(prev => ({ ...prev, [key]: val.replace(/[^0-9]/g, '').slice(0, 5) }));
  }, []);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="height" style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View {...pan.panHandlers} style={styles.handleArea}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Daily Goals</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.hint}>
              Set your daily targets. The progress rings on the Nutrition tab fill toward these.
            </Text>

            {FIELDS.map(f => (
              <View key={f.key} style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: f.accent }]}>{f.label}</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={values[f.key] ?? ''}
                    onChangeText={t => setField(f.key, t)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.textTertiary}
                    selectionColor={f.accent}
                    returnKeyType="done"
                    maxLength={5}
                  />
                  <Text style={styles.unitLabel}>{f.unit}</Text>
                </View>
              </View>
            ))}
            <View style={{ height: spacing.md }} />
          </ScrollView>

          {!kbVisible && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                <Text style={styles.saveBtnText}>Save Goals</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handleArea: { paddingTop: spacing.sm, paddingBottom: spacing.xs, alignItems: 'center' },
  handle: { width: 36, height: 4, backgroundColor: colors.border, borderRadius: radius.full },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    flex: 1,
    fontSize: fontSize.headline,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 28, height: 28, borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  body: { paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.md },
  hint: {
    fontSize: fontSize.footnote,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  fieldBlock: { gap: spacing.xs },
  fieldLabel: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    letterSpacing: 1.4,
    fontFamily: fonts.mono,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.mono,
  },
  unitLabel: {
    fontSize: fontSize.subhead,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    width: 40,
  },

  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveBtn: {
    height: 52,
    backgroundColor: colors.text,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: fontSize.headline,
    fontWeight: '700',
    color: colors.background,
    fontFamily: fonts.mono,
    letterSpacing: 0.5,
  },
});
