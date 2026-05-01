import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '@/shared/theme';

const STROKE_WIDTH = 10;

function getGeometry(size: number) {
  const r = (size - STROKE_WIDTH) / 2;
  return { r, circumference: 2 * Math.PI * r, center: size / 2 };
}

export type CircularTimerProps = {
  secondsLeft: number;
  totalSeconds: number;
  size?: number;
  label?: string;
  color?: string;
};

export function CircularTimer({
  secondsLeft,
  totalSeconds,
  size = 180,
  label = 'REST',
  color,
}: CircularTimerProps) {
  const { r, circumference, center } = getGeometry(size);
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const dashOffset = circumference * (1 - progress);
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const display = `${mins}:${secs.toString().padStart(2, '0')}`;

  const timeFontSize = Math.round(size * 0.255);
  const labelFontSize = Math.round(size * 0.072);

  const ringColor = color ?? colors.text;
  const labelColor = color ?? colors.textSecondary;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={colors.timerTrack}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={ringColor}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>
      <View
        style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
        pointerEvents="none"
      >
        <Text
          style={{
            fontSize: timeFontSize,
            fontWeight: '400',
            color: colors.text,
            letterSpacing: -1,
            includeFontPadding: false,
            fontFamily: fonts.serif,
          }}
          numberOfLines={1}
        >
          {display}
        </Text>
        <Text
          style={{
            marginTop: 3,
            fontSize: labelFontSize,
            fontWeight: '600',
            color: labelColor,
            letterSpacing: 3,
            fontFamily: fonts.mono,
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}
