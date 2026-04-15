import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../constants/theme';
import { REST_SECONDS } from '../constants/workout';

// ─── Constants ───────────────────────────────────────────────────────────────

const STROKE_WIDTH = 10;

function getGeometry(size) {
  const radius = (size - STROKE_WIDTH) / 2;
  return {
    radius,
    circumference: 2 * Math.PI * radius,
    center: size / 2,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * SVG circular countdown ring.
 *
 * @param {number} secondsLeft  - Remaining seconds
 * @param {number} totalSeconds - Full duration (defaults to REST_SECONDS)
 * @param {number} size         - Outer diameter in dp (defaults to 180)
 */
export function CircularTimer({ secondsLeft, totalSeconds = REST_SECONDS, size = 180 }) {
  const { radius, circumference, center } = getGeometry(size);

  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0; // 1=full, 0=empty
  const strokeDashoffset = circumference * (1 - progress);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeDisplay = `${mins}:${secs.toString().padStart(2, '0')}`;

  // Scale inner text proportionally
  const timeFontSize = Math.round(size * 0.255);
  const labelFontSize = Math.round(size * 0.072);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.timerTrack}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {/* Progress arc — starts at 12 o'clock */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.text}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${center}, ${center})`}
        />
      </Svg>

      {/* Text overlay */}
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
        <Text
          style={{ fontSize: timeFontSize, fontWeight: '400', color: colors.text, letterSpacing: -1, includeFontPadding: false, fontFamily: fonts.serif }}
          numberOfLines={1}
        >
          {timeDisplay}
        </Text>
        <Text
          style={{ marginTop: 3, fontSize: labelFontSize, fontWeight: '600', color: colors.textSecondary, letterSpacing: 3, fontFamily: fonts.mono }}
        >
          REST
        </Text>
      </View>
    </View>
  );
}
