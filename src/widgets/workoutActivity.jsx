// Live Activity for workout rest timer.
// No imports — globals from expo-widgets JSC runtime.

export default function WorkoutActivity(props, _env) {
  "widget";

  var dayTitle = props.dayTitle || "";
  var exerciseName = props.exerciseName || "";
  var restEndTime = props.restEndTime || 0;
  var setsCompleted = props.setsCompleted || 0;
  var totalSets = props.totalSets || 0;
  var isResting = props.isResting || false;
  var exSetNum = props.exSetNum || 0;
  var exSetTotal = props.exSetTotal || 0;
  var timerDone = props.timerDone || false;

  var now = Date.now();
  var hasTimer = isResting && restEndTime > now && !timerDone;
  var timerLower = new Date(now);
  var timerUpper = new Date(Math.max(restEndTime, now));
  var progress = totalSets > 0 ? setsCompleted / totalSets : 0;
  var totalText = setsCompleted + "/" + totalSets;
  var setText = "SET " + exSetNum + "/" + exSetTotal;

  // ── Status element (reused across layouts) ────────────────────────────

  var statusSmall = timerDone ? (
    <Text modifiers={[font({ size: 13, weight: "heavy", design: "rounded" }), foregroundStyle("#32D74B")]}>
      {"GO"}
    </Text>
  ) : hasTimer ? (
    <Text
      timerInterval={{ lower: timerLower, upper: timerUpper }}
      countsDown={true}
      modifiers={[font({ size: 13, weight: "bold", design: "rounded" }), foregroundStyle("#FFFFFF")]}
    />
  ) : (
    <Text modifiers={[font({ size: 13, weight: "heavy", design: "rounded" }), foregroundStyle("#32D74B")]}>
      {"READY"}
    </Text>
  );

  // ── Banner (Lock Screen) ──────────────────────────────────────────────

  var bannerStatus = timerDone ? (
    <Text modifiers={[font({ size: 22, weight: "heavy", design: "rounded" }), foregroundStyle("#32D74B")]}>
      {"GO"}
    </Text>
  ) : hasTimer ? (
    <Text
      timerInterval={{ lower: timerLower, upper: timerUpper }}
      countsDown={true}
      modifiers={[font({ size: 32, weight: "bold", design: "rounded" }), foregroundStyle("#FFFFFF")]}
    />
  ) : (
    <Text modifiers={[font({ size: 18, weight: "heavy", design: "rounded" }), foregroundStyle("#32D74B")]}>
      {"READY"}
    </Text>
  );

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
        {bannerStatus}
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

  // ── Dynamic Island: compact ───────────────────────────────────────────

  var compactLeading = timerDone ? (
    <Text modifiers={[font({ size: 11, weight: "heavy", design: "rounded" }), foregroundStyle("#32D74B")]}>
      {"GO"}
    </Text>
  ) : hasTimer ? (
    <Text
      timerInterval={{ lower: timerLower, upper: timerUpper }}
      countsDown={true}
      modifiers={[font({ size: 11, weight: "bold", design: "rounded" }), monospacedDigit(), frame({ maxWidth: 44 }), clipped()]}
    />
  ) : (
    <Text modifiers={[font({ size: 11, weight: "heavy", design: "rounded" }), foregroundStyle("#32D74B")]}>
      {exSetNum + "/" + exSetTotal}
    </Text>
  );

  var compactTrailing = (
    <Text modifiers={[font({ size: 9, weight: "semibold", design: "monospaced" }), foregroundStyle("#636366")]}>
      {totalText}
    </Text>
  );

  // ── Dynamic Island: expanded ──────────────────────────────────────────

  var expandedLeading = (
    <VStack modifiers={[frame({ alignment: "leading" })]}>
      <Text modifiers={[font({ size: 16, weight: "bold" }), foregroundStyle("#EBEBF5")]}>
        {exerciseName}
      </Text>
      <HStack>
        <Text modifiers={[font({ size: 11, weight: "heavy", design: "monospaced" }), foregroundStyle("#FF6B6B")]}>
          {dayTitle}
        </Text>
        <Text modifiers={[font({ size: 11, weight: "semibold" }), foregroundStyle("#48484A")]}>
          {"  ·  "}
        </Text>
        <Text modifiers={[font({ size: 11, weight: "semibold", design: "monospaced" }), foregroundStyle("#8E8E93")]}>
          {setText}
        </Text>
      </HStack>
    </VStack>
  );

  var expandedTrailing = timerDone ? (
    <Text modifiers={[font({ size: 18, weight: "heavy", design: "rounded" }), foregroundStyle("#32D74B")]}>
      {"GO"}
    </Text>
  ) : hasTimer ? (
    <Text
      timerInterval={{ lower: timerLower, upper: timerUpper }}
      countsDown={true}
      modifiers={[font({ size: 24, weight: "bold", design: "rounded" }), foregroundStyle("#FFFFFF")]}
    />
  ) : (
    <Text modifiers={[font({ size: 16, weight: "heavy", design: "rounded" }), foregroundStyle("#32D74B")]}>
      {"READY"}
    </Text>
  );

  var expandedBottom = (
    <VStack>
      <ProgressView value={progress} />
      <HStack modifiers={[padding({ top: 4 })]}>
        <Text modifiers={[font({ size: 10, weight: "semibold", design: "monospaced" }), foregroundStyle("#636366")]}>
          {totalText + " sets"}
        </Text>
        <Spacer />
      </HStack>
    </VStack>
  );

  // ── Dynamic Island: minimal ───────────────────────────────────────────

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

  return {
    banner: banner,
    compactLeading: compactLeading,
    compactTrailing: compactTrailing,
    expandedLeading: expandedLeading,
    expandedTrailing: expandedTrailing,
    expandedBottom: expandedBottom,
    minimal: minimal,
  };
}
