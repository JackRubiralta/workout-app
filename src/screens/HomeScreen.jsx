import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, spacing, radius, shadow, fontSize } from '../constants/theme';
import { exerciseTotalSets } from '../utils/exercise';

// ─── Primitives ─────────────────────────────────────────────────────────────

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

// ─── Exercise Edit Panel ────────────────────────────────────────────────────

function ExerciseEditPanel({ exercise, exIndex, dayColor, onSave, onBack }) {
  const [name, setName] = useState('');
  const [sets, setSets] = useState(3);
  const [warmup, setWarmup] = useState(false);
  const [restSecs, setRestSecs] = useState('90');
  const [nextRestSecs, setNextRestSecs] = useState('');
  const [reps, setReps] = useState('');
  const [warmupReps, setWarmupReps] = useState('');
  const [tracksWeight, setTracksWeight] = useState(true);
  const [tracksReps, setTracksReps] = useState(true);
  const [kbVisible, setKbVisible] = useState(false);

  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardWillShow', () => setKbVisible(true));
    const s2 = Keyboard.addListener('keyboardWillHide', () => setKbVisible(false));
    return () => { s1.remove(); s2.remove(); };
  }, []);

  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setSets(exercise.sets);
      setWarmup(exercise.warmup);
      setRestSecs(String(exercise.restSeconds));
      setNextRestSecs(exercise.nextRestSeconds == null ? '' : String(exercise.nextRestSeconds));
      setReps(exercise.reps);
      setWarmupReps(exercise.warmupReps);
      setTracksWeight(exercise.tracksWeight !== false);
      setTracksReps(exercise.tracksReps !== false);
    }
  }, [exercise]);

  const handleSave = useCallback(() => {
    const rest = parseInt(restSecs, 10);
    const nextRestTrimmed = nextRestSecs.trim();
    let nextRest = null;
    if (nextRestTrimmed !== '') {
      const parsed = parseInt(nextRestTrimmed, 10);
      if (!isNaN(parsed) && parsed >= 0) nextRest = Math.min(parsed, 600);
      else nextRest = exercise.nextRestSeconds ?? null;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSave(exIndex, {
      name: name.trim() || exercise.name,
      sets,
      warmup,
      restSeconds: !isNaN(rest) && rest >= 10 ? Math.min(rest, 600) : exercise.restSeconds,
      nextRestSeconds: nextRest,
      reps: reps.trim() || exercise.reps,
      warmupReps: warmupReps.trim() || exercise.warmupReps,
      tracksWeight,
      tracksReps,
    });
  }, [exIndex, name, sets, warmup, restSecs, nextRestSecs, reps, warmupReps, tracksWeight, tracksReps, exercise, onSave]);

  if (!exercise) return null;

  return (
    <>
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
        <FieldLabel>NAME</FieldLabel>
        <SheetInput value={name} onChangeText={setName} placeholder="Exercise name" selectionColor={dayColor} />

        <FieldLabel style={{ marginTop: spacing.md }}>WORKING SETS</FieldLabel>
        <Stepper value={sets} min={1} max={6} onChange={setSets} accent={dayColor} />

        <FieldLabel style={{ marginTop: spacing.md }}>REPS / GUIDE</FieldLabel>
        <SheetInput value={reps} onChangeText={setReps} placeholder="e.g. 6–10 reps" selectionColor={dayColor} />

        <FieldLabel style={{ marginTop: spacing.md }}>REST BETWEEN SETS</FieldLabel>
        <View style={styles.inlineRow}>
          <SheetInput style={{ flex: 1 }} value={restSecs} onChangeText={setRestSecs} keyboardType="number-pad" selectionColor={dayColor} />
          <Text style={styles.unitLabel}>sec</Text>
        </View>
        <Text style={styles.hint}>10 – 600 seconds</Text>

        <FieldLabel style={{ marginTop: spacing.md }}>REST BEFORE NEXT EXERCISE</FieldLabel>
        <View style={styles.inlineRow}>
          <SheetInput
            style={{ flex: 1 }}
            value={nextRestSecs}
            onChangeText={setNextRestSecs}
            keyboardType="number-pad"
            placeholder="Use day default"
            selectionColor={dayColor}
          />
          <Text style={styles.unitLabel}>sec</Text>
        </View>
        <Text style={styles.hint}>Leave blank to use the day's default</Text>

        <FieldLabel style={{ marginTop: spacing.md }}>TRACKING</FieldLabel>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleDesc}>Track weight (off for body-weight moves)</Text>
          <Toggle value={tracksWeight} onChange={setTracksWeight} accent={dayColor} />
        </View>
        <View style={{ height: spacing.xs }} />
        <View style={styles.toggleRow}>
          <Text style={styles.toggleDesc}>Track reps (off for timed holds / warm-ups)</Text>
          <Toggle value={tracksReps} onChange={setTracksReps} accent={dayColor} />
        </View>

        <FieldLabel style={{ marginTop: spacing.md }}>WARM-UP SET</FieldLabel>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleDesc}>Add a warm-up set before working sets</Text>
          <Toggle value={warmup} onChange={setWarmup} accent={dayColor} />
        </View>

        {warmup && (
          <>
            <FieldLabel style={{ marginTop: spacing.md }}>WARM-UP REPS / GUIDE</FieldLabel>
            <SheetInput value={warmupReps} onChangeText={setWarmupReps} placeholder="e.g. Light weight, 12–15 reps" selectionColor={dayColor} />
          </>
        )}

        <View style={{ height: 16 }} />
      </ScrollView>

      {!kbVisible && (
        <View style={sheet.footer}>
          <TouchableOpacity style={[sheet.saveBtn, { backgroundColor: dayColor }]} onPress={handleSave} activeOpacity={0.8}>
            <Text style={sheet.saveBtnText}>Save Exercise</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}

// ─── Day Edit Panel ─────────────────────────────────────────────────────────

function DayEditPanel({ day, title, setTitle, focus, setFocus, exerciseRestSecs, setExerciseRestSecs, exercises, onExerciseTap, onSave, onClose, onDelete, daysCount }) {
  const [kbVisible, setKbVisible] = useState(false);

  useEffect(() => {
    const s1 = Keyboard.addListener('keyboardWillShow', () => setKbVisible(true));
    const s2 = Keyboard.addListener('keyboardWillHide', () => setKbVisible(false));
    return () => { s1.remove(); s2.remove(); };
  }, []);

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
        <FieldLabel>DAY TITLE</FieldLabel>
        <SheetInput value={title} onChangeText={setTitle} placeholder="e.g. PUSH" autoCapitalize="characters" selectionColor={day.color} />

        <FieldLabel style={{ marginTop: spacing.md }}>FOCUS</FieldLabel>
        <SheetInput value={focus} onChangeText={setFocus} placeholder="e.g. Chest Focus" selectionColor={day.color} />

        <FieldLabel style={{ marginTop: spacing.md }}>REST BETWEEN EXERCISES</FieldLabel>
        <View style={styles.inlineRow}>
          <SheetInput
            style={{ flex: 1 }}
            value={exerciseRestSecs}
            onChangeText={setExerciseRestSecs}
            keyboardType="number-pad"
            selectionColor={day.color}
          />
          <Text style={styles.unitLabel}>sec</Text>
        </View>
        <Text style={styles.hint}>Rest after finishing all sets of an exercise (30 – 600 sec)</Text>

        <FieldLabel style={{ marginTop: spacing.md }}>EXERCISES</FieldLabel>
        <View style={styles.exListContainer}>
          {exercises.map((ex, i) => {
            const warmupLabel = ex.warmup ? '1 warm-up + ' : '';
            const tracksWeight = ex.tracksWeight !== false;
            const tracksReps = ex.tracksReps !== false;
            const trackTag = !tracksWeight && !tracksReps
              ? 'timed'
              : !tracksWeight
                ? 'bodyweight'
                : null;
            return (
              <TouchableOpacity key={i} style={styles.exRow} onPress={() => onExerciseTap(i)} activeOpacity={0.7}>
                <View style={[styles.exBadge, { backgroundColor: day.color + '18' }]}>
                  <Text style={[styles.exBadgeText, { color: day.color }]}>{i + 1}</Text>
                </View>
                <View style={styles.exInfo}>
                  <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                  <Text style={styles.exMeta} numberOfLines={1}>
                    {warmupLabel}{ex.sets} sets · {ex.reps} · {ex.restSeconds}s rest{trackTag ? ` · ${trackTag}` : ''}
                  </Text>
                </View>
                <Text style={[styles.exChevron, { color: day.color }]}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      {!kbVisible && (
        <View style={sheet.footer}>
          <TouchableOpacity style={[sheet.saveBtn, { backgroundColor: day.color }]} onPress={onSave} activeOpacity={0.8}>
            <Text style={sheet.saveBtnText}>Save Day</Text>
          </TouchableOpacity>
          {daysCount > 1 && (
            <TouchableOpacity style={sheet.deleteBtn} onPress={handleDeletePress} hitSlop={8}>
              <Text style={sheet.deleteBtnText}>Delete Day</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
}

// ─── Edit Modal ─────────────────────────────────────────────────────────────

function EditModal({ day, dayIndex, visible, onClose, onSave, onDelete, daysCount }) {
  const [title, setTitle] = useState('');
  const [focus, setFocus] = useState('');
  const [exerciseRestSecs, setExerciseRestSecs] = useState('180');
  const [exercises, setExercises] = useState([]);
  const [editingExIndex, setEditingExIndex] = useState(null);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const editingRef = useRef(null);
  editingRef.current = editingExIndex;
  const setEditingRef = useRef(setEditingExIndex);
  setEditingRef.current = setEditingExIndex;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  const sheetPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) sheetTranslateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          Animated.timing(sheetTranslateY, { toValue: 600, duration: 200, useNativeDriver: true }).start(() => {
            if (editingRef.current !== null) {
              setEditingRef.current(null);
            } else {
              closeRef.current();
            }
          });
        } else {
          Animated.spring(sheetTranslateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 5 }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (day && visible) {
      sheetTranslateY.setValue(0);
      setTitle(day.title);
      setFocus(day.focus ?? '');
      setExerciseRestSecs(String(day.exerciseRestSeconds ?? 180));
      setExercises(day.exercises.map(ex => ({ ...ex })));
      setEditingExIndex(null);
    }
  }, [day, visible]);

  const handleSaveDay = useCallback(() => {
    const rest = parseInt(exerciseRestSecs, 10);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSave(dayIndex, {
      title: title.trim() || day.title,
      focus: focus.trim(),
      exerciseRestSeconds: !isNaN(rest) && rest >= 30 ? Math.min(rest, 600) : (day.exerciseRestSeconds ?? 180),
      exercises,
    });
    onClose();
  }, [dayIndex, title, focus, exerciseRestSecs, exercises, day, onSave, onClose]);

  const handleSaveExercise = useCallback((exIndex, updates) => {
    setExercises(prev => prev.map((ex, i) => (i === exIndex ? { ...ex, ...updates } : ex)));
    setEditingExIndex(null);
  }, []);

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleRequestClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="height" style={sheet.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleRequestClose} />
        <Animated.View style={[sheet.sheetPanel, { transform: [{ translateY: sheetTranslateY }] }]}>
            <View {...sheetPan.panHandlers} style={sheet.handleArea}>
              <View style={sheet.handle} />
            </View>

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
                exerciseRestSecs={exerciseRestSecs}
                setExerciseRestSecs={setExerciseRestSecs}
                exercises={exercises}
                onExerciseTap={setEditingExIndex}
                onSave={handleSaveDay}
                onClose={onClose}
                onDelete={() => { onDelete(dayIndex); onClose(); }}
                daysCount={daysCount}
              />
            )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Drag Handle ────────────────────────────────────────────────────────────

function DragHandle({ cardIndex, onGrant, onMove, onRelease }) {
  const cb = useRef({ onGrant, onMove, onRelease, cardIndex });
  cb.current = { onGrant, onMove, onRelease, cardIndex };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => cb.current.onGrant(cb.current.cardIndex, e.nativeEvent.pageY),
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

// ─── Day Card ───────────────────────────────────────────────────────────────

function DayCard({ day, dayProgress, isDone, onPress, onDragGrant, onDragMove, onDragRelease, cardIndex, isDragOverlay }) {
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
      style={[styles.card, styles.cardEditing, isDragOverlay && styles.cardDragOverlay]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      activeOpacity={1}
    >
      <View style={[styles.colorBar, { backgroundColor: isDone ? colors.success : day.color }]} />
      <View style={[styles.cardDayBubble, { backgroundColor: (isDone ? colors.success : day.color) + '1A' }]}>
        <Text style={[styles.cardDayNumber, { color: isDone ? colors.success : day.color }]}>{day.day}</Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={styles.cardTitle} numberOfLines={1}>{day.title}</Text>
            {day.focus ? <Text style={styles.cardFocus} numberOfLines={1}>{day.focus}</Text> : null}
          </View>
          <Text style={styles.cardExCount}>{day.exercises.length} ex</Text>
        </View>

        {!isDone && doneSets > 0 && (
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${pct * 100}%`, backgroundColor: day.color }]} />
          </View>
        )}
      </View>

      {!isDragOverlay && (
        <DragHandle
          cardIndex={cardIndex}
          onGrant={onDragGrant}
          onMove={onDragMove}
          onRelease={onDragRelease}
        />
      )}
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

// ─── Add Day Button ─────────────────────────────────────────────────────────

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
    </TouchableOpacity>
  );
}

// ─── Screen ─────────────────────────────────────────────────────────────────

export function HomeScreen({ progress, doneDays, allDone, resetAll, days, updateDay, addDay, deleteDay, moveDay }) {
  const [editingDayIndex, setEditingDayIndex] = useState(null);

  // ── Drag state ──────────────────────────────────────────────────────────
  const [activeIndex, setActiveIndex] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);
  const activeIndexRef = useRef(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const listAreaRef = useRef(null);
  const listAreaPageY = useRef(0);
  const itemLayouts = useRef([]);
  const itemTranslates = useRef(days.map(() => new Animated.Value(0)));

  useEffect(() => {
    while (itemTranslates.current.length < days.length) {
      itemTranslates.current.push(new Animated.Value(0));
    }
    if (activeIndexRef.current === null) {
      itemTranslates.current.forEach(av => av.setValue(0));
    }
  }, [days]);

  const applyShifts = useCallback((ai, di) => {
    const h = (itemLayouts.current[ai]?.height ?? 80) + spacing.sm;
    itemTranslates.current.forEach((av, i) => {
      if (i === ai) return;
      let target = 0;
      if (ai < di && i > ai && i <= di) target = -h;
      else if (ai > di && i < ai && i >= di) target = h;
      Animated.spring(av, { toValue: target, useNativeDriver: true, speed: 28, bounciness: 0 }).start();
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

  const handleCardPress = useCallback((index) => {
    setEditingDayIndex(index);
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
  }, [resetAll]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Program</Text>
          <Text style={styles.headerSubtitle}>{days.length} day{days.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleReset} hitSlop={10} activeOpacity={0.6}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <View style={styles.listArea} ref={listAreaRef}>
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={activeIndex === null}
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
                  onDragGrant={handleDragGrant}
                  onDragMove={handleDragMove}
                  onDragRelease={handleDragRelease}
                  cardIndex={index}
                />
              </Animated.View>
            );
          })}

          <AddDayButton onPress={addDay} />

          <View style={{ height: spacing.xxl }} />
        </ScrollView>

        {/* Drag overlay */}
        {activeIndex !== null && (
          <Animated.View style={[styles.dragOverlay, { top: dragY }]} pointerEvents="none">
            <DayCard
              day={days[activeIndex]}
              dayProgress={progress?.[activeIndex]}
              isDone={doneDays[activeIndex]}
              onPress={() => {}}
              isDragOverlay
            />
          </Animated.View>
        )}
      </View>

      {/* Edit modal */}
      <EditModal
        day={editingDayIndex !== null ? days[editingDayIndex] : null}
        dayIndex={editingDayIndex}
        visible={editingDayIndex !== null}
        onClose={() => setEditingDayIndex(null)}
        onSave={updateDay}
        onDelete={deleteDay}
        daysCount={days.length}
      />
    </SafeAreaView>
  );
}

// ─── Main Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: fontSize.largeTitle,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 0.37,
    fontFamily: fonts.serif,
  },
  headerSubtitle: {
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.5,
    fontFamily: fonts.mono,
  },
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
  listArea: { flex: 1 },
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

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    ...shadow.sm,
  },
  cardEditing: {
    borderColor: colors.textTertiary + '70',
    borderStyle: 'dashed',
  },
  colorBar: {
    width: 4,
    height: 40,
    borderRadius: radius.full,
  },
  cardDayBubble: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDayNumber: {
    fontSize: fontSize.headline,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  cardContent: { flex: 1, gap: spacing.xs },
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
    fontFamily: fonts.mono,
  },
  cardFocus: {
    fontSize: fontSize.subhead,
    color: colors.textSecondary,
    marginTop: 1,
    fontFamily: fonts.mono,
  },
  cardExCount: {
    fontSize: fontSize.footnote,
    fontWeight: '600',
    color: colors.textTertiary,
    fontFamily: fonts.mono,
  },
  cardDragOverlay: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
    transform: [{ scale: 1.03 }],
  },
  progressBarTrack: {
    height: 3,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: radius.full },

  // Drag handle
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

  // Add day
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

  // Controls
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

// ─── Sheet Styles ───────────────────────────────────────────────────────────

const sheet = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handleArea: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
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
  },
});
