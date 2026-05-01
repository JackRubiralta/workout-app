import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, fonts, fontSize, radius, spacing, surfaces, text } from '../../../theme';

function NoFoodIcon({ color, size = 48 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={1.6} />
      <Path d="M5 5l14 14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

// Shown when Claude couldn't identify any food in the input — either the
// photo wasn't food (a person, an object, a dog) or the text query didn't
// describe food. Lets the user retry with a different photo / phrasing.
export function NoFoodView({ notes, source, onStartOver }) {
  const subtitle = source === 'photo'
    ? "We couldn't find food in this photo."
    : "That doesn't look like food.";
  return (
    <View style={s.wrap}>
      <View style={s.iconWrap}>
        <NoFoodIcon color={colors.textTertiary} />
      </View>
      <Text style={s.title}>{subtitle}</Text>
      {notes ? (
        <View style={s.notesBox}>
          <Text style={s.notesText}>{notes}</Text>
        </View>
      ) : null}
      <Text style={s.hint}>
        {source === 'photo'
          ? 'Try retaking with the meal centred and well lit, or use the Describe / Manual tabs above.'
          : 'Try describing what you ate (e.g. "two scrambled eggs and toast"), or use Manual.'}
      </Text>
      <TouchableOpacity style={s.btn} onPress={onStartOver} activeOpacity={0.85}>
        <Text style={s.btnText}>{source === 'photo' ? 'Try another photo' : 'Try again'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { padding: spacing.lg, gap: spacing.sm, alignItems: 'center' },
  iconWrap: {
    width: 72, height: 72, borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.md, marginBottom: spacing.xs,
  },
  title: { ...text.title3, fontSize: fontSize.headline, color: colors.text, textAlign: 'center' },
  notesBox: {
    ...surfaces.inset,
    paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.md,
    alignSelf: 'stretch',
  },
  notesText: {
    fontSize: fontSize.footnote, color: colors.textSecondary, fontFamily: fonts.mono,
    lineHeight: 18, textAlign: 'center',
  },
  hint: {
    ...text.bodySecondary, fontSize: 13, color: colors.textTertiary,
    textAlign: 'center', lineHeight: 19, paddingHorizontal: spacing.sm,
  },
  btn: {
    marginTop: spacing.md,
    backgroundColor: colors.text, borderRadius: radius.xl,
    paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.xl,
  },
  btnText: { fontSize: fontSize.subhead, fontWeight: '700', color: colors.background, fontFamily: fonts.mono, letterSpacing: 0.4 },
});
