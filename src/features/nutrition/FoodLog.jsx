import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, radius, spacing, text } from '../../theme';

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function CameraIcon({ color, size = 12 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9V19a1 1 0 0 0 1 1H20a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H17l-2-3H9L7 8H4a1 1 0 0 0-1 1z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    </Svg>
  );
}

function FoodPill({ item, onPress }) {
  const photoCount = (item.photos ?? []).length;
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={s.pill}
      activeOpacity={0.7}
    >
      <View style={s.timeCol}>
        <Text style={s.time}>{formatTime(item.addedAt) || '—'}</Text>
      </View>
      <View style={s.main}>
        <View style={s.nameRow}>
          <Text style={s.name} numberOfLines={1}>{item.name}</Text>
          {photoCount > 0 && (
            <View style={s.photoBadge}>
              <CameraIcon color={colors.textSecondary} />
              {photoCount > 1 ? <Text style={s.photoBadgeText}>{photoCount}</Text> : null}
            </View>
          )}
        </View>
        <Text style={s.meta} numberOfLines={1}>
          {item.quantity} {item.unit} · {item.protein}P / {item.carbs}C / {item.fat}F
        </Text>
      </View>
      <Text style={s.kcal}>{item.calories}</Text>
    </TouchableOpacity>
  );
}

export function FoodLog({ items, onPressItem }) {
  return (
    <View style={s.wrap}>
      <View style={s.headerRow}>
        <Text style={[text.eyebrow, { color: colors.textTertiary }]}>FOOD LOG</Text>
        <Text style={s.count}>{items.length} item{items.length === 1 ? '' : 's'}</Text>
      </View>
      {items.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyTitle}>Nothing logged yet</Text>
          <Text style={s.emptySub}>Tap "Snap a photo" above to record what you just ate.</Text>
        </View>
      ) : (
        <View style={s.list}>
          {items.map(item => (
            <FoodPill key={item.id} item={item} onPress={() => onPressItem(item.id)} />
          ))}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: spacing.sm },
  headerRow: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  count: { ...text.monoCaption, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.3 },

  list: { gap: 6 },
  pill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  timeCol: { width: 56 },
  time: { ...text.monoCaption, color: colors.textSecondary, fontWeight: '700', letterSpacing: 0.3 },
  main: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...text.title3, fontSize: 15, color: colors.text, fontWeight: '700', flexShrink: 1 },
  photoBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 6, paddingVertical: 2,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
  },
  photoBadgeText: { fontSize: 10, color: colors.textSecondary, fontFamily: fonts.mono, fontWeight: '700' },
  meta: { ...text.bodySecondary, fontSize: 12, color: colors.textSecondary, fontFamily: fonts.mono },
  kcal: { ...text.title3, fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: fonts.mono, minWidth: 50, textAlign: 'right' },

  emptyBox: {
    backgroundColor: colors.surface, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, alignItems: 'center', gap: 4,
  },
  emptyTitle: { ...text.title3, fontSize: 17, color: colors.text },
  emptySub: { ...text.bodySecondary, textAlign: 'center', lineHeight: 20, fontSize: 14 },
});
