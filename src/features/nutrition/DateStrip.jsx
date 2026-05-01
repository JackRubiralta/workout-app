import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, surfaces, text } from '../../theme';
import { ChevronLeft, ChevronRight } from '../../ui/icons';
import { addDays, formatDateLong, isSameDay, startOfDay } from '../../utils/date';

// Centered pill with prev/next chevrons. Tapping the label jumps back to
// today; the next-arrow is disabled while viewing today (no future days).
export function DateStrip({ date, onChange }) {
  const today = startOfDay(new Date());
  const isToday = isSameDay(date, today);
  const goPrev = () => { Haptics.selectionAsync().catch(() => {}); onChange(addDays(date, -1)); };
  const goNext = () => { if (isToday) return; Haptics.selectionAsync().catch(() => {}); onChange(addDays(date, 1)); };
  const goToday = () => { if (isToday) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); onChange(today); };

  return (
    <View style={s.row}>
      <TouchableOpacity onPress={goPrev} hitSlop={8} style={s.arrow} activeOpacity={0.6}>
        <ChevronLeft color={colors.textSecondary} size={18} strokeWidth={2.2} />
      </TouchableOpacity>
      <TouchableOpacity onPress={goToday} activeOpacity={0.7} style={s.center}>
        <Text style={s.label}>{isToday ? 'Today' : formatDateLong(date)}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={goNext} hitSlop={8} style={[s.arrow, isToday && { opacity: 0.3 }]} activeOpacity={0.6} disabled={isToday}>
        <ChevronRight color={colors.textSecondary} size={18} strokeWidth={2.2} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    ...surfaces.row,
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.full,
    paddingHorizontal: 4, paddingVertical: 4,
    alignSelf: 'center',
  },
  arrow: { width: 32, height: 32, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  center: { paddingHorizontal: spacing.md, minWidth: 140, alignItems: 'center' },
  label: { ...text.callout, fontWeight: '700', color: colors.text },
});
