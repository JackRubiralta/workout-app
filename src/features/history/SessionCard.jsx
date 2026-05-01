import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, radius, shadow, spacing, surfaces, text } from '../../theme';
import { sessionVolume } from '../workout/logic/volume';
import { formatTime, relativeDay } from '../../utils/date';
import { compactNumber, formatDurationISO } from '../../utils/format';

export function SessionCard({ session, onPress }) {
  const duration = formatDurationISO(session.startedAt, session.completedAt);
  const volume = sessionVolume(session);
  const status = session.completedAt ? 'done' : session.abandonedAt ? 'abandoned' : 'in-progress';

  return (
    <TouchableOpacity
      style={[s.card, status === 'abandoned' && { opacity: 0.55 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      activeOpacity={0.75}
    >
      <View style={[s.colorBar, { backgroundColor: session.dayColor }]} />
      <View style={s.header}>
        <View style={s.titleArea}>
          <View style={s.titleRow}>
            <Text style={s.title}>{session.dayTitle}</Text>
            {session.dayFocus ? <Text style={s.focus}> · {session.dayFocus}</Text> : null}
          </View>
          <View style={s.metaRow}>
            <Text style={s.meta}>{relativeDay(session.startedAt)}</Text>
            <Text style={s.metaDot}>·</Text>
            <Text style={s.meta}>{formatTime(session.startedAt)}</Text>
            {duration && <><Text style={s.metaDot}>·</Text><Text style={s.meta}>{duration}</Text></>}
          </View>
        </View>
        {status === 'done' ? (
          <View style={[s.statusPill, { backgroundColor: colors.successBg, borderColor: colors.success + '40' }]}>
            <Text style={[s.statusText, { color: colors.success }]}>DONE</Text>
          </View>
        ) : status === 'abandoned' ? (
          <View style={[s.statusPill, { backgroundColor: colors.dangerBg, borderColor: colors.danger + '40' }]}>
            <Text style={[s.statusText, { color: colors.danger }]}>ABANDONED</Text>
          </View>
        ) : (
          <View style={[s.statusPill, { borderColor: session.dayColor }]}>
            <Text style={[s.statusText, { color: session.dayColor }]}>IN PROGRESS</Text>
          </View>
        )}
      </View>

      <View style={s.chips}>
        <View style={s.chip}>
          <Text style={s.chipVal}>{session.entries.filter(e => !e.isPlaceholder).length}</Text>
          <Text style={s.chipLabel}>sets</Text>
        </View>
        {volume > 0 && (
          <View style={s.chip}>
            <Text style={s.chipVal}>{compactNumber(volume)}</Text>
            <Text style={s.chipLabel}>lb vol</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    ...surfaces.card,
    overflow: 'hidden',
    ...shadow.sm,
  },
  colorBar: { height: 3 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, paddingTop: spacing.sm + 2, gap: spacing.sm,
  },
  titleArea: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline' },
  title: { ...text.title3, fontSize: 17, color: colors.text, fontFamily: fonts.mono, letterSpacing: 0.3 },
  focus: { ...text.monoSubhead },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { ...text.monoCaption },
  metaDot: { ...text.monoCaption },

  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800', fontFamily: fonts.mono, letterSpacing: 1 },

  chips: {
    flexDirection: 'row', paddingHorizontal: spacing.md,
    paddingBottom: spacing.md, gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
  },
  chipVal: { ...text.monoCaption, fontWeight: '700', color: colors.text },
  chipLabel: { fontSize: 10, color: colors.textTertiary, fontFamily: fonts.mono, fontWeight: '500' },
});
