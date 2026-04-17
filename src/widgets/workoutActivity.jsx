// Live Activity layout for the workout rest timer.
// No imports — components (Text, HStack, VStack, Spacer, ProgressView) and
// modifiers (font, padding, foregroundStyle) are globals injected by the
// expo-widgets JSC runtime. The "widget" directive tells babel to serialize
// this function to a string that the widget extension evaluates natively.

export default function WorkoutActivity(props, _env) {
  "widget";

  var dayTitle = props.dayTitle || "";
  var exerciseName = props.exerciseName || "";
  var setLabel = props.setLabel || "";
  var restEndTime = props.restEndTime || 0;
  var setsCompleted = props.setsCompleted || 0;
  var totalSets = props.totalSets || 0;
  var isResting = props.isResting || false;

  var now = Date.now();
  var hasTimer = isResting && restEndTime > now;
  var timerLower = new Date(now);
  var timerUpper = new Date(Math.max(restEndTime, now));
  var progress = totalSets > 0 ? setsCompleted / totalSets : 0;
  var setsText = setsCompleted + "/" + totalSets;

  // ── Banner (Lock Screen / Notification Center) ──
  var banner = (
    <VStack modifiers={[padding({ all: 16 })]}>
      <HStack>
        <Text modifiers={[font({ size: 14, weight: "bold", design: "monospaced" }), foregroundStyle("#FF4757")]}>
          {dayTitle}
        </Text>
        <Spacer />
        <Text modifiers={[font({ size: 12, weight: "semibold", design: "monospaced" }), foregroundStyle("#8E8E93")]}>
          {setsText + " sets"}
        </Text>
      </HStack>
      <HStack modifiers={[padding({ top: 6 })]}>
        <VStack>
          <Text modifiers={[font({ size: 16, weight: "semibold" }), foregroundStyle("#FFFFFF")]}>
            {exerciseName}
          </Text>
          <Text modifiers={[font({ size: 11, weight: "bold", design: "monospaced" }), foregroundStyle("#8E8E93")]}>
            {setLabel}
          </Text>
        </VStack>
        <Spacer />
        {hasTimer ? (
          <Text
            timerInterval={{ lower: timerLower, upper: timerUpper }}
            countsDown={true}
            modifiers={[font({ size: 28, weight: "bold", design: "monospaced" }), foregroundStyle("#FFFFFF")]}
          />
        ) : null}
      </HStack>
      <ProgressView value={progress} modifiers={[padding({ top: 8 })]} />
    </VStack>
  );

  // ── Dynamic Island: compact ──
  var compactLeading = (
    <Text modifiers={[font({ size: 12, weight: "bold", design: "monospaced" }), foregroundStyle("#FF4757")]}>
      {dayTitle.length > 4 ? dayTitle.substring(0, 4) : dayTitle}
    </Text>
  );

  var compactTrailing = hasTimer ? (
    <Text
      timerInterval={{ lower: timerLower, upper: timerUpper }}
      countsDown={true}
      modifiers={[font({ size: 12, weight: "bold", design: "monospaced" }), foregroundStyle("#FFFFFF")]}
    />
  ) : (
    <Text modifiers={[font({ size: 12, weight: "semibold", design: "monospaced" }), foregroundStyle("#8E8E93")]}>
      {setsText}
    </Text>
  );

  // ── Dynamic Island: expanded ──
  var expandedLeading = (
    <VStack>
      <Text modifiers={[font({ size: 12, weight: "bold", design: "monospaced" }), foregroundStyle("#FF4757")]}>
        {dayTitle}
      </Text>
      <Text modifiers={[font({ size: 11, weight: "medium", design: "monospaced" }), foregroundStyle("#8E8E93")]}>
        {exerciseName}
      </Text>
    </VStack>
  );

  var expandedTrailing = (
    <VStack>
      {hasTimer ? (
        <Text
          timerInterval={{ lower: timerLower, upper: timerUpper }}
          countsDown={true}
          modifiers={[font({ size: 20, weight: "bold", design: "monospaced" }), foregroundStyle("#FFFFFF")]}
        />
      ) : null}
      <Text modifiers={[font({ size: 11, weight: "semibold", design: "monospaced" }), foregroundStyle("#8E8E93")]}>
        {setsText}
      </Text>
    </VStack>
  );

  var expandedBottom = isResting ? (
    <ProgressView value={progress} modifiers={[padding({ top: 4 })]} />
  ) : null;

  // ── Dynamic Island: minimal ──
  var minimal = (
    <Text modifiers={[font({ size: 10, weight: "bold" }), foregroundStyle("#FF4757")]}>
      {setsText}
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
