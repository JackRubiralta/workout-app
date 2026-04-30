# Rewrite — Changes

Top-level rewrite of the React Native (Expo 55) workout + nutrition app.
All §2 features are preserved, the program/workout split is merged into one
tab, tracking is significantly deeper, and the codebase is broken into
small focused files. AsyncStorage data is migrated v1 → v2; v1 keys are
left in place as a one-cycle rollback.

## Things you need to do manually

1. **Rotate the Anthropic API key.** The literal `sk-ant-…nWdjCQAA` was
   shipped in `src/services/nutrition.js` in commits `25dc5e8` and
   `950f58c`. The source no longer contains it (now reads from
   `EXPO_PUBLIC_ANTHROPIC_API_KEY`), but **the key is in your git
   history** — anyone with access to the repo can recover it. Rotate it on
   the Anthropic console immediately, then paste the new value into `.env`
   (which is already gitignored).
2. **Re-run `npx expo prebuild`** before next iOS/Android native build —
   you've added `react-native-screens` and `react-native-gesture-handler`,
   plus their plugin configs are auto-linked.
3. **`expo-image-picker` permission strings** were already set in
   `app.json`; no change required.

## Stack changes

- **Added:** `@react-navigation/native`, `@react-navigation/native-stack`,
  `@react-navigation/bottom-tabs`, `react-native-screens`,
  `react-native-gesture-handler`, plus `react-dom`, `react-native-web`,
  `@expo/metro-runtime` for web smoke-testing.
- **No removals.** Everything from §1 is preserved (`expo-haptics`,
  `expo-keep-awake`, `expo-notifications`, `expo-image-picker`,
  `expo-widgets`, `react-native-svg`, `react-native-safe-area-context`,
  `@react-native-async-storage/async-storage`).

## File map (new layout)

```
App.js                         — providers + nav root + notification setup
src/
  shell/
    navigation.jsx             — RootStack + Tabs + ActiveSession modal
    icons.jsx                  — tab-bar icons
    store.jsx                  — context wrapping config / session / nutrition hooks
  theme/
    tokens.js                  — colors, spacing, radius, shadows, fontSize, palettes
    typography.js              — text style presets (mono / serif / sans rule)
    index.js                   — single import surface
  storage/
    keys.js                    — _v2 key registry + LEGACY map + SCHEMA_VERSION
    asyncStore.js              — readJson / writeJson wrappers
    migrate.js                 — one-shot v1 → v2 (config + sessions + nutrition)
  features/
    workout/
      WorkoutListScreen.jsx    — landing: day cards, edit affordance (124 lines)
      DayPreStartScreen.jsx    — NEW intentional start screen (270 lines)
      ActiveSessionScreen.jsx  — set / rest / completion (315 lines)
      DayEditSheet.jsx         — edit a day inline
      ExerciseEditSheet.jsx    — edit a single exercise inline
      ExerciseHistorySheet.jsx — NEW per-exercise sparkline + e1RM + PRs
      SessionHeroes.jsx        — Exercise / Rest / Completion / PRToast
      hooks/
        useWorkoutConfig.js    — program CRUD
        useWorkoutSession.js   — UNIFIED active session + history (replaces useWorkoutLog + useWorkoutProgress)
        useRestTimer.js        — wall-clock rest timer + scheduled notification
        useLiveActivity.js     — Live Activity / Dynamic Island lifecycle
      logic/
        progress.js            — derive isSetDone / nextSet / dayComplete from entries
        suggestions.js         — pre-fill, e1RM (Epley), PR detection, top-set queries
        volume.js              — Σ weight × reps, weekly/monthly counts, streak math
    nutrition/
      NutritionScreen.jsx      — date pager + capture + rings + log
      FoodLog.jsx              — chronological log rows
      DailyTotalsBar.jsx       — bottom totals strip
      GoalsSheet.jsx           — daily macro targets
      AddFoodSheet/
        AddFoodSheet.jsx       — Sheet shell + tab switcher
        ScanTab.jsx            — photo + Anthropic vision
        SearchTab.jsx          — text + Anthropic
        ManualTab.jsx          — NEW manual-entry tab
        ResultsView.jsx        — confidence / items / totals
        PulseDots.jsx          — analyzing-state loader
      hooks/useNutritionLog.js
      services/anthropic.js    — env-keyed Claude calls
    history/
      HistoryListScreen.jsx    — sessions list + summary
      SessionDetailScreen.jsx  — drill-in + per-exercise history hook-in
      SessionCard.jsx          — card with status pill + chips
      SummaryCard.jsx          — weekly / monthly / current streak / longest streak
  components/
    primitives/
      Sheet.jsx                — drag-to-dismiss bottom sheet
      HoldButton.jsx           — HoldButton + HoldCircleButton
      Stepper.jsx, Toggle.jsx
      SheetInput.jsx           — FieldLabel + SheetInput
      Sparkline.jsx            — SVG sparkline with current-value tag
      EmptyState.jsx, LoadingState.jsx
    workout/
      DayCard.jsx, ExerciseList.jsx, CircularTimer.jsx, SetLogSheet.jsx
    nutrition/
      MacroRing.jsx            — CalorieRing + MacroRing
  modules/liveActivity.js      — UNCHANGED (preserved)
  widgets/workoutActivity.jsx  — UNCHANGED (preserved)
  utils/exercise.js            — defaultExercise / migrateExercise / set helpers (unchanged)
  constants/workout.js         — default DAYS (unchanged)
```

## Storage migration map (v1 → v2)

`storage/migrate.js: ensureMigrated()` runs once on first v2 boot, gated by
`@app_meta_v2`. v1 keys are NOT deleted (rollback safety).

| v1 key | v2 key | Notes |
|---|---|---|
| `@workout_config_v1` | `@workout_config_v2` | Day shape unchanged; falls back to default program if missing |
| `@workout_log_v1` (sessions array) + `@workout_progress_v1` (per-day done bools) | `@workout_sessions_v2` `{ sessions, activeSessionId }` | **Unified.** Sessions are migrated as-is; any day that had progress in v1 but no in-progress session in the log gets a synthesized session with placeholder entries (flagged `isPlaceholder: true`, excluded from PR/pre-fill). |
| `@workout_undo_v1_day{N}` | n/a | Old per-day undo key dropped; undo now lives on the active session itself in `session.undoStack`. |
| `@nutrition_log_v1` | `@nutrition_log_v2` | Old `{breakfast,lunch,...}` shape flattened to a chronological array (the same migration v1 was doing inline). Goals merged with new defaults. |
| (new) | `@app_meta_v2` | `{ schemaVersion: 2, migratedAt: ISO }` |

## Behavior changes vs §3

- **§3A merged tab.** Three tabs: Workout · Nutrition · History.
  WorkoutListScreen has a leading day-color stripe + edit-pencil icon, with
  long-press as a secondary path. Tap-on-body → DayPreStart.
- **§3B intentional start.** DayPreStart shows day stats + estimated total
  time (45 s/set + rest), and a primary "Start Workout" CTA. If a session
  is already in-progress for that day, CTA becomes "Resume" with current
  progress (X/Y sets); a "Discard & start fresh" path exists below.
  KeepAwake activates on the active session screen.
- **§3C tracking.**
  - Per-exercise history sheet is opened by tapping an exercise name in
    ActiveSession or in SessionDetail. Shows top-set sparkline, e1RM
    sparkline, best weight + best e1RM stats, and last-N session list.
  - **e1RM = Epley** (`weight × (1 + reps/30)`), labeled "e1RM (Epley)".
  - **PR detection** runs in `recordSetValues`. If a logged value beats
    the prior best by weight (with reps tiebreaker) or by e1RM, the
    session writes `pr` state which renders an inline PRToast on the
    active screen (auto-dismisses after 4 s, also fires success haptic).
  - **Volume per session** = Σ weight × reps for non-warmup, non-placeholder
    entries. Shown in SessionDetail. Per-day rollups via `volume.js`.
  - **Pre-fill** (SetLogSheet): seeds from the most recent COMPLETED
    session's working set for that exercise; shows trend hint
    (`last 135×8 · prev 130×8`) above the inputs.
  - **Streak summary** on History tab: this week, this month, total,
    current streak (consecutive UTC-days ending today/yesterday with a
    workout), longest streak.
  - **Abandoned sessions.** `abandonSession(id)` now actually flags the
    session (`abandonedAt`). HistoryList shows them with reduced opacity
    and an "ABANDONED" status pill. DayPreStart's resume flow handles the
    in-progress-or-discard choice up front.
- **§3D polish.**
  - One typography rule: `mono` for numbers and labels, `serif` for screen
    titles + exercise names + completion banners, `sans` for body. Coded
    as presets in `theme/typography.js`.
  - Empty + loading state primitives (`EmptyState`, `LoadingState`); used
    on History, Nutrition food log, ExerciseHistory, and SessionDetail.
  - `Sheet.jsx` primitive replaces five hand-rolled Modal+PanResponder
    blocks (DayEdit, ExerciseEdit, SetLog, AddFood, Goals).
  - `SetLogSheet`: + / − steppers next to weight & reps with a
    "Same as last set" one-tap chip + the trend hint above the inputs.
  - `HoldButton` / `HoldCircleButton` consolidated, removing the duplicate
    pair that lived in the old WorkoutScreen.

## Code quality bar (where I landed)

- Largest user-written source file is **315 lines** (`ActiveSessionScreen.jsx`
  — orchestrator). Original `HomeScreen.jsx` was 1154, `WorkoutScreen.jsx`
  was 1087, `AddFoodModal.jsx` was 858. Everything else is well under 300.
  `src/constants/workout.js` is 359 lines but it's just default exercise
  data, not logic.
- One source of truth for active session: the `Session` object in
  `useWorkoutSession`. Set-done is derived from `session.entries`. Undo
  lives on the session. No more parallel progress map / log / undo state.
- All hex literals and raw spacing numbers in screens go through
  `theme/`. (Spot-checked with grep — there are some local pixel-tweak
  numbers like `width: 28` left for layout-specific values; the design
  tokens are all routed through `colors`/`spacing`/`radius`/`fontSize`.)
- Hooks have one job each: `useWorkoutConfig` (program CRUD),
  `useWorkoutSession` (active + history), `useRestTimer` (timer +
  notification), `useLiveActivity` (live activity / dynamic island),
  `useNutritionLog` (food log).
- Live Activity bridge in `src/modules/liveActivity.js` and the iOS widget
  in `src/widgets/workoutActivity.jsx` are **byte-for-byte unchanged**;
  the new `useLiveActivity` hook calls them at the same lifecycle points
  as the old screen did (mount → start, set-done / skip / rest-end → update,
  back / complete / abandon → end). Stale-cleanup on cold start in
  `App.js` is preserved.
- Notification scheduling on rest start (incl. `workout-timer` Android
  channel) and the foreground handler are preserved verbatim.
- `expo-image-picker` photo + camera flows preserved; abort/cancel via
  `AbortSignal` is now actually wired through both photo and text paths
  (the existing service supported it but the modal didn't pass one).

## What I verified vs what I did not

| Verified | How |
|---|---|
| All slices bundle | `npx expo export --platform web` → 0 errors, 800-ish modules each pass |
| Dev server boots | `npx expo start --web` → no startup errors before timeout |
| Storage migration logic | Code-reviewed; uses `ensureMigrated` gated by `@app_meta_v2` so it runs once |
| Per-screen line budgets | `wc -l` against ≤ ~300 target — see §"Code quality bar" |

| **Not verified — needs your hands or a device** | Why |
|---|---|
| Actual UI rendering / interaction | I can't drive a browser interactively. Everything I wrote should render but I haven't seen it. |
| Live Activity / Dynamic Island | iOS device only |
| Notification firing in background | Android channel + iOS notification delivery |
| Photo capture + Anthropic photo analysis | Needs camera + a populated `EXPO_PUBLIC_ANTHROPIC_API_KEY` |
| `expo-keep-awake` actually keeping the screen awake | Native behavior |
| Migration against your actual existing on-device data | Needs your installed v1 data |
| `expo prebuild` regeneration of native projects | Needs to be re-run before next native build |

## Follow-ups I deliberately left

- Reorder days on WorkoutList: the old screen had a custom drag-handle PanResponder dance. The new list does not yet have drag-to-reorder; reordering exercises within a day is supported via up/down buttons in the edit sheet. If you want full drag-and-drop reorder back, it's a clean follow-up.
- Trend hint copy ("last 135×8 · prev 130×8") only appears when ≥ 2 prior working sessions exist; otherwise the SetLogSheet just shows pre-filled values. Could surface "first time" copy if you want.
- v1 storage keys are intentionally left on disk for one cycle. After a few weeks of stable use, you can wipe them with a one-shot cleanup migration.
- I did not migrate to TypeScript. The brief said "if it's genuinely cleaner — but if you do convert, convert everything"; partial was worse than none.
- I did not introduce a backend proxy for the Anthropic key. Per the brief, this stays a personal build with `EXPO_PUBLIC_ANTHROPIC_API_KEY`.
