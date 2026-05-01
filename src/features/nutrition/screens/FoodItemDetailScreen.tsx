import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors, fonts, fontSize, macroColors, radius, spacing, surfaces, text } from '@/shared/theme';
import { useNutritionData } from '@/shared/state/store';
import { DetailHeader, IconButton, SectionLabel, StatusPill } from '@/shared/components';
import { TrashIcon } from '@/shared/components/icons';
import { FoodSource, Confidence } from '../constants/nutritionConstants';
import { formatDateTime } from '@/shared/utils/date';
import { confirm } from '@/shared/utils/confirm';
import { formatFoodMeta } from '../utils/nutritionMath';

type MacroCellProps = {
  label: string;
  value: number;
  unit: string;
  color: string;
};

function MacroCell({ label, value, unit, color }: MacroCellProps) {
  return (
    <View style={s.macroCell}>
      <Text style={[s.macroValue, { color }]}>
        {value}
        {unit ? <Text style={s.macroUnit}>{unit}</Text> : null}
      </Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

export function FoodItemDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dateKey?: string | string[]; itemId?: string | string[] }>();
  const dateKey = Array.isArray(params.dateKey) ? params.dateKey[0] : params.dateKey;
  const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;

  const { logsByDate, removeFood } = useNutritionData();
  const item = useMemo(() => {
    if (!dateKey || !itemId) return null;
    const day = logsByDate[dateKey] ?? [];
    return day.find(it => it.id === itemId) ?? null;
  }, [logsByDate, dateKey, itemId]);

  const handleDelete = useCallback(() => {
    if (!item || !dateKey) return;
    confirm({
      title: 'Remove item?',
      message: `Remove "${item.name}" from this day's log.`,
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: () => {
        removeFood(dateKey, item.id);
        router.back();
      },
    });
  }, [item, removeFood, dateKey, router]);

  if (!item) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <DetailHeader onBack={() => router.back()} />
        <Text style={[text.title3 as TextStyle, { padding: spacing.lg, color: colors.textSecondary }]}>
          Item not found
        </Text>
      </SafeAreaView>
    );
  }

  const photos = item.photos ?? [];
  const sourceLabel =
    item.source === FoodSource.PHOTO
      ? 'PHOTO'
      : item.source === FoodSource.TEXT
        ? 'DESCRIBED'
        : item.source === FoodSource.MANUAL
          ? 'MANUAL'
          : null;
  const confColor =
    item.confidence === Confidence.HIGH
      ? colors.success
      : item.confidence === Confidence.LOW
        ? colors.danger
        : item.confidence === Confidence.MEDIUM
          ? colors.warning
          : null;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <DetailHeader
        onBack={() => router.back()}
        right={
          <IconButton onPress={handleDelete} variant="danger">
            <TrashIcon color={colors.danger} />
          </IconButton>
        }
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.titleArea}>
          <Text style={text.hero as TextStyle} numberOfLines={3}>
            {item.name}
          </Text>
          <View style={s.tagRow}>
            <Text style={s.dateText}>{formatDateTime(item.addedAt)}</Text>
            {sourceLabel && <StatusPill label={sourceLabel} color={colors.textSecondary} />}
            {confColor && <StatusPill label={(item.confidence ?? '').toUpperCase()} color={confColor} />}
          </View>
        </View>

        <View style={s.macroGrid}>
          <View style={s.macroBlock}>
            <View style={s.macroBlockMain}>
              <Text style={[s.macroBig, { color: macroColors.calories }]}>{item.calories}</Text>
              <Text style={s.macroBigLabel}>CAL</Text>
            </View>
            <View style={s.macroBlockMeta}>
              <Text style={s.qtyValue}>{item.quantity}</Text>
              <Text style={s.qtyUnit}>{item.unit}</Text>
            </View>
          </View>
          <View style={s.macrosRow}>
            <MacroCell label="PROTEIN" value={item.protein} unit="g" color={macroColors.protein} />
            <MacroCell label="CARBS" value={item.carbs} unit="g" color={macroColors.carbs} />
            <MacroCell label="FAT" value={item.fat} unit="g" color={macroColors.fat} />
            <MacroCell label="FIBER" value={item.fiber ?? 0} unit="g" color={macroColors.fiber} />
          </View>
        </View>

        {item.notes ? (
          <View style={s.notesCard}>
            <SectionLabel style={s.subSectionLabel}>NOTES</SectionLabel>
            <Text style={s.notesText}>{item.notes}</Text>
          </View>
        ) : null}

        {Array.isArray(item.components) && item.components.length > 0 && (
          <View style={s.componentsSection}>
            <SectionLabel>
              BREAKDOWN · {item.components.length} ITEM{item.components.length === 1 ? '' : 'S'}
            </SectionLabel>
            {item.components.map((c, i) => (
              <View key={i} style={s.componentRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.componentName} numberOfLines={1}>
                    {c.name}
                  </Text>
                  <Text style={s.componentMeta} numberOfLines={1}>
                    {formatFoodMeta(c)}
                  </Text>
                </View>
                <Text style={s.componentKcal}>{c.calories}</Text>
              </View>
            ))}
          </View>
        )}

        {photos.length > 0 && (
          <View style={s.photosSection}>
            <SectionLabel>PHOTOS</SectionLabel>
            <View style={s.photosWrap}>
              {photos.map((p, i) => (
                <View key={i} style={s.photoFrame}>
                  <Image source={{ uri: p.uri }} style={s.photoImg} />
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity onPress={handleDelete} style={s.removeBtn} activeOpacity={0.7}>
          <TrashIcon color={colors.danger} />
          <Text style={s.removeText}>Remove from log</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl + 64 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.lg },

  titleArea: { paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  dateText: { ...(text.monoSubhead as TextStyle), fontSize: 13, color: colors.textSecondary },

  qtyValue: { ...(text.monoNumber as TextStyle), fontSize: 22, color: colors.text },
  qtyUnit: {
    ...(text.bodySecondary as TextStyle),
    fontSize: 13,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
  },

  macroGrid: { gap: spacing.sm, marginBottom: spacing.md },
  macroBlock: {
    ...surfaces.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  macroBlockMain: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  macroBlockMeta: { alignItems: 'flex-end', gap: 2 },
  macroBig: { fontSize: 42, fontWeight: '800', fontFamily: fonts.mono, letterSpacing: -0.5, lineHeight: 46 },
  macroBigLabel: { ...(text.eyebrowSmall as TextStyle), fontFamily: fonts.mono },

  macrosRow: { flexDirection: 'row', gap: spacing.xs + 2 },
  macroCell: {
    ...surfaces.row,
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  macroValue: { ...(text.monoNumber as TextStyle), fontSize: fontSize.title3 },
  macroUnit: { fontSize: fontSize.caption, color: colors.textTertiary, fontWeight: '600' },
  macroLabel: { ...(text.eyebrowSmall as TextStyle), fontFamily: fonts.mono },

  notesCard: {
    ...surfaces.row,
    padding: spacing.md,
    gap: 6,
    marginBottom: spacing.md,
  },
  subSectionLabel: { marginLeft: 0 },
  notesText: { ...(text.bodySecondary as TextStyle), fontSize: 14, lineHeight: 20, color: colors.textSecondary },

  componentsSection: { gap: spacing.sm, marginBottom: spacing.md },
  componentRow: {
    ...surfaces.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
  },
  componentName: { ...(text.title3 as TextStyle), fontSize: 15, color: colors.text, fontWeight: '600' },
  componentMeta: { ...(text.bodySecondary as TextStyle), fontSize: 12, color: colors.textSecondary, fontFamily: fonts.mono },
  componentKcal: {
    ...(text.title3 as TextStyle),
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fonts.mono,
    minWidth: 50,
    textAlign: 'right',
  },

  photosSection: { gap: spacing.sm, marginBottom: spacing.md },
  photosWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoImg: { width: '100%', height: '100%' },

  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.danger + '60',
    backgroundColor: colors.dangerBg,
    marginTop: spacing.sm,
  },
  removeText: { ...(text.button as TextStyle), color: colors.danger, fontWeight: '700' },
});
