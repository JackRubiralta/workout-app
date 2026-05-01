import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { colors, fonts, fontSize, spacing } from '@/shared/theme';
import { copy } from '@/shared/copy';

export type SparklinePoint = { value: number; label?: string };

export type SparklineProps = {
  points: SparklinePoint[];
  color?: string;
  height?: number;
  width?: number;
  valueLabel?: string | null;
  style?: StyleProp<ViewStyle>;
};

export function Sparkline({
  points,
  color,
  height = 80,
  width: fixedWidth,
  valueLabel = null,
}: SparklineProps) {
  const [measuredW, setMeasuredW] = useState(0);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => setMeasuredW(e.nativeEvent.layout.width),
    [],
  );
  const width = fixedWidth ?? measuredW;

  if (!points || points.length === 0) {
    return (
      <View style={[styles.empty, { height }]} onLayout={fixedWidth ? undefined : onLayout}>
        <Text style={styles.emptyText}>{copy.empty.noData.titleLong}</Text>
      </View>
    );
  }

  if (points.length === 1) {
    return (
      <View style={[styles.single, { height }]} onLayout={fixedWidth ? undefined : onLayout}>
        <Text style={styles.singleValue}>{points[0].value}</Text>
        {valueLabel ? <Text style={styles.singleLabel}>{valueLabel}</Text> : null}
      </View>
    );
  }

  if (!width) {
    return <View style={{ height }} onLayout={onLayout} />;
  }

  const padX = 12;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const stepX = innerW / Math.max(1, points.length - 1);
  const xy = points.map((p, i) => ({
    x: padX + i * stepX,
    y: padY + innerH - ((p.value - min) / range) * innerH,
    value: p.value,
  }));

  const polylinePts = xy.map(p => `${p.x},${p.y}`).join(' ');
  const last = xy[xy.length - 1];

  return (
    <View
      style={[styles.wrap, { height, width: fixedWidth ?? '100%' }]}
      onLayout={fixedWidth ? undefined : onLayout}
    >
      <Svg width={width} height={height}>
        <Line
          x1={padX}
          x2={width - padX}
          y1={height - padY + 0.5}
          y2={height - padY + 0.5}
          stroke={colors.border}
          strokeWidth={1}
        />
        <Polyline
          points={polylinePts}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {xy.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === xy.length - 1 ? 4 : 2.5}
            fill={i === xy.length - 1 ? color : colors.surface}
            stroke={color}
            strokeWidth={1.5}
          />
        ))}
      </Svg>
      <View
        style={[styles.tag, { left: Math.max(spacing.xs, last.x - 24), top: Math.max(0, last.y - 26) }]}
      >
        <Text style={[styles.tagText, { color }]}>{last.value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  tag: { position: 'absolute' },
  tagText: { fontSize: fontSize.caption, fontWeight: '700', fontFamily: fonts.mono },
  empty: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  emptyText: { color: colors.textTertiary, fontFamily: fonts.mono, fontSize: fontSize.footnote },
  single: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  singleValue: { fontSize: fontSize.title2, fontWeight: '700', color: colors.text, fontFamily: fonts.mono },
  singleLabel: { fontSize: fontSize.caption, color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 0.5 },
});
