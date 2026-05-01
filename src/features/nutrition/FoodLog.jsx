import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, rowPadding, spacing, surfaces, text } from '../../theme';
import { SectionLabel } from '../../components/primitives/SectionLabel';
import { CameraIcon } from '../../shell/icons';
import { formatTime } from '../../utils/date';
import { copy } from '../../copy';
import { formatFoodMeta } from './hooks/useNutritionLog';

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
              <CameraIcon color={colors.textSecondary} size={12} strokeWidth={1.6} />
              {photoCount > 1 ? <Text style={s.photoBadgeText}>{photoCount}</Text> : null}
            </View>
          )}
        </View>
        <Text style={s.meta} numberOfLines={1}>{formatFoodMeta(item)}</Text>
      </View>
      <Text style={s.kcal}>{item.calories}</Text>
    </TouchableOpacity>
  );
}

export function FoodLog({ items, onPressItem }) {
  return (
    <View style={s.wrap}>
      <View style={s.headerRow}>
        <SectionLabel>FOOD LOG</SectionLabel>
        <Text style={s.count}>{items.length} item{items.length === 1 ? '' : 's'}</Text>
      </View>
      {items.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyTitle}>{copy.empty.foodLog.title}</Text>
          <Text style={s.emptySub}>{copy.empty.foodLog.subtitle}</Text>
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
  },
  count: { ...text.monoCaption, fontWeight: '600', color: colors.textSecondary, letterSpacing: 0.3 },

  list: { gap: 6 },
  pill: {
    ...surfaces.row,
    ...rowPadding,
    flexDirection: 'row', alignItems: 'center',
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
    ...surfaces.card,
    padding: spacing.lg, alignItems: 'center', gap: 4,
  },
  emptyTitle: { ...text.title3, fontSize: 17, color: colors.text },
  emptySub: { ...text.bodySecondary, textAlign: 'center', lineHeight: 20, fontSize: 14 },
});
