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
  PanResponder,
  Platform,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { GripIcon } from './icons';
import { colors } from '@/shared/theme';

export type DragListRenderInfo<T> = {
  item: T;
  index: number;
  isActive: boolean;
  /**
   * A pre-built drag handle (vertical 6-dot grip) wired to the gesture
   * responder. Place this anywhere inside the row. The row body itself
   * does not capture gestures, so a parent ScrollView keeps scrolling
   * normally outside the handle. Returns `null` when `enabled` is false.
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
 * Generic drag-to-reorder list. Cross-platform (works on web through
 * react-native-web's PanResponder/Animated). Variable item heights are
 * supported — each row reports its height via onLayout, and the list
 * uses cumulative offsets to compute drop targets.
 *
 * The drag handle is the only gesture surface, so the parent ScrollView
 * remains scrollable everywhere else on the row.
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

  // Measured row heights, keyed by the stable item key so reorders preserve
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

  // Active-drag indices live in refs so the PanResponder closures, which are
  // re-created per render, always read the latest values.
  const activeIndexRef = useRef<number | null>(null);
  const targetIndexRef = useRef<number | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [target, setTarget] = useState<number | null>(null);

  // panY tracks finger delta for the actively dragged row.
  const panY = useRef(new Animated.Value(0)).current;

  // One Animated.Value per item key driving the visual shift of *non-active*
  // rows. We animate transitions so neighbours smoothly slide into place.
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
    setActiveKey(null);
    setTarget(null);
    panY.setValue(0);
  }, [panY]);

  // Drop the drag if the parent disables editing mid-gesture.
  useEffect(() => {
    if (!enabled && activeIndexRef.current != null) {
      snapAllShiftsToZero();
      reset();
    }
  }, [enabled, reset, snapAllShiftsToZero]);

  // Animate neighbour shifts whenever the target index moves.
  useEffect(() => {
    const a = activeIndexRef.current;
    const t = target;
    if (a == null || t == null) {
      keys.forEach(k => {
        Animated.timing(getShift(k), {
          toValue: 0,
          duration: SHIFT_ANIM_MS,
          useNativeDriver: true,
        }).start();
      });
      return;
    }
    const activeHeight = heights[keys[a]] ?? 0;
    const stride = activeHeight + itemSpacing;
    keys.forEach((k, i) => {
      if (i === a) return;
      let s = 0;
      if (a < t && i > a && i <= t) s = -stride;
      else if (a > t && i >= t && i < a) s = stride;
      Animated.timing(getShift(k), {
        toValue: s,
        duration: SHIFT_ANIM_MS,
        useNativeDriver: true,
      }).start();
    });
  }, [target, activeKey, keys, heights, itemSpacing, getShift]);

  // Given the active index and current finger delta, find the slot whose
  // centre the dragged item's centre has crossed.
  const computeTarget = useCallback(
    (fromIndex: number, dy: number): number => {
      const fromHeight = heights[keys[fromIndex]] ?? 0;
      const center = offsets[fromIndex] + fromHeight / 2 + dy;
      let next = fromIndex;
      for (let i = 0; i < keys.length; i++) {
        if (i === fromIndex) continue;
        const slotCenter = offsets[i] + (heights[keys[i]] ?? 0) / 2;
        if (i < fromIndex && center < slotCenter) {
          next = Math.min(next, i);
        } else if (i > fromIndex && center > slotCenter) {
          next = Math.max(next, i);
        }
      }
      return next;
    },
    [heights, keys, offsets],
  );

  const buildHandlers = (rowIndex: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => enabled,
      onStartShouldSetPanResponderCapture: () => enabled,
      onMoveShouldSetPanResponder: () => enabled,
      onMoveShouldSetPanResponderCapture: () => enabled,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: () => {
        activeIndexRef.current = rowIndex;
        targetIndexRef.current = rowIndex;
        setActiveKey(keys[rowIndex]);
        setTarget(rowIndex);
        panY.setValue(0);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      },
      onPanResponderMove: (_e, g) => {
        if (activeIndexRef.current == null) return;
        panY.setValue(g.dy);
        const next = computeTarget(activeIndexRef.current, g.dy);
        if (next !== targetIndexRef.current) {
          targetIndexRef.current = next;
          setTarget(next);
          Haptics.selectionAsync().catch(() => {});
        }
      },
      onPanResponderRelease: () => {
        const from = activeIndexRef.current;
        const to = targetIndexRef.current;
        if (from != null && to != null && from !== to) {
          // Snap shifts before the parent reorders so the new layout
          // doesn't render with stale neighbour offsets.
          snapAllShiftsToZero();
          onReorder(from, to);
        }
        reset();
      },
      onPanResponderTerminate: () => {
        snapAllShiftsToZero();
        reset();
      },
    }).panHandlers;

  return (
    <View style={style}>
      {data.map((item, i) => {
        const key = keys[i];
        const isActive = key === activeKey;
        const shift = getShift(key);

        const transform: Animated.WithAnimatedArray<{ translateY: Animated.AnimatedNode | number }> = isActive
          ? [{ translateY: panY }]
          : [{ translateY: shift }];

        const handle = enabled ? (
          <View
            {...buildHandlers(i)}
            hitSlop={8}
            style={handleStyle}
          >
            <GripIcon color={handleColor} />
          </View>
        ) : null;

        return (
          <Animated.View
            key={key}
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
      })}
    </View>
  );
}

// `cursor`, `touchAction`, and `userSelect` are react-native-web style
// extensions — they are no-ops on native and prevent the browser from
// turning the drag into a page scroll / text selection on web.
const handleStyle = {
  paddingHorizontal: 8,
  paddingVertical: 6,
  alignItems: 'center',
  justifyContent: 'center',
  ...(Platform.OS === 'web'
    ? { cursor: 'grab', touchAction: 'none', userSelect: 'none' }
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
