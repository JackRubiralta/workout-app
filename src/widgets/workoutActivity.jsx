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
  var setsLeft = exSetTotal - exSetNum;
  var setsLeftText = setsLeft + " left";

  // ── Banner (Lock Screen) ──────────────────────────────────────────────

  var banner = timerDone ? (
    // TIMER JUST FINISHED — ready for next set
    <VStack modifiers={[padding({ top: 14, bottom: 14, leading: 20, trailing: 20 })]}>
      <HStack>
        <Text modifiers={[font({ size: 13, weight: "heavy", design: "monospaced" }), foregroundStyle("#FF6B6B")]}>
          {dayTitle}
        </Text>
        <Spacer />
        <Text modifiers={[font({ size: 12, weight: "semibold", design: "monospaced" }), foregroundStyle("#636366")]}>
          {totalText}
        </Text>
      </HStack>
      <HStack modifiers={[padding({ top: 8 })]}>
        <VStack>
          <Text modifiers={[font({ size: 15, weight: "semibold" }), foregroundStyle("#EBEBF5")]}>
            {exerciseName}
          </Text>
          <Text modifiers={[font({ size: 11, weight: "bold", design: "monospaced" }), foregroundStyle("#636366")]}>
            {setsLeft > 0 ? setsLeftText : "LAST SET"}
          </Text>
        </VStack>
        <Spacer />
        <Text modifiers={[font({ size: 14, weight: "heavy", design: "rounded" }), foregroundStyle("#32D74B")]}>
          {"GO"}
        </Text>
      </HStack>
      <ProgressView value={progress} modifiers={[padding({ top: 10 })]} />
    </VStack>
  ) : hasTimer ? (
    // RESTING — countdown timer
    <VStack modifiers={[padding({ top: 14, bottom: 14, leading: 20, trailing: 20 })]}>
      <HStack>
        <Text modifiers={[font({ size: 13, weight: "heavy", design: "monospaced" }), foregroundStyle("#FF6B6B")]}>
          {dayTitle}
        </Text>
        <Spacer />
        <Text modifiers={[font({ size: 12, weight: "semibold", design: "monospaced" }), foregroundStyle("#636366")]}>
          {totalText}
        </Text>
      </HStack>
      <HStack modifiers={[padding({ top: 8 })]}>
        <VStack>
          <Text modifiers={[font({ size: 15, weight: "semibold" }), foregroundStyle("#EBEBF5")]}>
            {exerciseName}
          </Text>
          <Text modifiers={[font({ size: 11, weight: "bold", design: "monospaced" }), foregroundStyle("#636366")]}>
            {setsLeft > 0 ? setsLeftText : "LAST SET"}
          </Text>
        </VStack>
        <Spacer />
        <Text
          timerInterval={{ lower: timerLower, upper: timerUpper }}
          countsDown={true}
          modifiers={[font({ size: 28, weight: "bold", design: "rounded" }), foregroundStyle("#FFFFFF")]}
        />
      </HStack>
      <ProgressView value={progress} modifiers={[padding({ top: 10 })]} />
    </VStack>
  ) : (
    // READY — waiting for user to do the set
    <VStack modifiers={[padding({ top: 14, bottom: 14, leading: 20, trailing: 20 })]}>
      <HStack>
        <Text modifiers={[font({ size: 13, weight: "heavy", design: "monospaced" }), foregroundStyle("#FF6B6B")]}>
          {dayTitle}
        </Text>
        <Spacer />
        <Text modifiers={[font({ size: 12, weight: "semibold", design: "monospaced" }), foregroundStyle("#636366")]}>
          {totalText}
        </Text>
      </HStack>
      <HStack modifiers={[padding({ top: 8 })]}>
        <VStack>
          <Text modifiers={[font({ size: 15, weight: "semibold" }), foregroundStyle("#EBEBF5")]}>
            {exerciseName}
          </Text>
          <Text modifiers={[font({ size: 11, weight: "bold", design: "monospaced" }), foregroundStyle("#EBEBF560")]}>
            {"SET " + exSetNum + "/" + exSetTotal}
          </Text>
        </VStack>
        <Spacer />
        <Text modifiers={[font({ size: 13, weight: "bold", design: "rounded" }), foregroundStyle("#32D74B")]}>
          {"READY"}
        </Text>
      </HStack>
      <ProgressView value={progress} modifiers={[padding({ top: 10 })]} />
    </VStack>
  );

  // ── Dynamic Island: compact ───────────────────────────────────────────
  // Only use compactLeading with short content. Leave trailing very small
  // so the pill doesn't expand across the full status bar.

  var compactLeading = timerDone ? (
    <Text modifiers={[font({ size: 11, weight: "heavy", design: "rounded" }), foregroundStyle("#32D74B")]}>
      {"GO"}
    </Text>
  ) : hasTimer ? (
    <Text
      timerInterval={{ lower: timerLower, upper: timerUpper }}
      countsDown={true}
      modifiers={[font({ size: 11, weight: "bold", design: "rounded" })]}
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

  // ── Dynamic Island: expanded (minimal — matches compact feel) ─────────

  var expandedLeading = (
    <Text modifiers={[font({ size: 13, weight: "semibold" }), foregroundStyle("#EBEBF5")]}>
      {exerciseName}
    </Text>
  );

  var expandedTrailing = compactLeading;

  // ── Dynamic Island: minimal ───────────────────────────────────────────

  var minimal = timerDone ? (
    <Text modifiers={[font({ size: 9, weight: "heavy" }), foregroundStyle("#FF9F0A")]}>
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
    minimal: minimal,
  };
}
