import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius } from '@/shared/theme';

// ─── Layout constants ───────────────────────────────────────────────────────
// Five visible rows, 44pt each. The center row is the "selected" slot. The
// vertical padding on the content view shifts the first/last value into the
// center slot at offset 0 and at offset (length-1)*ITEM_H respectively.
const ITEM_H = 44;
const VISIBLE = 5;
const PICKER_H = ITEM_H * VISIBLE;
const PAD = Math.floor(VISIBLE / 2) * ITEM_H;
// Minimum gap between selection-haptics. The scroll listener fires per-pixel
// at 60Hz; at typical flick velocities 5–10 indices can pass under the
// selector inside a single momentum frame and produce a buzz. Capping the
// haptic rate gives one tactile tick per ~60ms (~17/s max), which feels
// snappy without being noisy. Tune by feel — under 40ms feels like a buzz.
const HAPTIC_INTERVAL_MS = 60;

function nearestIndex(values: number[], target: number): number {
  if (values.length === 0) return 0;
  let best = 0;
  let bestDist = Math.abs(values[0] - target);
  for (let i = 1; i < values.length; i++) {
    const dist = Math.abs(values[i] - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}

export type ScrollPickerProps = {
  values: number[];
  value: number;
  onChange: (next: number) => void;
  format?: (v: number) => string;
  accent?: string;
};

type ScrollPickerComponent = React.FC<ScrollPickerProps> & {
  ITEM_H: number;
  PICKER_H: number;
  range: (min: number, max: number, step: number) => number[];
};

const ScrollPickerInner: React.FC<ScrollPickerProps> = ({
  values,
  value,
  onChange,
  format = String,
  accent,
}) => {
  // The Animated.ScrollView ref forwards to a plain ScrollView under the
  // hood, so the imperative scrollTo API is identical.
  const scrollRef = useRef<ScrollView | null>(null);

  // Native-driven scroll position. Drives every per-item opacity/scale
  // interpolation, so the visual centering stays at 60fps even when the JS
  // thread is busy (e.g. the parent re-rendering on each onChange).
  const scrollY = useRef(new Animated.Value(0)).current;

  // The index we last reported to the parent via `onChange`. Used to break
  // the prop-value → effect → scrollTo feedback loop: when the parent feeds
  // the same value back to us, we treat it as our own round-trip and skip
  // the re-anchor.
  const reportedIdxRef = useRef(-1);

  // Throttled haptic state. Both refs together implement: "fire a haptic
  // when the centered index changes AND at least HAPTIC_INTERVAL_MS has
  // elapsed since the previous haptic."
  const lastHapticIdxRef = useRef(-1);
  const lastHapticAtRef = useRef(0);

  // Layout phase guard. The first reliable scroll-to opportunity is
  // `onContentSizeChange`, NOT a setTimeout. Before that fires, scrollTo is
  // a no-op on some platforms.
  const contentReadyRef = useRef(false);

  const targetIdx = useMemo(() => nearestIndex(values, value), [values, value]);

  const scrollToIdx = useCallback((idx: number, animated = false) => {
    scrollRef.current?.scrollTo({ y: idx * ITEM_H, animated });
    reportedIdxRef.current = idx;
    lastHapticIdxRef.current = idx;
  }, []);

  // Re-anchor when the prop `value` changes externally (parent reset, unit
  // toggle, etc.). Bail when the change is just our own onChange round-trip.
  useEffect(() => {
    if (!contentReadyRef.current) return;
    if (targetIdx === reportedIdxRef.current) return;
    scrollToIdx(targetIdx, false);
  }, [targetIdx, scrollToIdx]);

  const handleContentSizeChange = useCallback(() => {
    if (contentReadyRef.current) return;
    contentReadyRef.current = true;
    scrollToIdx(targetIdx, false);
  }, [scrollToIdx, targetIdx]);

  // Runs on the JS thread alongside the native-driver scroll updates. We
  // only do bookkeeping here (haptics + index tracking); Animated handles
  // the actual visual transform off-thread.
  const handleScrollListener = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, values.length - 1));
      if (clamped !== lastHapticIdxRef.current) {
        const now = Date.now();
        if (now - lastHapticAtRef.current >= HAPTIC_INTERVAL_MS) {
          lastHapticAtRef.current = now;
          Haptics.selectionAsync().catch(() => {});
        }
        lastHapticIdxRef.current = clamped;
      }
    },
    [values.length],
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: handleScrollListener,
      }),
    [scrollY, handleScrollListener],
  );

  const commit = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, values.length - 1));
      const next = values[clamped];
      // Skip redundant onChange when the user lands exactly where they
      // started — keeps render churn down on tiny taps that don't move.
      if (clamped === reportedIdxRef.current) return;
      reportedIdxRef.current = clamped;
      onChange(next);
    },
    [values, onChange],
  );

  return (
    <View style={s.outer}>
      <View
        style={[s.selBg, { borderColor: (accent || colors.border) + '50' }]}
        pointerEvents="none"
      />

      <Animated.ScrollView
        ref={scrollRef}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        bounces={false}
        overScrollMode="never"
        // Strict snap on Android — without this, momentum can land between
        // intervals and `commit` then hard-snaps with a visible jump.
        disableIntervalMomentum={Platform.OS === 'android'}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={commit}
        onScrollEndDrag={commit}
        onContentSizeChange={handleContentSizeChange}
        contentContainerStyle={s.content}
      >
        {values.map((v, i) => {
          // Each item's distance from the selection slot, expressed in
          // contentOffset.y units. Five sample points produce a soft falloff
          // up to two slots away, then clamp.
          const inputRange = [
            (i - 2) * ITEM_H,
            (i - 1) * ITEM_H,
            i * ITEM_H,
            (i + 1) * ITEM_H,
            (i + 2) * ITEM_H,
          ];
          const opacity = scrollY.interpolate({
            inputRange,
            outputRange: [0.35, 0.65, 1, 0.65, 0.35],
            extrapolate: 'clamp',
          });
          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.84, 0.92, 1, 0.92, 0.84],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View key={i} style={[s.item, { opacity, transform: [{ scale }] }]}>
              <Text style={s.text}>{format(v)}</Text>
            </Animated.View>
          );
        })}
      </Animated.ScrollView>

      {/* Hard top/bottom fades hide the partial item slivers at the edges
          of the visible window. Per-item opacity already softens the inner
          gradient, so we only need clean caps. */}
      <View style={[s.fade, { top: 0, height: ITEM_H, opacity: 0.95 }]} pointerEvents="none" />
      <View style={[s.fade, { bottom: 0, height: ITEM_H, opacity: 0.95 }]} pointerEvents="none" />
    </View>
  );
};

function range(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  for (let v = min; v <= max; v += step) out.push(Math.round(v * 10) / 10);
  return out;
}

export const ScrollPicker = ScrollPickerInner as ScrollPickerComponent;
ScrollPicker.ITEM_H = ITEM_H;
ScrollPicker.PICKER_H = PICKER_H;
ScrollPicker.range = range;

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
  content: { paddingVertical: PAD },
  item: { height: ITEM_H, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: fontSize.title3, fontWeight: '700', color: colors.text, fontFamily: fonts.mono },
  fade: { position: 'absolute', left: 0, right: 0, backgroundColor: colors.surfaceElevated },
});
