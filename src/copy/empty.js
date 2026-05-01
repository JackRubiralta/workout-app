// All empty-state text in the app, namespaced by feature. Centralised so
// future i18n is a single import swap and so a copywriter can change tone
// without grepping the codebase.
//
// Each entry exposes `title` (one short sentence) and an optional `subtitle`
// (one supporting sentence; line-breaks intentional).
export const emptyCopy = {
  // Tracking tab — first launch, no workouts logged yet.
  workouts: {
    title: 'No workouts yet',
    subtitle: 'Complete sets during a workout to start\ntracking your progress here',
  },
  // Tracking tab → session detail — session exists but no sets logged.
  sessionSets: {
    title: 'No sets logged in this session.',
  },
  // Per-exercise history sheet — exercise has never been logged.
  exerciseHistory: {
    title: 'No history yet',
    subtitle: "Log this exercise during a workout and we'll start charting top sets here.",
  },
  // Nutrition tab → FoodLog when no items on the selected day.
  foodLog: {
    title: 'Nothing logged yet',
    subtitle: 'Tap "Add food" above to record what you just ate.',
  },
  // AddFoodSheet → ResultsView when the user removed every item.
  resultsRemoved: {
    title: 'No items left. Start over to try again.',
  },
  // Sparkline / BarChart placeholders when there's no series.
  noData: {
    title: 'No data',
    titleLong: 'No data yet',
  },
};
