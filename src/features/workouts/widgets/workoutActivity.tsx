// Live Activity for workout rest / set timer.
// No imports — globals from expo-widgets JSC runtime.
//
// ── Why the expanded view mirrors the compact view ─────────────────────────
// iOS does not expose a way to opt out of the long-press → expanded
// transition on the Dynamic Island; ActivityKit requires every Live
// Activity to declare an expanded layout. The closest we can get to "don't
// expand" is to make the expanded slots render the SAME content as the
// compact slots, with no bottom region. That way a long-press doesn't
// reveal extra information and the visual delta is just the system-imposed
// pill chrome growing slightly.
//
// All exercise / day / progress detail is reserved for the lock-screen
// banner where the user actually wants context.
//
// `var` (not const/let) is retained to match the JSC runtime style used
// across this file.

// @ts-nocheck — expo-widgets injects globals at runtime; no static types

import type { WorkoutActivityProps } from '../types/liveActivityTypes';

export default function WorkoutActivity(props: WorkoutActivityProps, _env: unknown) {
  "widget";

  // ── Inputs ────────────────────────────────────────────────────────────
  var dayTitle      = props.dayTitle      || "";
  var exerciseName  = props.exerciseName  || "";
  var restEndTime   = props.restEndTime   || 0;
  var setsCompleted = props.setsCompleted || 0;
  var totalSets     = props.totalSets     || 0;
  var isResting     = props.isResting     || false;
  var exSetNum      = props.exSetNum      || 0;
  var exSetTotal    = props.exSetTotal    || 0;
  var timerDone     = props.timerDone     || false;

  var now        = Date.now();
  var hasTimer   = isResting && restEndTime > now && !timerDone;
  var timerLower = new Date(now);
  var timerUpper = new Date(Math.max(restEndTime, now));
  var progress   = totalSets > 0 ? setsCompleted / totalSets : 0;
  var totalText  = setsCompleted + "/" + totalSets;
  var setText    = "SET " + exSetNum + "/" + exSetTotal;

  // ── Shared status renderers ───────────────────────────────────────────
  function statusView(size) {
    if (timerDone) {
      return (
        <Text modifiers={[font({ size: size, weight: "heavy", design: "rounded" }), foregroundStyle("#32D74B")]}>
          {"GO"}
        </Text>
      );
    }
    if (hasTimer) {
      return (
        <Text
          timerInterval={{ lower: timerLower, upper: timerUpper }}
          countsDown={true}
          modifiers={[font({ size: size, weight: "bold", design: "rounded" }), monospacedDigit(), frame({ maxWidth: size * 4 }), clipped()]}
        />
      );
    }
    return (
      <Text modifiers={[font({ size: size, weight: "heavy", design: "rounded" }), foregroundStyle("#32D74B")]}>
        {"READY"}
      </Text>
    );
  }

  // ── Compact (Dynamic Island, idle pill state) ─────────────────────────
  var compactLeading = statusView(11);

  var compactTrailing = (
    <Text modifiers={[font({ size: 9, weight: "semibold", design: "monospaced" }), foregroundStyle("#636366")]}>
      {totalText}
    </Text>
  );

  // ── Minimal (Dynamic Island, off-screen pill) ─────────────────────────
  var minimal = timerDone ? (
    <Text modifiers={[font({ size: 9, weight: "heavy" }), foregroundStyle("#32D74B")]}>
      {"!"}
    </Text>
  ) : hasTimer ? (
    <Text
      timerInterval={{ lower: timerLower, upper: timerUpper }}
      countsDown={true}
      modifiers={[font({ size: 9, weight: "bold", design: "rounded" })]}
    />
  ) : (
    <Text modifiers={[font({ size: 9, weight: "heavy" }), foregroundStyle("#32D74B")]}>
      {exSetNum + "/" + exSetTotal}
    </Text>
  );

  // ── Lock-screen banner ────────────────────────────────────────────────
  var banner = (
    <VStack modifiers={[padding({ top: 16, bottom: 16, leading: 20, trailing: 20 })]}>
      <HStack modifiers={[padding({ bottom: 12 })]}>
        <VStack modifiers={[frame({ alignment: "leading" })]}>
          <Text modifiers={[font({ size: 17, weight: "bold" }), foregroundStyle("#EBEBF5")]}>
            {exerciseName}
          </Text>
          <HStack>
            <Text modifiers={[font({ size: 12, weight: "heavy", design: "monospaced" }), foregroundStyle("#FF6B6B")]}>
              {dayTitle}
            </Text>
            <Text modifiers={[font({ size: 12, weight: "semibold" }), foregroundStyle("#48484A")]}>
              {"  ·  "}
            </Text>
            <Text modifiers={[font({ size: 12, weight: "semibold", design: "monospaced" }), foregroundStyle("#8E8E93")]}>
              {setText}
            </Text>
          </HStack>
        </VStack>
        <Spacer />
        {statusView(timerDone ? 22 : hasTimer ? 32 : 18)}
      </HStack>
      <ProgressView value={progress} />
      <HStack modifiers={[padding({ top: 6 })]}>
        <Text modifiers={[font({ size: 11, weight: "semibold", design: "monospaced" }), foregroundStyle("#636366")]}>
          {totalText + " sets"}
        </Text>
        <Spacer />
      </HStack>
    </VStack>
  );

  return {
    banner: banner,
    compactLeading: compactLeading,
    compactTrailing: compactTrailing,
    expandedLeading: compactLeading,
    expandedTrailing: compactTrailing,
    minimal: minimal,
  };
}
