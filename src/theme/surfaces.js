import { colors, radius, spacing } from './tokens';

// Shared surface/card style mixins. Spread into a StyleSheet.create entry to
// avoid copy-pasting `backgroundColor + borderRadius + border` everywhere.
//
//   wrap: { ...surfaces.card, padding: spacing.md, gap: spacing.sm },
//
// Pick the variant that matches what you're building:
//   • card    — large hero card (DayCard, SessionCard, SummaryCard, etc.)
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
};

// Standard padding for a list-row pill (FoodPill, ExerciseRow). Pulled out so
// the two list-row variants in the app stay in lockstep.
export const rowPadding = {
  paddingVertical: spacing.sm + 2,
  paddingHorizontal: spacing.md,
};
