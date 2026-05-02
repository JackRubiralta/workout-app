import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Platform,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { GripIcon } from './icons';
import { colors } from '@/shared/theme';

export type DragListRenderInfo<T> = {
  item: T;
  index: number;
  isActive: boolean;
  /**
   * A grip-icon visual hint for the row. The whole row is draggable in
   * edit mode (the gesture wraps the entire renderItem output), so this
   * handle is purely cosmetic — render it wherever you want users to
   * "see" the drag affordance. Returns `null` when `enabled` is false.
   */
  handle: ReactNode;
};

export type DragListProps<T> = {
  data: ReadonlyArray<T>;
  keyExtractor: (item: T, index: number) => string;
  renderItem: (info: DragListRenderInfo<T>) => ReactNode;
  onReorder: (from: number, to: number) => void;
  /** When false, items render statically and no handle is provided. */
  enabled?: boolean;
  /** Vertical gap between rows. Mirrors a flex-column `gap`. */
  itemSpacing?: number;
  style?: StyleProp<ViewStyle>;
  /** Color for the grip-handle dots. Defaults to textSecondary. */
  handleColor?: string;
};

const SHIFT_ANIM_MS = 160;

/**
 * Generic drag-to-reorder list. Cross-platform via
 * react-native-gesture-handler — works on iOS, Android, and web. Variable
 * row heights are supported (each row reports its size via onLayout, and
 * the list uses cumulative offsets to compute drop targets).
 *
 * In edit mode the entire row is the gesture surface, so users can grab
 * anywhere on a row to drag it. A small vertical activation threshold
 * lets brief taps and outer-page scrolling still pass through to a
 * parent ScrollView.
 */
export function DragList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  enabled = true,
  itemSpacing = 0,
  style,
  handleColor = colors.textSecondary,
}: DragListProps<T>): React.ReactElement {
  const keys = useMemo(
    () => data.map((d, i) => keyExtractor(d, i)),
    [data, keyExtractor],
  );

  // Measured row heights keyed by stable item key so reorders preserve
  // measurements.
  const [heights, setHeights] = useState<Record<string, number>>({});
  const handleLayout = useCallback(
    (key: string) => (e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      setHeights(prev => (prev[key] === h ? prev : { ...prev, [key]: h }));
    },
    [],
  );

  // Cumulative top-edge offsets per index, derived from heights + spacing.
  const offsets = useMemo(() => {
    const offs: number[] = new Array(keys.length);
    let acc = 0;
    for (let i = 0; i < keys.length; i++) {
      offs[i] = acc;
      acc += (heights[keys[i]] ?? 0) + itemSpacing;
    }
    return offs;
  }, [keys, heights, itemSpacing]);

  // Refs hold the latest snapshot of derived layout data so gesture
  // closures can read fresh values without re-creating the gestures.
  const offsetsRef = useRef(offsets);
  offsetsRef.current = offsets;
  const heightsRef = useRef(heights);
  heightsRef.current = heights;
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const itemSpacingRef = useRef(itemSpacing);
  itemSpacingRef.current = itemSpacing;

  // Active-drag indices live in refs so gesture callbacks read the latest
  // values without stale closures.
  const activeIndexRef = useRef<number | null>(null);
  const targetIndexRef = useRef<number | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [target, setTarget] = useState<number | null>(null);

  // panY tracks finger delta for the actively dragged row.
  const panY = useRef(new Animated.Value(0)).current;

  // One Animated.Value per item key driving the visual shift of *non-active*
  // rows. Created lazily, persists across reorders.
  const shiftsRef = useRef<Map<string, Animated.Value>>(new Map());
  const getShift = useCallback((key: string) => {
    let v = shiftsRef.current.get(key);
    if (!v) {
      v = new Animated.Value(0);
      shiftsRef.current.set(key, v);
    }
    return v;
  }, []);

  const snapAllShiftsToZero = useCallback(() => {
    shiftsRef.current.forEach(v => v.setValue(0));
  }, []);

  const reset = useCallback(() => {
    activeIndexRef.current = null;
    targetIndexRef.current = null;
    // Idempotent setters: returning the previous value lets React bail out
    // when nothing actually changed, avoiding render churn on quick taps.
    setActiveKey(prev => (prev != null ? null : prev));
    setTarget(prev => (prev != null ? null : prev));
    panY.setValue(0);
  }, [panY]);

  // Drop the drag if the parent disables editing mid-gesture. Guarded by
  // the `activeIndexRef` so it's a no-op on the initial mount.
  useEffect(() => {
    if (!enabled && activeIndexRef.current != null) {
      snapAllShiftsToZero();
      reset();
    }
  }, [enabled, reset, snapAllShiftsToZero]);

  // Animate neighbour shifts when the target slot changes during a drag.
  // Depends only on the two state values that change during a drag, so the
  // effect doesn't fire on unrelated parent re-renders.
  useEffect(() => {
    const a = activeIndexRef.current;
    const t = target;
    if (a == null || t == null) return;
    const ks = keysRef.current;
    const hs = heightsRef.current;
    const activeHeight = hs[ks[a]] ?? 0;
    const stride = activeHeight + itemSpacingRef.current;
    ks.forEach((k, i) => {
      if (i === a) return;
      let s = 0;
      if (a < t && i > a && i <= t) s = -stride;
      else if (a > t && i >= t && i < a) s = stride;
      Animated.timing(getShift(k), {
        toValue: s,
        duration: SHIFT_ANIM_MS,
        // Web has no native animated module; the JS driver is fine for
        // simple translateY swaps and avoids a noisy fallback warning.
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    });
  }, [target, activeKey, getShift]);

  const computeTarget = useCallback((fromIndex: number, dy: number): number => {
    const ks = keysRef.current;
    const hs = heightsRef.current;
    const offs = offsetsRef.current;
    const fromHeight = hs[ks[fromIndex]] ?? 0;
    const center = offs[fromIndex] + fromHeight / 2 + dy;
    let next = fromIndex;
    for (let i = 0; i < ks.length; i++) {
      if (i === fromIndex) continue;
      const slotCenter = offs[i] + (hs[ks[i]] ?? 0) / 2;
      if (i < fromIndex && center < slotCenter) {
        next = Math.min(next, i);
      } else if (i > fromIndex && center > slotCenter) {
        next = Math.max(next, i);
      }
    }
    return next;
  }, []);

  // Stable callback refs so the `gestures` memo doesn't churn when the
  // parent passes a new closure on every render.
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;

  // One Pan gesture per row. Memoised on `data.length` + `enabled` only so
  // gesture identity is stable across unrelated re-renders.
  //
  // `activeOffsetY([-4, 4])` lets a parent ScrollView own small touches —
  // the gesture only claims the touch after ~4px of vertical movement, so
  // brief taps still bubble up.
  const gestures = useMemo(
    () =>
      Array.from({ length: data.length }, (_, rowIndex) =>
        Gesture.Pan()
          .enabled(enabled)
          .runOnJS(true)
          .activeOffsetY([-4, 4])
          .onStart(() => {
            activeIndexRef.current = rowIndex;
            targetIndexRef.current = rowIndex;
            setActiveKey(keysRef.current[rowIndex] ?? null);
            setTarget(rowIndex);
            panY.setValue(0);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          })
          .onUpdate(e => {
            if (activeIndexRef.current == null) return;
            panY.setValue(e.translationY);
            const next = computeTarget(activeIndexRef.current, e.translationY);
            if (next !== targetIndexRef.current) {
              targetIndexRef.current = next;
              setTarget(next);
              Haptics.selectionAsync().catch(() => {});
            }
          })
          .onEnd(() => {
            const from = activeIndexRef.current;
            const to = targetIndexRef.current;
            if (from != null && to != null && from !== to) {
              snapAllShiftsToZero();
              onReorderRef.current(from, to);
            }
            reset();
          })
          .onFinalize(() => {
            if (activeIndexRef.current != null) {
              snapAllShiftsToZero();
              reset();
            }
          }),
      ),
    [data.length, enabled, computeTarget, panY, reset, snapAllShiftsToZero],
  );

  return (
    <View style={style}>
      {data.map((item, i) => {
        const key = keys[i];
        const isActive = key === activeKey;
        const shift = getShift(key);

        const transform = isActive
          ? [{ translateY: panY }]
          : [{ translateY: shift }];

        const handle = enabled ? (
          <View pointerEvents="none" style={handleStyle}>
            <GripIcon color={handleColor} />
          </View>
        ) : null;

        const inner = (
          <Animated.View
            onLayout={handleLayout(key)}
            style={[
              { transform },
              isActive && activeStyle,
              i < data.length - 1 ? { marginBottom: itemSpacing } : null,
            ]}
          >
            {renderItem({ item, index: i, isActive, handle })}
          </Animated.View>
        );

        return enabled ? (
          <GestureDetector key={key} gesture={gestures[i]}>
            {inner}
          </GestureDetector>
        ) : (
          <React.Fragment key={key}>{inner}</React.Fragment>
        );
      })}
    </View>
  );
}

// On web, `cursor: grab` hints that the row is draggable, and
// `userSelect: none` stops a drag from selecting card text. They are
// no-ops on native.
const handleStyle = {
  paddingHorizontal: 8,
  paddingVertical: 6,
  alignItems: 'center',
  justifyContent: 'center',
  ...(Platform.OS === 'web'
    ? { cursor: 'grab', userSelect: 'none' }
    : null),
} as ViewStyle;

const activeStyle: ViewStyle = {
  zIndex: 10,
  elevation: 6,
  shadowColor: '#000',
  shadowOpacity: 0.35,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
};
