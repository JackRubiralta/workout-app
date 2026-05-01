import type { TextStyle } from 'react-native';
import { colors, fonts, fontSize } from './tokens';

// Refreshed type rule:
//   sans (system)  → titles, body, buttons, exercise names, day names
//   mono           → numbers/metrics ONLY (counts, weights, reps, durations, dates)
//   serif          → reserved for hero moments (completion banner, special cards)

export const text = {
  // Display
  hero:        { fontSize: 40, fontWeight: '800', color: colors.text, fontFamily: fonts.sans, letterSpacing: -0.5 },
  largeTitle:  { fontSize: fontSize.largeTitle, fontWeight: '800', color: colors.text, fontFamily: fonts.sans, letterSpacing: -0.4 },
  title1:      { fontSize: fontSize.title1, fontWeight: '700', color: colors.text, fontFamily: fonts.sans, letterSpacing: -0.3 },
  title2:      { fontSize: fontSize.title2, fontWeight: '700', color: colors.text, fontFamily: fonts.sans, letterSpacing: -0.2 },
  title3:      { fontSize: fontSize.title3, fontWeight: '700', color: colors.text, fontFamily: fonts.sans, letterSpacing: -0.1 },

  // Specialty
  serifTitle:  { fontSize: fontSize.title2, fontWeight: '700', color: colors.text, fontFamily: fonts.serif, letterSpacing: 0 },
  exerciseName:{ fontWeight: '800', color: colors.text, fontFamily: fonts.sans, letterSpacing: -0.4, textAlign: 'center' },

  // Body
  body:           { fontSize: fontSize.body, color: colors.text, fontFamily: fonts.sans },
  callout:        { fontSize: fontSize.callout, color: colors.text, fontFamily: fonts.sans, lineHeight: 22 },
  bodySecondary:  { fontSize: fontSize.subhead, color: colors.textSecondary, fontFamily: fonts.sans, lineHeight: 22 },
  bodyTertiary:   { fontSize: fontSize.subhead, color: colors.textTertiary, fontFamily: fonts.sans, lineHeight: 20 },

  // Eyebrow / labels
  eyebrow:        { fontSize: fontSize.caption, fontWeight: '700', color: colors.textTertiary, fontFamily: fonts.sans, letterSpacing: 1.4, textTransform: 'uppercase' },
  eyebrowSmall:   { fontSize: fontSize.micro, fontWeight: '800', color: colors.textTertiary, fontFamily: fonts.sans, letterSpacing: 1.6, textTransform: 'uppercase' },
  setLabel:       { fontSize: fontSize.subhead, fontWeight: '800', color: colors.text, fontFamily: fonts.sans, letterSpacing: 2.6, textTransform: 'uppercase' },

  // Mono
  monoNumber:     { fontSize: fontSize.title2, fontWeight: '700', color: colors.text, fontFamily: fonts.mono },
  monoBig:        { fontSize: fontSize.title1, fontWeight: '700', color: colors.text, fontFamily: fonts.mono, letterSpacing: -0.3 },
  monoSubhead:    { fontSize: fontSize.subhead, color: colors.textSecondary, fontFamily: fonts.mono },
  monoFootnote:   { fontSize: fontSize.footnote, color: colors.textSecondary, fontFamily: fonts.mono },
  monoCaption:    { fontSize: fontSize.caption, color: colors.textTertiary, fontFamily: fonts.mono },

  // Buttons
  button:        { fontSize: fontSize.headline, fontWeight: '700', color: colors.text, fontFamily: fonts.sans, letterSpacing: 0.2 },
  buttonSmall:   { fontSize: fontSize.subhead, fontWeight: '600', color: colors.text, fontFamily: fonts.sans, letterSpacing: 0.2 },
  buttonStrong:  { fontSize: fontSize.headline, fontWeight: '800', color: colors.text, fontFamily: fonts.sans, letterSpacing: 0.3 },
} satisfies Record<string, TextStyle>;
