import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fontSize, fonts } from '../../theme';

function geometry(size, strokeWidth) {
  const r = (size - strokeWidth) / 2;
  return { r, c: 2 * Math.PI * r, cx: size / 2 };
}

function useMountedValue(target, duration = 750) {
  const [value, setValue] = useState(0);
  const av = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    av.stopAnimation();
    setValue(0);
    av.setValue(0);
    const id = av.addListener(({ value: v }) => setValue(v));
    Animated.timing(av, { toValue: target, duration, useNativeDriver: false }).start();
    return () => av.removeListener(id);
  }, [target, duration, av]);
  return value;
}

export function CalorieRing({ value = 0, goal = 2000, color = colors.text, size = 168 }) {
  const STROKE = 12;
  const { r, c, cx } = geometry(size, STROKE);
  const targetPct = goal > 0 ? Math.min(value / goal, 1.5) : 0;
  const animated = useMountedValue(targetPct);
  const offset = c * (1 - Math.min(animated, 1));
  const remaining = Math.max(Math.round(goal - value), 0);
  const over = value > goal;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={cx} cy={cx} r={r} stroke={colors.timerTrack} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          stroke={over ? colors.danger : color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90, ${cx}, ${cx})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, s.center]} pointerEvents="none">
        <Text style={s.bigValue}>{Math.round(value)}</Text>
        <Text style={s.bigUnit}>/ {goal} kcal</Text>
        <Text style={[s.bigSub, over && { color: colors.danger }]}>
          {over ? `+${Math.round(value - goal)} over` : `${remaining} left`}
        </Text>
      </View>
    </View>
  );
}

// More-is-better hit-the-goal ring (protein, carbs, fat, fiber). Going
// over the goal isn't a problem — the ring fills, the colour stays the
// macro accent, and the sub-line reads "+N over" instead of "N left".
export function MacroRing({ label, value = 0, goal = 0, unit = 'g', color, size = 70 }) {
  const STROKE = 6;
  const { r, c, cx } = geometry(size, STROKE);
  const targetPct = goal > 0 ? Math.min(value / goal, 1.5) : 0;
  const animated = useMountedValue(targetPct);
  const offset = c * (1 - Math.min(animated, 1));
  const over = goal > 0 && value > goal;
  const deltaText = goal <= 0
    ? ''
    : over
      ? `+${Math.round(value - goal)} over`
      : `${Math.max(Math.round(goal - value), 0)} left`;
  return (
    <View style={s.macroOuter}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cx} r={r} stroke={colors.timerTrack} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={cx}
            cy={cx}
            r={r}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90, ${cx}, ${cx})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, s.center]} pointerEvents="none">
          <Text style={s.macroValue}>{Math.round(value)}</Text>
          <Text style={s.macroUnit}>{unit}</Text>
        </View>
      </View>
      <Text style={[s.macroLabel, { color }]}>{label}</Text>
      <Text style={s.macroGoal}>{deltaText}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  bigValue: { fontSize: 40, fontWeight: '400', color: colors.text, fontFamily: fonts.serif, letterSpacing: -0.5, includeFontPadding: false },
  bigUnit: { fontSize: fontSize.caption, fontWeight: '600', color: colors.textSecondary, fontFamily: fonts.mono, letterSpacing: 0.5, marginTop: 2 },
  bigSub: { marginTop: 4, fontSize: fontSize.micro, fontWeight: '700', color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 1, textTransform: 'uppercase' },
  macroOuter: { alignItems: 'center', gap: 4 },
  macroValue: { fontSize: 17, fontWeight: '700', fontFamily: fonts.mono, color: colors.text, includeFontPadding: false },
  macroUnit: { fontSize: 9, color: colors.textTertiary, fontFamily: fonts.mono, fontWeight: '500', marginTop: 1 },
  macroLabel: { fontSize: fontSize.micro, fontWeight: '700', fontFamily: fonts.mono, letterSpacing: 1, textTransform: 'uppercase' },
  macroGoal: { fontSize: 9, color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 0.3 },
});
