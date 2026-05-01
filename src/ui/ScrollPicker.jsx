import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius } from '../theme';

const ITEM_H = 44;
const VISIBLE = 5;
const PICKER_H = ITEM_H * VISIBLE;
const PAD = Math.floor(VISIBLE / 2) * ITEM_H;

function nearestIndex(values, target) {
  let best = 0;
  let bestDist = Math.abs(values[0] - target);
  for (let i = 1; i < values.length; i++) {
    const dist = Math.abs(values[i] - target);
    if (dist < bestDist) { bestDist = dist; best = i; }
  }
  return best;
}

// Vertical wheel-style scroll picker. Snaps to values, ticks haptic on each
// boundary, commits on momentum/drag end. Pass an array of values + the
// initial value; calls onChange with the snapped value.

export function ScrollPicker({ values, value, onChange, format = String, accent }) {
  const scrollRef = useRef(null);
  const lastIdx = useRef(-1);

  const initIdx = useMemo(() => nearestIndex(values, value), [values, value]);

  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: initIdx * ITEM_H, animated: false });
      lastIdx.current = initIdx;
    }, 50);
    return () => clearTimeout(t);
  }, [initIdx]);

  const handleScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));
    if (clamped !== lastIdx.current) {
      lastIdx.current = clamped;
      Haptics.selectionAsync().catch(() => {});
    }
  }, [values.length]);

  const commit = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));
    onChange(values[clamped]);
  }, [values, onChange]);

  return (
    <View style={s.outer}>
      <View style={[s.selBg, { borderColor: (accent || colors.border) + '50' }]} pointerEvents="none" />

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
        onMomentumScrollEnd={commit}
        onScrollEndDrag={commit}
        contentContainerStyle={{ paddingVertical: PAD }}
      >
        {values.map((v, i) => (
          <View key={i} style={s.item}>
            <Text style={s.text}>{format(v)}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={[s.fade, { top: 0, height: ITEM_H, opacity: 0.95 }]} pointerEvents="none" />
      <View style={[s.fade, { top: ITEM_H, height: ITEM_H, opacity: 0.55 }]} pointerEvents="none" />
      <View style={[s.fade, { bottom: ITEM_H, height: ITEM_H, opacity: 0.55 }]} pointerEvents="none" />
      <View style={[s.fade, { bottom: 0, height: ITEM_H, opacity: 0.95 }]} pointerEvents="none" />
    </View>
  );
}

ScrollPicker.ITEM_H = ITEM_H;
ScrollPicker.PICKER_H = PICKER_H;

// Build a snapped-to-step numeric value array suitable for `values`. Rounds
// each entry to one decimal place so floating-point drift from non-integer
// steps (e.g. 2.5, 0.5) doesn't show up in the UI.
//   ScrollPicker.range(0, 600, 2.5)  → [0, 2.5, 5, …, 600]
//   ScrollPicker.range(60, 400, 0.5) → [60, 60.5, 61, …, 400]
ScrollPicker.range = function range(min, max, step) {
  const out = [];
  for (let v = min; v <= max; v += step) out.push(Math.round(v * 10) / 10);
  return out;
};

const s = StyleSheet.create({
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
    backgroundColor: colors.surfaceHigh,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  item: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: fontSize.title3, fontWeight: '700', color: colors.text, fontFamily: fonts.mono },
  fade: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.surfaceElevated },
});
