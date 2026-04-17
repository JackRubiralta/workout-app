import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, fontSize, fonts } from '../constants/theme';

// ─── Value arrays ───────────────────────────────────────────────────────────

const WEIGHT_VALUES = Array.from({ length: 201 }, (_, i) => i * 2.5);
const REPS_VALUES = Array.from({ length: 101 }, (_, i) => i);

function formatWeight(v) {
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

function nearestIndex(values, target) {
  let best = 0;
  let bestDist = Math.abs(values[0] - target);
  for (let i = 1; i < values.length; i++) {
    const dist = Math.abs(values[i] - target);
    if (dist < bestDist) { bestDist = dist; best = i; }
  }
  return best;
}

// ─── Scroll Picker ──────────────────────────────────────────────────────────

const ITEM_H = 44;
const VISIBLE = 5;
const PICKER_H = ITEM_H * VISIBLE;
const PAD = Math.floor(VISIBLE / 2) * ITEM_H; // 88

function ScrollPicker({ values, initialValue, onValueChange, formatFn, accentColor }) {
  const scrollRef = useRef(null);
  const lastIdx = useRef(-1);

  const initIdx = useMemo(() => nearestIndex(values, initialValue), []);

  // Scroll to initial position on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: initIdx * ITEM_H, animated: false });
      lastIdx.current = initIdx;
    }, 60);
    return () => clearTimeout(timer);
  }, [initIdx]);

  // Haptic tick when crossing a value boundary
  const handleScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));
    if (clamped !== lastIdx.current) {
      lastIdx.current = clamped;
      Haptics.selectionAsync().catch(() => {});
    }
  }, [values.length]);

  // Commit value when scroll settles
  const commitValue = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));
    onValueChange(values[clamped]);
  }, [values, onValueChange]);

  return (
    <View style={pk.outer}>
      {/* Selection highlight */}
      <View style={[pk.selBg, { borderColor: (accentColor || colors.border) + '35' }]} pointerEvents="none" />

      <ScrollView
        ref={scrollRef}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        bounces={false}
        overScrollMode="never"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={commitValue}
        onScrollEndDrag={commitValue}
        contentContainerStyle={{ paddingVertical: PAD }}
      >
        {values.map((v, i) => (
          <View key={i} style={pk.item}>
            <Text style={pk.text}>{formatFn(v)}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Stepped fade overlays */}
      <View style={[pk.fade, { top: 0, height: ITEM_H, opacity: 0.92 }]} pointerEvents="none" />
      <View style={[pk.fade, { top: ITEM_H, height: ITEM_H, opacity: 0.55 }]} pointerEvents="none" />
      <View style={[pk.fade, { bottom: ITEM_H, height: ITEM_H, opacity: 0.55 }]} pointerEvents="none" />
      <View style={[pk.fade, { bottom: 0, height: ITEM_H, opacity: 0.92 }]} pointerEvents="none" />
    </View>
  );
}

const pk = StyleSheet.create({
  outer: {
    height: PICKER_H,
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
  },
  selBg: {
    position: 'absolute',
    top: PAD,
    left: 0,
    right: 0,
    height: ITEM_H,
    backgroundColor: colors.surfaceHighlight,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  item: {
    height: ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: fontSize.title3,
    fontWeight: '600',
    color: colors.text,
    fontFamily: fonts.mono,
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.surfaceElevated,
  },
});

// ─── Set Log Modal ──────────────────────────────────────────────────────────

export function SetLogModal({
  visible, exerciseName, setLabel, isWarmup, dayColor,
  defaultWeight, defaultReps, onSave, onDismiss,
}) {
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [toFailure, setToFailure] = useState(false);
  const [openKey, setOpenKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setWeight(defaultWeight > 0 ? WEIGHT_VALUES[nearestIndex(WEIGHT_VALUES, defaultWeight)] : 2.5);
      setReps(defaultReps > 0 ? Math.min(defaultReps, 100) : 1);
      setToFailure(false);
      setOpenKey(k => k + 1);
    }
  }, [visible, defaultWeight, defaultReps]);

  const handleSave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSave({ weight, reps, toFailure });
  }, [weight, reps, toFailure, onSave]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss} statusBarTranslucent>
      <View style={s.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onDismiss} />
        <View style={s.sheet}>
          <View style={s.handle} />

          {/* Context header */}
          <View style={s.ctx}>
            <View style={[s.ctxDot, { backgroundColor: dayColor }]} />
            <View style={s.ctxText}>
              <Text style={s.ctxName} numberOfLines={1}>{exerciseName}</Text>
              <Text style={[s.ctxSet, { color: isWarmup ? colors.textTertiary : dayColor }]}>
                {setLabel?.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={onDismiss} hitSlop={12} style={s.skipBtn}>
              <Text style={s.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>

          {/* Pickers */}
          <View style={s.pickRow}>
            <View style={s.pickCol}>
              <Text style={s.pickLabel}>WEIGHT (lb)</Text>
              <ScrollPicker
                key={`w${openKey}`}
                values={WEIGHT_VALUES}
                initialValue={weight}
                onValueChange={setWeight}
                formatFn={formatWeight}
                accentColor={dayColor}
              />
            </View>
            <View style={s.pickCol}>
              <Text style={s.pickLabel}>REPS</Text>
              <ScrollPicker
                key={`r${openKey}`}
                values={REPS_VALUES}
                initialValue={reps}
                onValueChange={setReps}
                formatFn={String}
                accentColor={dayColor}
              />
            </View>
          </View>

          {/* To failure */}
          <TouchableOpacity
            style={[s.failRow, toFailure && { borderColor: dayColor + '50', backgroundColor: dayColor + '08' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setToFailure(p => !p);
            }}
            activeOpacity={0.7}
          >
            <View style={[s.chk, toFailure && { backgroundColor: dayColor, borderColor: dayColor }]}>
              {toFailure && <Text style={s.chkMark}>✓</Text>}
            </View>
            <Text style={[s.failLabel, toFailure && { color: colors.text }]}>To Failure</Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity style={[s.saveBtn, { backgroundColor: dayColor }]} onPress={handleSave} activeOpacity={0.8}>
            <Text style={s.saveText}>Save</Text>
          </TouchableOpacity>

          <View style={{ height: spacing.lg }} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    width: 36, height: 4, backgroundColor: colors.border,
    borderRadius: radius.full, alignSelf: 'center',
    marginTop: spacing.sm, marginBottom: spacing.sm,
  },

  // Context
  ctx: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  ctxDot: { width: 8, height: 8, borderRadius: 4 },
  ctxText: { flex: 1, gap: 2 },
  ctxName: {
    fontSize: fontSize.headline, fontWeight: '700', color: colors.text,
    fontFamily: fonts.serif,
  },
  ctxSet: {
    fontSize: fontSize.caption, fontWeight: '700', letterSpacing: 2, fontFamily: fonts.mono,
  },
  skipBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  skipText: { fontSize: fontSize.subhead, color: colors.textSecondary, fontFamily: fonts.mono, fontWeight: '500' },

  // Pickers
  pickRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  pickCol: { flex: 1 },
  pickLabel: {
    fontSize: 11, fontWeight: '600', color: colors.textTertiary,
    letterSpacing: 1, fontFamily: fonts.mono,
    marginBottom: spacing.xs, textAlign: 'center',
  },

  // Failure
  failRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    marginBottom: spacing.md,
  },
  chk: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: colors.textTertiary,
    alignItems: 'center', justifyContent: 'center',
  },
  chkMark: { fontSize: 13, fontWeight: '700', color: '#fff' },
  failLabel: {
    fontSize: fontSize.subhead, color: colors.textSecondary, fontFamily: fonts.mono, fontWeight: '600',
  },

  // Save
  saveBtn: { height: 52, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  saveText: { fontSize: fontSize.headline, fontWeight: '700', color: '#fff', fontFamily: fonts.mono, letterSpacing: 0.5 },
});
