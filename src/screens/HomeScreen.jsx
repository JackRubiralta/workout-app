<<<<<<< HEAD
import React, { useCallback } from 'react';
=======
import React, { useCallback, useState, useEffect, useRef } from 'react';
>>>>>>> 1f5a396 (s)
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
<<<<<<< HEAD
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { DAYS, SETS_PER_EXERCISE } from '../constants/workout';
import { colors, spacing, radius, shadow, fontSize } from '../constants/theme';

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({ day, dayProgress, isDone, onPress }) {
  const totalSets = day.exercises.length * SETS_PER_EXERCISE;
  const doneSets = dayProgress
    ? dayProgress.sets.reduce((acc, exSets) => acc + exSets.filter(Boolean).length, 0)
    : 0;
  const progressFraction = totalSets > 0 ? doneSets / totalSets : 0;

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      style={[styles.card, isDone && styles.cardDone]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Left color accent */}
      <View style={[styles.colorBar, { backgroundColor: isDone ? colors.success : day.color }]} />

      {/* Day number bubble */}
      <View style={[styles.dayBubble, { backgroundColor: (isDone ? colors.success : day.color) + '1A' }]}>
        <Text style={[styles.dayNumber, { color: isDone ? colors.success : day.color }]}>
          {day.day}
        </Text>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View>
            <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]}>
              {day.title}
            </Text>
            {day.focus ? (
              <Text style={styles.cardFocus}>{day.focus}</Text>
=======
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, spacing, radius, shadow, fontSize } from '../constants/theme';
import { exerciseTotalSets } from '../utils/exercise';

// ─── Primitives ───────────────────────────────────────────────────────────────

function FieldLabel({ children, style }) {
  return <Text style={[sheet.fieldLabel, style]}>{children}</Text>;
}

function SheetInput({ style, value, onChangeText, placeholder, keyboardType, autoCapitalize, selectionColor }) {
  return (
    <TextInput
      style={[sheet.input, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      returnKeyType="done"
      selectionColor={selectionColor ?? colors.success}
    />
  );
}

function Toggle({ value, onChange, accent = colors.success }) {
  return (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onChange(!value);
      }}
      activeOpacity={0.85}
      hitSlop={8}
    >
      <View style={[styles.toggle, { backgroundColor: value ? accent : colors.border }]}>
        <View style={[styles.toggleThumb, { transform: [{ translateX: value ? 18 : 2 }] }]} />
      </View>
    </TouchableOpacity>
  );
}

function Stepper({ value, min = 1, max = 6, onChange, accent }) {
  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={[styles.stepBtn, value <= min && styles.stepBtnOff]}
        onPress={() => { if (value > min) onChange(value - 1); }}
        hitSlop={8}
      >
        <Text style={[styles.stepBtnText, value <= min && styles.stepBtnTextOff]}>−</Text>
      </TouchableOpacity>
      <Text style={[styles.stepValue, { color: accent ?? colors.text }]}>{value}</Text>
      <TouchableOpacity
        style={[styles.stepBtn, value >= max && styles.stepBtnOff]}
        onPress={() => { if (value < max) onChange(value + 1); }}
        hitSlop={8}
      >
        <Text style={[styles.stepBtnText, value >= max && styles.stepBtnTextOff]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Exercise Edit Panel ──────────────────────────────────────────────────────
// Rendered inside the single Modal when editingExIndex !== null.

function ExerciseEditPanel({ exercise, exIndex, dayColor, onSave, onBack }) {
  const [name, setName] = useState('');
  const [sets, setSets] = useState(3);
  const [warmup, setWarmup] = useState(false);
  const [restSecs, setRestSecs] = useState('90');
  const [reps, setReps] = useState('');
  const [warmupReps, setWarmupReps] = useState('');

  // Sync local state when exercise changes
  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setSets(exercise.sets);
      setWarmup(exercise.warmup);
      setRestSecs(String(exercise.restSeconds));
      setReps(exercise.reps);
      setWarmupReps(exercise.warmupReps);
    }
  }, [exercise]);

  const handleSave = useCallback(() => {
    const rest = parseInt(restSecs, 10);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSave(exIndex, {
      name: name.trim() || exercise.name,
      sets,
      warmup,
      restSeconds: !isNaN(rest) && rest >= 10 ? Math.min(rest, 600) : exercise.restSeconds,
      reps: reps.trim() || exercise.reps,
      warmupReps: warmupReps.trim() || exercise.warmupReps,
    });
  }, [exIndex, name, sets, warmup, restSecs, reps, warmupReps, exercise, onSave]);

  if (!exercise) return null;

  return (
    <>
      {/* Header with back button */}
      <View style={sheet.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <Text style={[styles.backBtnText, { color: dayColor }]}>‹</Text>
        </TouchableOpacity>
        <Text style={sheet.headerTitle}>Exercise {exIndex + 1}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={sheet.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        <FieldLabel>NAME</FieldLabel>
        <SheetInput
          value={name}
          onChangeText={setName}
          placeholder="Exercise name"
          selectionColor={dayColor}
        />

        {/* Working sets */}
        <FieldLabel style={{ marginTop: spacing.md }}>WORKING SETS</FieldLabel>
        <Stepper value={sets} min={1} max={6} onChange={setSets} accent={dayColor} />

        {/* Reps */}
        <FieldLabel style={{ marginTop: spacing.md }}>REPS / GUIDE</FieldLabel>
        <SheetInput
          value={reps}
          onChangeText={setReps}
          placeholder="e.g. 6–10 reps"
          selectionColor={dayColor}
        />

        {/* Rest */}
        <FieldLabel style={{ marginTop: spacing.md }}>REST BETWEEN SETS</FieldLabel>
        <View style={styles.inlineRow}>
          <SheetInput
            style={{ flex: 1 }}
            value={restSecs}
            onChangeText={setRestSecs}
            keyboardType="number-pad"
            selectionColor={dayColor}
          />
          <Text style={styles.unitLabel}>sec</Text>
        </View>
        <Text style={styles.hint}>10 – 600 seconds</Text>

        {/* Warm-up toggle */}
        <FieldLabel style={{ marginTop: spacing.md }}>WARM-UP SET</FieldLabel>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleDesc}>Add a warm-up set before working sets</Text>
          <Toggle value={warmup} onChange={setWarmup} accent={dayColor} />
        </View>

        {/* Warm-up reps — only when toggled on */}
        {warmup && (
          <>
            <FieldLabel style={{ marginTop: spacing.md }}>WARM-UP REPS / GUIDE</FieldLabel>
            <SheetInput
              value={warmupReps}
              onChangeText={setWarmupReps}
              placeholder="e.g. Light weight, 12–15 reps"
              selectionColor={dayColor}
            />
          </>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Save */}
      <View style={sheet.footer}>
        <TouchableOpacity
          style={[sheet.saveBtn, { backgroundColor: dayColor }]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={sheet.saveBtnText}>Save Exercise</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ─── Day Edit Panel ───────────────────────────────────────────────────────────
// Rendered inside the single Modal when editingExIndex === null.

function DayEditPanel({ day, title, setTitle, focus, setFocus, exercises, onExerciseTap, onSave, onClose, onDelete, daysCount }) {
  const handleDeletePress = useCallback(() => {
    Alert.alert(
      `Delete Day ${day.day}?`,
      `"${day.title}${day.focus ? ' · ' + day.focus : ''}" and all its progress will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );
  }, [day, onDelete]);

  return (
    <>
      {/* Header */}
      <View style={sheet.header}>
        <View style={[sheet.dayDot, { backgroundColor: day.color + '20', borderColor: day.color + '40' }]}>
          <Text style={[sheet.dayDotText, { color: day.color }]}>{day.day}</Text>
        </View>
        <Text style={sheet.headerTitle}>Edit Day {day.day}</Text>
        <TouchableOpacity onPress={onClose} style={sheet.closeBtn} hitSlop={12}>
          <Text style={sheet.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={sheet.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Day title */}
        <FieldLabel>DAY TITLE</FieldLabel>
        <SheetInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. PUSH"
          autoCapitalize="characters"
          selectionColor={day.color}
        />

        {/* Focus */}
        <FieldLabel style={{ marginTop: spacing.md }}>FOCUS</FieldLabel>
        <SheetInput
          value={focus}
          onChangeText={setFocus}
          placeholder="e.g. Chest Focus"
          selectionColor={day.color}
        />

        {/* Exercise list */}
        <FieldLabel style={{ marginTop: spacing.md }}>EXERCISES</FieldLabel>
        <View style={styles.exListContainer}>
          {exercises.map((ex, i) => {
            const warmupLabel = ex.warmup ? '1 warm-up + ' : '';
            return (
              <TouchableOpacity
                key={i}
                style={styles.exRow}
                onPress={() => onExerciseTap(i)}
                activeOpacity={0.7}
              >
                <View style={[styles.exBadge, { backgroundColor: day.color + '18' }]}>
                  <Text style={[styles.exBadgeText, { color: day.color }]}>{i + 1}</Text>
                </View>
                <View style={styles.exInfo}>
                  <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                  <Text style={styles.exMeta}>
                    {warmupLabel}{ex.sets} sets · {ex.reps} · {ex.restSeconds}s rest
                  </Text>
                </View>
                <Text style={[styles.exChevron, { color: day.color }]}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Save day + optional delete */}
      <View style={sheet.footer}>
        <TouchableOpacity
          style={[sheet.saveBtn, { backgroundColor: day.color }]}
          onPress={onSave}
          activeOpacity={0.8}
        >
          <Text style={sheet.saveBtnText}>Save Day</Text>
        </TouchableOpacity>
        {daysCount > 1 && (
          <TouchableOpacity style={sheet.deleteBtn} onPress={handleDeletePress} hitSlop={8}>
            <Text style={sheet.deleteBtnText}>Delete Day</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

// ─── Edit Modal (single Modal, navigates between day and exercise panels) ─────

function EditModal({ day, dayIndex, visible, onClose, onSave, onDelete, daysCount }) {
  const [title, setTitle] = useState('');
  const [focus, setFocus] = useState('');
  const [exercises, setExercises] = useState([]);
  // null = day panel, number = exercise panel
  const [editingExIndex, setEditingExIndex] = useState(null);

  // Reset every time the modal opens (or day changes)
  useEffect(() => {
    if (day && visible) {
      setTitle(day.title);
      setFocus(day.focus ?? '');
      setExercises(day.exercises.map(ex => ({ ...ex })));
      setEditingExIndex(null);
    }
  }, [day, visible]);

  const handleSaveDay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSave(dayIndex, {
      title: title.trim() || day.title,
      focus: focus.trim(),
      exercises,
    });
    onClose();
  }, [dayIndex, title, focus, exercises, day, onSave, onClose]);

  // Called by ExerciseEditPanel — updates local draft and goes back to day panel
  const handleSaveExercise = useCallback((exIndex, updates) => {
    setExercises(prev => prev.map((ex, i) => (i === exIndex ? { ...ex, ...updates } : ex)));
    setEditingExIndex(null);
  }, []);

  // Back / close logic depends on which panel is showing
  const handleRequestClose = useCallback(() => {
    if (editingExIndex !== null) {
      setEditingExIndex(null);
    } else {
      onClose();
    }
  }, [editingExIndex, onClose]);

  if (!day) return null;

  const showingExercise = editingExIndex !== null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleRequestClose}
      statusBarTranslucent
    >
      {/* Tapping the dim overlay dismisses / navigates back */}
      <Pressable style={sheet.overlay} onPress={handleRequestClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={sheet.kav}
        >
          {/* The sheet panel — swallows touches so overlay doesn't fire */}
          <Pressable style={sheet.sheetPanel} onPress={() => {}}>
            <View style={sheet.handle} />

            {showingExercise ? (
              <ExerciseEditPanel
                exercise={exercises[editingExIndex]}
                exIndex={editingExIndex}
                dayColor={day.color}
                onSave={handleSaveExercise}
                onBack={() => setEditingExIndex(null)}
              />
            ) : (
              <DayEditPanel
                day={day}
                title={title}
                setTitle={setTitle}
                focus={focus}
                setFocus={setFocus}
                exercises={exercises}
                onExerciseTap={setEditingExIndex}
                onSave={handleSaveDay}
                onClose={onClose}
                onDelete={() => { onDelete(dayIndex); onClose(); }}
                daysCount={daysCount}
              />
            )}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ─── Drag Handle ─────────────────────────────────────────────────────────────

function DragHandle({ cardIndex, onGrant, onMove, onRelease }) {
  // Ref pattern keeps PanResponder closures always fresh
  const cb = useRef({ onGrant, onMove, onRelease, cardIndex });
  cb.current = { onGrant, onMove, onRelease, cardIndex };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) =>
        cb.current.onGrant(cb.current.cardIndex, e.nativeEvent.pageY),
      onPanResponderMove: (e) => cb.current.onMove(e.nativeEvent.pageY),
      onPanResponderRelease: (e) => cb.current.onRelease(e.nativeEvent.pageY),
      onPanResponderTerminate: () => cb.current.onRelease(null),
    }),
  ).current;

  return (
    <View {...pan.panHandlers} style={styles.dragHandle}>
      <View style={styles.dragLine} />
      <View style={styles.dragLine} />
      <View style={styles.dragLine} />
    </View>
  );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────

function DayCard({ day, dayProgress, isDone, onPress, isEditing,
                   onDragGrant, onDragMove, onDragRelease, cardIndex, isDragOverlay }) {
  const totalSets = day.exercises.reduce((acc, ex) => acc + exerciseTotalSets(ex), 0);
  const doneSets = dayProgress
    ? dayProgress.sets.reduce((acc, exSets, ei) => {
        const exTotal = exerciseTotalSets(day.exercises[ei] ?? { sets: 1, warmup: false });
        return acc + exSets.slice(0, exTotal).filter(Boolean).length;
      }, 0)
    : 0;
  const pct = totalSets > 0 ? doneSets / totalSets : 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isDone && !isEditing && styles.cardDone,
        isEditing && styles.cardEditing,
        isDragOverlay && styles.cardDragOverlay,
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      activeOpacity={isEditing ? 1 : 0.7}
    >
      <View style={[styles.colorBar, { backgroundColor: isDone ? colors.success : day.color }]} />

      <View style={[styles.dayBubble, { backgroundColor: (isDone ? colors.success : day.color) + '1A' }]}>
        <Text style={[styles.dayNumber, { color: isDone ? colors.success : day.color }]}>{day.day}</Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text
              style={[styles.cardTitle, isDone && !isEditing && styles.cardTitleDone]}
              numberOfLines={1}
            >
              {day.title}
            </Text>
            {day.focus ? (
              <Text style={styles.cardFocus} numberOfLines={1}>{day.focus}</Text>
>>>>>>> 1f5a396 (s)
            ) : null}
          </View>

          <View style={styles.cardRight}>
<<<<<<< HEAD
            {isDone ? (
              <View style={styles.checkBadge}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            ) : (
              <Text style={[styles.progressText, doneSets > 0 && { color: day.color }]}>
                {doneSets}/{totalSets}
              </Text>
            )}
          </View>
        </View>

        {/* Progress bar (only when in progress) */}
        {!isDone && doneSets > 0 && (
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressFraction * 100}%`, backgroundColor: day.color },
              ]}
            />
=======
            {isDone && !isEditing ? (
              <View style={styles.checkBadge}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            ) : !isEditing ? (
              <Text style={[styles.progressText, doneSets > 0 && { color: day.color }]}>
                {doneSets}/{totalSets}
              </Text>
            ) : null}
          </View>
        </View>

        {!isDone && !isEditing && doneSets > 0 && (
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${pct * 100}%`, backgroundColor: day.color }]} />
>>>>>>> 1f5a396 (s)
          </View>
        )}
      </View>

<<<<<<< HEAD
      {/* Exercises count label */}
      <Text style={styles.exerciseCount}>
        {day.exercises.length} exercises
      </Text>
=======
      {/* Drag handle — only in edit mode, not on the overlay (overlay is pointer-events none) */}
      {isEditing && !isDragOverlay && (
        <DragHandle
          cardIndex={cardIndex}
          onGrant={onDragGrant}
          onMove={onDragMove}
          onRelease={onDragRelease}
        />
      )}
      {/* Overlay gets a static handle icon so it looks identical */}
      {isDragOverlay && (
        <View style={styles.dragHandle} pointerEvents="none">
          <View style={styles.dragLine} />
          <View style={styles.dragLine} />
          <View style={styles.dragLine} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Add Day Button ───────────────────────────────────────────────────────────

function AddDayButton({ onPress }) {
  return (
    <TouchableOpacity
      style={styles.addDayBtn}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      activeOpacity={0.7}
    >
      <Text style={styles.addDayPlus}>+</Text>
      <Text style={styles.addDayText}>Add Day</Text>
>>>>>>> 1f5a396 (s)
    </TouchableOpacity>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

<<<<<<< HEAD
export function HomeScreen({ progress, doneDays, allDone, resetAll, onSelectDay }) {
  const handleReset = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    resetAll();
=======
export function HomeScreen({ progress, doneDays, allDone, resetAll, onSelectDay, days, updateDay, addDay, deleteDay, moveDay }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingDayIndex, setEditingDayIndex] = useState(null);

  // ── Drag state ───────────────────────────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const activeIndexRef = useRef(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const listAreaRef = useRef(null);
  const listAreaPageY = useRef(0);
  const itemLayouts = useRef([]); // { y, height } relative to listArea
  // One Animated.Value per day for real-time shift animation
  const itemTranslates = useRef(days.map(() => new Animated.Value(0)));

  // Keep the translate array in sync when days are added
  useEffect(() => {
    while (itemTranslates.current.length < days.length) {
      itemTranslates.current.push(new Animated.Value(0));
    }
    // Reset all when days reference changes (after any reorder/add/delete)
    if (activeIndexRef.current === null) {
      itemTranslates.current.forEach(av => av.setValue(0));
    }
  }, [days]);

  // Animate other cards to show the drop target in real-time
  const applyShifts = useCallback((ai, di) => {
    const h = (itemLayouts.current[ai]?.height ?? 80) + spacing.sm;
    itemTranslates.current.forEach((av, i) => {
      if (i === ai) return;
      let target = 0;
      if (ai < di && i > ai && i <= di) target = -h;
      else if (ai > di && i < ai && i >= di) target = h;
      Animated.spring(av, {
        toValue: target,
        useNativeDriver: true,
        speed: 28,
        bounciness: 0,
      }).start();
    });
  }, []);

  const resetShifts = useCallback(() => {
    itemTranslates.current.forEach(av => {
      Animated.spring(av, { toValue: 0, useNativeDriver: true, speed: 28, bounciness: 0 }).start();
    });
  }, []);

  const findDropIndex = useCallback((pageY) => {
    const localY = pageY - listAreaPageY.current;
    const layouts = itemLayouts.current;
    for (let i = 0; i < layouts.length; i++) {
      const l = layouts[i];
      if (l && localY < l.y + l.height * 0.5) return i;
    }
    return Math.max(0, days.length - 1);
  }, [days.length]);

  const handleDragGrant = useCallback((index, pageY) => {
    listAreaRef.current?.measureInWindow((x, y) => { listAreaPageY.current = y; });
    activeIndexRef.current = index;
    const itemY = itemLayouts.current[index]?.y ?? 0;
    dragY.setValue(itemY);
    setActiveIndex(index);
    setDropIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  }, [dragY]);

  const handleDragMove = useCallback((pageY) => {
    const ai = activeIndexRef.current;
    if (ai === null) return;
    const itemH = itemLayouts.current[ai]?.height ?? 80;
    const localY = pageY - listAreaPageY.current;
    dragY.setValue(localY - itemH / 2);
    const di = findDropIndex(pageY);
    setDropIndex(prev => {
      if (prev !== di) applyShifts(ai, di);
      return di;
    });
  }, [dragY, findDropIndex, applyShifts]);

  const handleDragRelease = useCallback((pageY) => {
    const ai = activeIndexRef.current;
    activeIndexRef.current = null;
    resetShifts();
    setActiveIndex(null);
    setDropIndex(null);
    if (ai !== null && pageY !== null) {
      const di = findDropIndex(pageY);
      if (di !== ai) {
        moveDay(ai, di);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      }
    }
  }, [resetShifts, findDropIndex, moveDay]);

  // ── Regular handlers ─────────────────────────────────────────────────────
  const handleCardPress = useCallback((index) => {
    if (isEditing) setEditingDayIndex(index);
    else onSelectDay(index);
  }, [isEditing, onSelectDay]);

  const handleEditToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsEditing(prev => !prev);
  }, []);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Progress',
      'Clear all completed sets and start the week fresh?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            resetAll();
          },
        },
      ],
    );
>>>>>>> 1f5a396 (s)
  }, [resetAll]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
<<<<<<< HEAD
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workout</Text>
        <Text style={styles.headerSubtitle}>Push / Pull / Legs</Text>
      </View>

      {/* Day cards */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {DAYS.map((day, index) => (
          <DayCard
            key={day.day}
            day={day}
            dayProgress={progress?.[index]}
            isDone={doneDays[index]}
            onPress={() => onSelectDay(index)}
          />
        ))}

        {/* Reset button — only when all days complete */}
        {allDone && (
          <View style={styles.resetContainer}>
            <View style={styles.allDoneBanner}>
              <Text style={styles.allDoneEmoji}>🎉</Text>
              <Text style={styles.allDoneText}>Week complete!</Text>
              <Text style={styles.allDoneSubtext}>Great work. Start the next cycle whenever you're ready.</Text>
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.7}>
              <Text style={styles.resetButtonText}>Reset Week</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
=======

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Workout</Text>
          <Text style={styles.headerSubtitle}>Push / Pull / Legs</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleReset} hitSlop={10} activeOpacity={0.6}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editToggle, isEditing && styles.editToggleActive]}
            onPress={handleEditToggle}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Text style={[styles.editToggleText, isEditing && styles.editToggleTextActive]}>
              {isEditing ? 'Done' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List area — drag overlay is absolutely positioned here */}
      <View style={styles.listArea} ref={listAreaRef}>
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isEditing}
        >
          {days.map((day, index) => {
            const isDragging = index === activeIndex;
            const translate = itemTranslates.current[index] ?? new Animated.Value(0);
            return (
              <Animated.View
                key={`${day.day}-${index}`}
                onLayout={e => {
                  itemLayouts.current[index] = {
                    y: e.nativeEvent.layout.y,
                    height: e.nativeEvent.layout.height,
                  };
                }}
                style={{
                  opacity: isDragging ? 0 : 1,
                  transform: [{ translateY: translate }],
                }}
              >
                <DayCard
                  day={day}
                  dayProgress={progress?.[index]}
                  isDone={doneDays[index]}
                  onPress={() => handleCardPress(index)}
                  isEditing={isEditing}
                  onDragGrant={handleDragGrant}
                  onDragMove={handleDragMove}
                  onDragRelease={handleDragRelease}
                  cardIndex={index}
                />
              </Animated.View>
            );
          })}

          {isEditing && <AddDayButton onPress={addDay} />}

          {allDone && !isEditing && (
            <View style={styles.allDoneBanner}>
              <Text style={styles.allDoneEmoji}>🎉</Text>
              <Text style={styles.allDoneText}>Week complete!</Text>
              <Text style={styles.allDoneSubtext}>
                Great work. Start the next cycle whenever you're ready.
              </Text>
            </View>
          )}

          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        {/* Drag overlay — floats above the list, follows the finger */}
        {activeIndex !== null && (
          <Animated.View
            style={[styles.dragOverlay, { top: dragY }]}
            pointerEvents="none"
          >
            <DayCard
              day={days[activeIndex]}
              dayProgress={progress?.[activeIndex]}
              isDone={doneDays[activeIndex]}
              onPress={() => {}}
              isEditing
              isDragOverlay
            />
          </Animated.View>
        )}
      </View>

      {/* Single edit modal */}
      <EditModal
        day={editingDayIndex !== null ? days[editingDayIndex] : null}
        dayIndex={editingDayIndex}
        visible={editingDayIndex !== null}
        onClose={() => setEditingDayIndex(null)}
        onSave={updateDay}
        onDelete={deleteDay}
        daysCount={days.length}
      />
>>>>>>> 1f5a396 (s)
    </SafeAreaView>
  );
}

<<<<<<< HEAD
// ─── Styles ──────────────────────────────────────────────────────────────────
=======
// ─── Main Styles ──────────────────────────────────────────────────────────────
>>>>>>> 1f5a396 (s)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
<<<<<<< HEAD
=======

  // Header
>>>>>>> 1f5a396 (s)
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
<<<<<<< HEAD
=======
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
>>>>>>> 1f5a396 (s)
  },
  headerTitle: {
    fontSize: fontSize.largeTitle,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.37,
<<<<<<< HEAD
=======
    fontFamily: fonts.serif,
>>>>>>> 1f5a396 (s)
  },
  headerSubtitle: {
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
<<<<<<< HEAD
  },
  list: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },

  // Card
=======
    fontFamily: fonts.mono,
  },
  editToggle: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 2,
  },
  editToggleActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.textSecondary + '60',
  },
  editToggleText: {
    fontSize: fontSize.subhead,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
  },
  editToggleTextActive: { color: colors.text },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  resetBtnText: {
    fontSize: fontSize.subhead,
    fontWeight: '500',
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
    paddingHorizontal: spacing.xs,
  },

  listArea: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.sm,
  },
  dragOverlay: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },

  // Day card
>>>>>>> 1f5a396 (s)
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
<<<<<<< HEAD
    minHeight: 88,
    ...shadow.sm,
  },
  cardDone: {
    opacity: 0.6,
  },
  colorBar: {
    width: 4,
    height: 44,
=======
    minHeight: 80,
    ...shadow.sm,
  },
  cardDone: { opacity: 0.6 },
  cardEditing: {
    borderColor: colors.textTertiary + '70',
    borderStyle: 'dashed',
  },
  colorBar: {
    width: 4,
    height: 40,
>>>>>>> 1f5a396 (s)
    borderRadius: radius.full,
  },
  dayBubble: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: fontSize.headline,
    fontWeight: '700',
<<<<<<< HEAD
  },
  cardContent: {
    flex: 1,
    gap: spacing.xs,
  },
=======
    fontFamily: fonts.mono,
  },
  cardContent: { flex: 1, gap: spacing.xs },
>>>>>>> 1f5a396 (s)
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: fontSize.title3,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.5,
<<<<<<< HEAD
  },
  cardTitleDone: {
    color: colors.textSecondary,
  },
=======
    fontFamily: fonts.mono,
  },
  cardTitleDone: { color: colors.textSecondary },
>>>>>>> 1f5a396 (s)
  cardFocus: {
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    marginTop: 1,
<<<<<<< HEAD
  },
  cardRight: {
    alignItems: 'flex-end',
=======
    fontFamily: fonts.mono,
  },
  cardRight: { alignItems: 'flex-end', justifyContent: 'center' },

  // Drag handle (≡ three lines)
  dragHandle: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginRight: -spacing.xs,
  },
  dragLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textTertiary,
  },
  cardDragOverlay: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ scale: 1.03 }],
>>>>>>> 1f5a396 (s)
  },
  progressText: {
    fontSize: fontSize.footnote,
    fontWeight: '600',
    color: colors.textTertiary,
<<<<<<< HEAD
=======
    fontFamily: fonts.mono,
>>>>>>> 1f5a396 (s)
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.success,
  },
<<<<<<< HEAD
  checkMark: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '700',
  },
=======
  checkMark: { fontSize: 12, color: colors.success, fontWeight: '700' },
>>>>>>> 1f5a396 (s)
  progressBarTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
<<<<<<< HEAD
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  exerciseCount: {
    fontSize: fontSize.caption,
    color: colors.textTertiary,
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.md,
  },

  // Reset section
  resetContainer: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  allDoneBanner: {
=======
  progressBarFill: { height: '100%', borderRadius: radius.full },

  // Add day button
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.textTertiary + '60',
    borderStyle: 'dashed',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  addDayPlus: {
    fontSize: fontSize.title3,
    color: colors.textSecondary,
    fontWeight: '300',
    lineHeight: fontSize.title3 + 2,
  },
  addDayText: {
    fontSize: fontSize.subhead,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    letterSpacing: 0.5,
  },

  // Week complete
  allDoneBanner: {
    marginTop: spacing.xl,
>>>>>>> 1f5a396 (s)
    backgroundColor: colors.successBg,
    borderRadius: radius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.success + '40',
    gap: spacing.xs,
  },
<<<<<<< HEAD
  allDoneEmoji: {
    fontSize: 40,
  },
=======
  allDoneEmoji: { fontSize: 40 },
>>>>>>> 1f5a396 (s)
  allDoneText: {
    fontSize: fontSize.title3,
    fontWeight: '700',
    color: colors.success,
<<<<<<< HEAD
=======
    fontFamily: fonts.serif,
>>>>>>> 1f5a396 (s)
  },
  allDoneSubtext: {
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
<<<<<<< HEAD
=======
    fontFamily: fonts.mono,
>>>>>>> 1f5a396 (s)
  },
  resetButton: {
    height: 56,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textSecondary,
<<<<<<< HEAD
=======
    fontFamily: fonts.mono,
  },

  // Exercise rows inside DayEditPanel
  exListContainer: { gap: spacing.xs, marginTop: spacing.xs },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  exBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  exBadgeText: { fontSize: fontSize.footnote, fontWeight: '700', fontFamily: fonts.mono },
  exInfo: { flex: 1, gap: 2 },
  exName: { fontSize: fontSize.subhead, fontWeight: '600', color: colors.text, fontFamily: fonts.mono },
  exMeta: { fontSize: fontSize.caption, color: colors.textSecondary, fontFamily: fonts.mono, letterSpacing: 0.2 },
  exChevron: { fontSize: 20, fontWeight: '300' },

  // ExerciseEditPanel controls
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 20, fontWeight: '400', lineHeight: 24, marginTop: -1 },

  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    padding: 2,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  toggleDesc: {
    flex: 1,
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
  },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  stepBtn: { width: 48, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepBtnOff: { opacity: 0.3 },
  stepBtnText: { fontSize: 20, color: colors.text, fontWeight: '300', lineHeight: 24 },
  stepBtnTextOff: { color: colors.textTertiary },
  stepValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: fontSize.title3,
    fontWeight: '700',
    fontFamily: fonts.mono,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    height: 44,
    lineHeight: 44,
  },

  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unitLabel: {
    fontSize: fontSize.subhead,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    width: 28,
  },
  hint: {
    fontSize: fontSize.caption,
    color: colors.textTertiary,
    fontFamily: fonts.mono,
    marginTop: spacing.xs,
    letterSpacing: 0.3,
  },
});

// ─── Sheet Styles (shared by the modal) ───────────────────────────────────────

const sheet = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  kav: { justifyContent: 'flex-end' },
  sheetPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '94%',
    minHeight: '72%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dayDot: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayDotText: { fontSize: fontSize.footnote, fontWeight: '700', fontFamily: fonts.mono },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.headline,
    fontWeight: '700',
    color: colors.text,
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  scrollContent: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  fieldLabel: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    fontFamily: fonts.mono,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.mono,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveBtn: {
    height: 52,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: fontSize.headline,
    fontWeight: '700',
    color: '#fff',
    fontFamily: fonts.mono,
    letterSpacing: 0.5,
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  deleteBtnText: {
    fontSize: fontSize.subhead,
    fontWeight: '600',
    color: '#FF453A',
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
>>>>>>> 1f5a396 (s)
  },
});
