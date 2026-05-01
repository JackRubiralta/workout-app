import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { colors, fonts, fontSize, spacing, surfaces, text } from '../../theme';
import { Chip } from '../../ui';
import { PlusIcon } from '../../ui/icons';
import { useSettingsData } from '../../shell/store';
import { fromLb, unitLabel } from '../../utils/units';
import { formatTime, relativeDay } from '../../utils/date';

// Weight chart: draws an SVG line over the entries with a guide line at the
// minimum and a filled dot at the latest point. Tries to be informative even
// with few data points (renders single dot when only one entry).
//
// Each entry is stored in lb; the chart projects to display unit so the
// last-value tag matches the rest of the card and the y-axis range scales
// correctly when the user flips imperial ↔ metric.
function WeightChart({ entries, color, system, height = 110, width = 320 }) {
  if (!entries.length) return null;

  const padX = 12;
  const padTop = 14;
  const padBottom = 14;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const displayValues = entries.map(e => fromLb(e.weight, system));
  const minV = Math.min(...displayValues);
  const maxV = Math.max(...displayValues);
  const range = Math.max(maxV - minV, 1);

  const ts = entries.map(e => new Date(e.recordedAt).getTime());
  const minT = Math.min(...ts);
  const maxT = Math.max(...ts);
  const tRange = Math.max(maxT - minT, 1);

  const pts = entries.map((e, i) => {
    const dv = displayValues[i];
    const x = padX + ((new Date(e.recordedAt).getTime() - minT) / tRange) * innerW;
    const y = padTop + innerH - ((dv - minV) / range) * innerH;
    return { x, y, value: dv };
  });

  if (pts.length === 1) pts[0] = { ...pts[0], x: padX + innerW / 2 };

  const polyline = pts.map(p => `${p.x},${p.y}`).join(' ');
  const last = pts[pts.length - 1];

  return (
    <View style={{ width, height, alignSelf: 'stretch' }}>
      <Svg width={width} height={height}>
        <Line x1={padX} x2={width - padX} y1={padTop + innerH + 0.5} y2={padTop + innerH + 0.5} stroke={colors.border} strokeWidth={1} />
        {pts.length > 1 && (
          <Polyline
            points={polyline}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {pts.map((p, i) => (
          <Circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === pts.length - 1 ? 4 : 2.5}
            fill={i === pts.length - 1 ? color : colors.surface}
            stroke={color}
            strokeWidth={1.5}
          />
        ))}
      </Svg>
      <View style={{ position: 'absolute', left: Math.max(spacing.xs, last.x - 22), top: Math.max(0, last.y - 22) }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color, fontFamily: fonts.mono }}>
          {Math.round(last.value * 10) / 10}
        </Text>
      </View>
    </View>
  );
}

export function BodyWeightCard({ entries, latest, onLog }) {
  const { unitSystem } = useSettingsData();
  const unit = unitLabel(unitSystem);
  const recent = useMemo(() => entries.slice(-30), [entries]);

  const latestDisplay = useMemo(() => {
    if (!latest) return null;
    const v = fromLb(latest.weight, unitSystem);
    return Math.round(v * 10) / 10;
  }, [latest, unitSystem]);

  const delta = useMemo(() => {
    if (entries.length < 2) return null;
    const firstLb = entries[0].weight;
    const lastLb = entries[entries.length - 1].weight;
    return Math.round((fromLb(lastLb, unitSystem) - fromLb(firstLb, unitSystem)) * 10) / 10;
  }, [entries, unitSystem]);

  const period = useMemo(() => {
    if (entries.length < 2) return null;
    const days = Math.max(1, Math.round((new Date(entries[entries.length - 1].recordedAt) - new Date(entries[0].recordedAt)) / 86400000));
    if (days < 7) return `${days}d`;
    if (days < 60) return `${Math.round(days / 7)}w`;
    return `${Math.round(days / 30)}mo`;
  }, [entries]);

  return (
    <View style={s.card}>
      <View style={s.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[text.eyebrow, { color: colors.textTertiary }]}>BODY WEIGHT</Text>
          {latest ? (
            <View style={s.valueRow}>
              <Text style={s.value}>{latestDisplay}</Text>
              <Text style={s.unit}>{unit}</Text>
              <Text style={s.relative}>· {relativeDay(latest.recordedAt, { lowercase: true })} · {formatTime(latest.recordedAt)}</Text>
            </View>
          ) : (
            <Text style={s.empty}>No entries yet</Text>
          )}
          {delta != null && (
            <Text style={[s.delta, delta < 0 ? { color: colors.success } : delta > 0 ? { color: colors.warning } : { color: colors.textSecondary }]}>
              {delta > 0 ? '+' : ''}{delta} {unit} · last {period}
            </Text>
          )}
        </View>

        <Chip
          label="Log"
          icon={<PlusIcon color={colors.text} size={16} />}
          onPress={onLog}
          variant="strong"
        />
      </View>

      {recent.length > 0 && (
        <View style={s.chartWrap}>
          <WeightChart entries={recent} color={colors.success} system={unitSystem} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    ...surfaces.card,
    padding: spacing.md, gap: spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  value: { ...text.monoNumber, fontSize: fontSize.title1 },
  unit: { ...text.bodySecondary, fontSize: fontSize.callout },
  relative: { ...text.bodySecondary, fontSize: 12 },
  empty: { ...text.bodySecondary, fontSize: fontSize.body, marginTop: 4 },
  delta: { ...text.monoFootnote, fontWeight: '700', marginTop: 2, letterSpacing: 0.2 },

  chartWrap: { alignItems: 'center', marginTop: spacing.xs },
});
