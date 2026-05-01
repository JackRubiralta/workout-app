# Workout Tracker

Expo + React Native app, TypeScript end-to-end, file-based routing via
Expo Router.

## Local dev

```bash
npm install
cp .env.example .env   # then paste your Anthropic key
npx expo start -c      # -c clears Metro cache so EXPO_PUBLIC_* changes take effect
npm run typecheck      # tsc --noEmit
```

`.env` is gitignored. The only required variable is `EXPO_PUBLIC_ANTHROPIC_API_KEY`.

## Architecture

```
app/                              # Expo Router routes ONLY (thin re-exports)
  _layout.tsx                       Root stack with providers + active-session modal
  index.tsx                         Redirects "/" → /(tabs)/workout
  active-session.tsx                Modal route over the tab bar
  (tabs)/_layout.tsx                Bottom tab bar
  (tabs)/{nutrition,workout,tracking}/
    _layout.tsx                     Per-tab Stack
    index.tsx                       Tab landing screen
    <detail>.tsx                    Detail screens

src/
  features/
    nutrition/                      Macro logging + AI photo analysis
    workouts/                       Programs, sessions, timers, Live Activity
    tracking/                       Body weight + workout history
  shared/
    components/                     Cross-feature design-system primitives
    hooks/                          App-wide hooks (useSettings, useKeyboardVisible)
    state/store.tsx                 Composes feature hooks into context providers
    theme/                          Tokens, typography, surfaces
    utils/                          Pure helpers (date, format, ids, units, confirm)
    copy/                           User-facing strings
    types/                          App-wide types (settings)
  storage/                          AsyncStorage wrapper, keys, v1→v2 migration
```

Path alias `@/*` resolves to `src/*`.

## Building for iOS (preview)

```bash
eas build --platform ios --profile preview
```

### One-time setup before the first preview build

The Anthropic key has to be available on EAS's build servers (your local `.env`
is **not** uploaded). Create it once for the `preview` environment:

```bash
eas env:create \
  --environment preview \
  --name EXPO_PUBLIC_ANTHROPIC_API_KEY \
  --value "sk-ant-..." \
  --visibility plaintext
```

`--visibility plaintext` is fine because `EXPO_PUBLIC_*` vars are inlined into
the JS bundle at build time anyway — anyone who unpacks the IPA can extract them.
Replace with a backend proxy before any public release.

If you also build on the `production` profile, repeat with `--environment production`.

### What the build does

- Runs `expo prebuild` (regenerates `/ios`, which is gitignored)
- Applies the `expo-image-picker` config plugin (adds `NSCameraUsageDescription`
  + `NSPhotoLibraryUsageDescription` to Info.plist — required or the app
  crashes when opening the picker)
- Applies the `expo-widgets` plugin for the workout-timer Live Activity
- Inlines `EXPO_PUBLIC_ANTHROPIC_API_KEY` into the JS bundle from the EAS env
- Produces an `.ipa` you can install via the EAS QR / TestFlight

### Live Activity caveat

The Live Activity (rest timer) needs the `expo-widgets` plugin's app-group +
widget bundle ID to match the main app — already configured in `app.json` as
`group.com.jackrubiralta.workouttracker`. If you change the bundle ID, update
both. (This is why the previous README said "required so weird things to get
live activity to work".)

## Running on a simulator

`eas build --profile preview` produces a device build (arm64). For the iOS
simulator, use the `development` profile or `npx expo run:ios`.
