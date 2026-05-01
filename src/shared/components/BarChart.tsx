import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Line } from 'react-native-svg';
import { colors, fonts, fontSize } from '@/shared/theme';
import { copy } from '@/shared/copy';

export type BarChartBar = {
  value: number;
  label?: string;
  accent?: string;
  isToday?: boolean;
};

export type BarChartProps = {
  bars: BarChartBar[];
  color?: string;
  goal?: number | null;
  height?: number;
  width?: number;
};

export function BarChart({
  bars,
  color,
  goal = null,
  height = 110,
  width: fixedWidth,
}: BarChartProps) {
  const [measuredW, setMeasuredW] = useState(0);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => setMeasuredW(e.nativeEvent.layout.width),
    [],
  );
  const width = fixedWidth ?? measuredW;

  if (!bars || bars.length === 0) {
    return (
      <View style={[styles.empty, { height }]} onLayout={fixedWidth ? undefined : onLayout}>
        <Text style={styles.emptyText}>{copy.empty.noData.title}</Text>
      </View>
    );
  }

  if (!width) {
    return <View style={{ height }} onLayout={onLayout} />;
  }

  const padX = 12;
  const padTop = 8;
  const padBottom = 24;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;
  const max = Math.max(goal ?? 0, ...bars.map(b => b.value), 1);

  const slot = innerW / bars.length;
  const barW = Math.min(slot - 6, 28);

  const goalY = goal != null ? padTop + innerH - (goal / max) * innerH : null;

  return (
    <View
      style={[styles.wrap, { height, width: fixedWidth ?? '100%' }]}
      onLayout={fixedWidth ? undefined : onLayout}
    >
      <Svg width={width} height={height}>
        {goalY != null && (
          <Line
            x1={padX}
            x2={width - padX}
            y1={goalY}
            y2={goalY}
            stroke={colors.textTertiary}
            strokeDasharray="4 4"
            strokeWidth={1}
          />
        )}
        {bars.map((b, i) => {
          const v = Math.max(0, b.value);
          const h = (v / max) * innerH;
          const x = padX + i * slot + (slot - barW) / 2;
          const y = padTop + innerH - h;
          const fill = b.accent ?? color ?? colors.text;
          const overGoal = goal != null && v > goal;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={Math.max(2, h)}
              rx={3}
              fill={overGoal ? colors.warning : fill}
              opacity={v > 0 ? 0.95 : 0.25}
            />
          );
        })}
      </Svg>
      <View style={[styles.labels, { width }]}>
        {bars.map((b, i) => (
          <Text
            key={i}
            style={[
              styles.label,
              { width: slot, marginLeft: i === 0 ? padX : 0 },
              b.isToday && styles.labelToday,
            ]}
            numberOfLines={1}
          >
            {b.label ?? ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  labels: { position: 'absolute', flexDirection: 'row', bottom: 4, left: 0 },
  label: { fontSize: 10, color: colors.textTertiary, fontFamily: fonts.mono, textAlign: 'center', letterSpacing: 0.3 },
  labelToday: { color: colors.text, fontWeight: '700' },
  empty: { alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  emptyText: { color: colors.textTertiary, fontFamily: fonts.mono, fontSize: fontSize.footnote },
});
