import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, fontSize } from '../constants/theme';

// ─── Geometry helpers ───────────────────────────────────────────────────────

function getGeometry(size, strokeWidth) {
  const r = (size - strokeWidth) / 2;
  return { r, c: 2 * Math.PI * r, cx: size / 2 };
}

// Animate a numeric value from 0 → target on mount, returning the live value via state.
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
    // re-run whenever target changes (date switch / new food logged)
  }, [target, duration, av]);

  return value;
}

// ─── Big calorie ring ────────────────────────────────────────────────────────

export function CalorieRing({ value = 0, goal = 2000, color = colors.text, size = 168 }) {
  const STROKE = 12;
  const { r, c, cx } = getGeometry(size, STROKE);
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
          stroke={over ? '#FF453A' : color}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90, ${cx}, ${cx})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, ringStyles.center]} pointerEvents="none">
        <Text style={ringStyles.bigValue}>{Math.round(value)}</Text>
        <Text style={ringStyles.bigUnit}>/ {goal} kcal</Text>
        <Text style={[ringStyles.bigSub, over && { color: '#FF453A' }]}>
          {over ? `+${Math.round(value - goal)} over` : `${remaining} left`}
        </Text>
      </View>
    </View>
  );
}

// ─── Small macro ring ────────────────────────────────────────────────────────

export function MacroRing({ label, value = 0, goal = 0, unit = 'g', color, size = 70 }) {
  const STROKE = 6;
  const { r, c, cx } = getGeometry(size, STROKE);
  const targetPct = goal > 0 ? Math.min(value / goal, 1.5) : 0;
  const animated = useMountedValue(targetPct);
  const offset = c * (1 - Math.min(animated, 1));
  const over = goal > 0 && value > goal;

  return (
    <View style={ringStyles.macroOuter}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cx} r={r} stroke={colors.timerTrack} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={cx}
            cy={cx}
            r={r}
            stroke={over ? '#FF453A' : color}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${c} ${c}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform={`rotate(-90, ${cx}, ${cx})`}
          />
        </Svg>
        <View style={[StyleSheet.absoluteFill, ringStyles.center]} pointerEvents="none">
          <Text style={[ringStyles.macroValue, { color: over ? '#FF453A' : colors.text }]}>
            {Math.round(value)}
          </Text>
          <Text style={ringStyles.macroUnit}>{unit}</Text>
        </View>
      </View>
      <Text style={[ringStyles.macroLabel, { color }]}>{label}</Text>
      <Text style={ringStyles.macroGoal}>of {goal}{unit}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const ringStyles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },

  // Big calorie
  bigValue: {
    fontSize: 40,
    fontWeight: '400',
    color: colors.text,
    fontFamily: fonts.serif,
    letterSpacing: -0.5,
    includeFontPadding: false,
  },
  bigUnit: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  bigSub: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  // Small macro
  macroOuter: { alignItems: 'center', gap: 4 },
  macroValue: {
    fontSize: 17,
    fontWeight: '700',
    fontFamily: fonts.mono,
    includeFontPadding: false,
  },
  macroUnit: {
    fontSize: 9,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    fontWeight: '500',
    marginTop: 1,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fonts.mono,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  macroGoal: {
    fontSize: 9,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
  },
});
