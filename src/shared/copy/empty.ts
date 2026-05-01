// All empty-state text in the app, namespaced by feature. Centralised so
// future i18n is a single import swap and so a copywriter can change tone
// without grepping the codebase.
export const emptyCopy = {
  workouts: {
    title: 'No workouts yet',
    subtitle: 'Complete sets during a workout to start\ntracking your progress here',
  },
  sessionSets: {
    title: 'No sets logged in this session.',
  },
  exerciseHistory: {
    title: 'No history yet',
    subtitle: "Log this exercise during a workout and we'll start charting top sets here.",
  },
  foodLog: {
    title: 'Nothing logged yet',
    subtitle: 'Tap "Add food" above to record what you just ate.',
  },
  resultsRemoved: {
    title: 'No items left. Start over to try again.',
  },
  noData: {
    title: 'No data',
    titleLong: 'No data yet',
  },
} as const;
