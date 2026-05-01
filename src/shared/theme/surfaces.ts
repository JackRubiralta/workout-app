import type { ViewStyle } from 'react-native';
import { colors, radius, spacing } from './tokens';

// Shared surface/card style mixins.
//
//   wrap: { ...surfaces.card, padding: spacing.md, gap: spacing.sm },
//
// Variants:
//   • card    — large hero card (DayCard, SessionCard, SummaryCard)
//   • row     — narrower list row pill (FoodPill, ExerciseRow)
//   • inset   — quieter inset surface (chips, sub-cards on a hero card)
//   • dashed  — outlined "add" placeholder rows
export const surfaces = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inset: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dashed: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
} satisfies Record<string, ViewStyle>;

export const rowPadding = {
  paddingVertical: spacing.sm + 2,
  paddingHorizontal: spacing.md,
} satisfies ViewStyle;
