import React, { useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, fonts, fontSize, macroColors, radius, spacing, text } from '../../theme';
import { useNutritionData } from '../../shell/store';
import { IconButton } from '../../components/primitives/Button';
import { confirm } from '../../utils/confirm';

function ChevronLeft({ color, size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function TrashIcon({ color, size = 18 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6h18M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
            stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 11v6M14 11v6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function MacroCell({ label, value, unit, color }) {
  return (
    <View style={s.macroCell}>
      <Text style={[s.macroValue, { color }]}>{value}{unit ? <Text style={s.macroUnit}>{unit}</Text> : null}</Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

function formatLong(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    + ' · '
    + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function FoodItemDetailScreen({ navigation, route }) {
  const { dateKey, itemId } = route.params || {};
  const { logsByDate, removeFood } = useNutritionData();
  const item = useMemo(() => {
    const day = logsByDate[dateKey] ?? [];
    return day.find(it => it.id === itemId) ?? null;
  }, [logsByDate, dateKey, itemId]);

  const handleDelete = useCallback(() => {
    if (!item) return;
    confirm({
      title: 'Remove item?',
      message: `Remove "${item.name}" from this day's log.`,
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: () => {
        removeFood(dateKey, item.id);
        navigation.goBack();
      },
    });
  }, [item, removeFood, dateKey, navigation]);

  if (!item) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.header}>
          <IconButton onPress={() => navigation.goBack()}>
            <ChevronLeft color={colors.text} />
          </IconButton>
          <View style={{ flex: 1 }} />
        </View>
        <Text style={[text.title3, { padding: spacing.lg, color: colors.textSecondary }]}>
          Item not found
        </Text>
      </SafeAreaView>
    );
  }

  const photos = item.photos ?? [];
  const sourceLabel = item.source === 'photo' ? 'PHOTO' : item.source === 'text' ? 'DESCRIBED' : item.source === 'manual' ? 'MANUAL' : null;
  const confColor = item.confidence === 'high' ? colors.success
                  : item.confidence === 'low' ? colors.danger
                  : item.confidence === 'medium' ? colors.warning : null;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <IconButton onPress={() => navigation.goBack()}>
          <ChevronLeft color={colors.text} />
        </IconButton>
        <View style={{ flex: 1 }} />
        <IconButton onPress={handleDelete} style={{ borderColor: colors.danger + '70', backgroundColor: colors.dangerBg }}>
          <TrashIcon color={colors.danger} />
        </IconButton>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.titleArea}>
          <Text style={text.hero} numberOfLines={3}>{item.name}</Text>
          <View style={s.tagRow}>
            <Text style={s.dateText}>{formatLong(item.addedAt)}</Text>
            {sourceLabel && (
              <View style={s.sourceTag}>
                <Text style={s.sourceText}>{sourceLabel}</Text>
              </View>
            )}
            {confColor && (
              <View style={[s.sourceTag, { borderColor: confColor + '50', backgroundColor: confColor + '15' }]}>
                <Text style={[s.sourceText, { color: confColor }]}>{(item.confidence ?? '').toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.qtyCard}>
          <Text style={s.qtyValue}>{item.quantity}</Text>
          <Text style={s.qtyUnit}>{item.unit}</Text>
        </View>

        <View style={s.macroGrid}>
          <View style={[s.macroBlock, { backgroundColor: macroColors.calories + '14', borderColor: macroColors.calories + '40' }]}>
            <Text style={[s.macroBig, { color: macroColors.calories }]}>{item.calories}</Text>
            <Text style={s.macroBigLabel}>CAL</Text>
          </View>
          <View style={s.macrosRow}>
            <MacroCell label="PROTEIN" value={item.protein} unit="g" color={macroColors.protein} />
            <MacroCell label="CARBS" value={item.carbs} unit="g" color={macroColors.carbs} />
            <MacroCell label="FAT" value={item.fat} unit="g" color={macroColors.fat} />
            <MacroCell label="FIBER" value={item.fiber ?? 0} unit="g" color={colors.textSecondary} />
          </View>
        </View>

        {item.notes ? (
          <View style={s.notesCard}>
            <Text style={[text.eyebrow, { color: colors.textTertiary }]}>NOTES</Text>
            <Text style={s.notesText}>{item.notes}</Text>
          </View>
        ) : null}

        {Array.isArray(item.components) && item.components.length > 0 && (
          <View style={s.componentsSection}>
            <Text style={[text.eyebrow, { marginLeft: 2, color: colors.textTertiary }]}>
              BREAKDOWN · {item.components.length} ITEM{item.components.length === 1 ? '' : 'S'}
            </Text>
            {item.components.map((c, i) => (
              <View key={i} style={s.componentRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.componentName} numberOfLines={1}>{c.name}</Text>
                  <Text style={s.componentMeta} numberOfLines={1}>
                    {c.quantity} {c.unit} · {c.protein}P / {c.carbs}C / {c.fat}F{c.fiber > 0 ? ` / ${c.fiber}fib` : ''}
                  </Text>
                </View>
                <Text style={s.componentKcal}>{c.calories}</Text>
              </View>
            ))}
          </View>
        )}

        {photos.length > 0 && (
          <View style={s.photosSection}>
            <Text style={[text.eyebrow, { marginLeft: 2, color: colors.textTertiary }]}>PHOTOS</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  scroll: { paddingHorizontal: spacing.lg },

  titleArea: { paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  dateText: { ...text.monoSubhead, fontSize: 13, color: colors.textSecondary },
  sourceTag: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
  },
  sourceText: { fontSize: 10, fontWeight: '800', color: colors.textSecondary, fontFamily: fonts.mono, letterSpacing: 1 },

  qtyCard: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  qtyValue: { ...text.monoNumber, fontSize: 28 },
  qtyUnit: { ...text.bodySecondary, fontSize: fontSize.body, color: colors.textSecondary },

  macroGrid: { gap: spacing.sm, marginBottom: spacing.md },
  macroBlock: {
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    gap: 4,
  },
  macroBig: { fontSize: 42, fontWeight: '800', fontFamily: fonts.mono, letterSpacing: -0.5 },
  macroBigLabel: { fontSize: 11, fontWeight: '800', color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 1.6 },

  macrosRow: { flexDirection: 'row', gap: spacing.sm },
  macroCell: {
    flex: 1, alignItems: 'center', gap: 2,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md, paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  macroValue: { fontSize: 20, fontWeight: '700', fontFamily: fonts.mono },
  macroUnit: { fontSize: 11, color: colors.textTertiary, fontWeight: '600' },
  macroLabel: { fontSize: 10, fontWeight: '800', color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 1.2 },

  notesCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: 6, marginBottom: spacing.md,
  },
  notesText: { ...text.bodySecondary, fontSize: 14, lineHeight: 20, color: colors.textSecondary },

  componentsSection: { gap: spacing.sm, marginBottom: spacing.md },
  componentRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  componentName: { ...text.title3, fontSize: 15, color: colors.text, fontWeight: '600' },
  componentMeta: { ...text.bodySecondary, fontSize: 12, color: colors.textSecondary, fontFamily: fonts.mono },
  componentKcal: { ...text.title3, fontSize: 16, fontWeight: '700', color: colors.text, fontFamily: fonts.mono, minWidth: 50, textAlign: 'right' },

  photosSection: { gap: spacing.sm, marginBottom: spacing.md },
  photosWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  photoImg: { width: '100%', height: '100%' },

  removeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    borderRadius: radius.xl, borderWidth: 1.5,
    borderColor: colors.danger + '60',
    backgroundColor: colors.dangerBg,
    marginTop: spacing.sm,
  },
  removeText: { ...text.button, color: colors.danger, fontWeight: '700' },
});
