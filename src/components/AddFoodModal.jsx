import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Animated,
  PanResponder,
  Image,
  Alert,
  Keyboard,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, spacing, radius, fontSize, shadow } from '../constants/theme';
import { analyzeFoodPhotos, analyzeFoodText } from '../services/nutrition';

const MAX_PHOTOS = 3;

// ─── Pulsing dot loader ────────────────────────────────────────────────────

function PulseDots() {
  const a1 = useRef(new Animated.Value(0.3)).current;
  const a2 = useRef(new Animated.Value(0.3)).current;
  const a3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const seq = (av, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(av, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
          Animated.timing(av, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ]),
      );
    const l1 = seq(a1, 0);
    const l2 = seq(a2, 150);
    const l3 = seq(a3, 300);
    l1.start(); l2.start(); l3.start();
    return () => { l1.stop(); l2.stop(); l3.stop(); };
  }, [a1, a2, a3]);

  return (
    <View style={dot.row}>
      <Animated.View style={[dot.dot, { opacity: a1 }]} />
      <Animated.View style={[dot.dot, { opacity: a2 }]} />
      <Animated.View style={[dot.dot, { opacity: a3 }]} />
    </View>
  );
}

const dot = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text },
});

// ─── Tabs ──────────────────────────────────────────────────────────────────

function TabSwitcher({ tab, onChange }) {
  return (
    <View style={ts.outer}>
      <TouchableOpacity style={[ts.tab, tab === 'scan' && ts.tabActive]} onPress={() => onChange('scan')} activeOpacity={0.8}>
        <Text style={[ts.label, tab === 'scan' && ts.labelActive]}>Scan Food</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[ts.tab, tab === 'search' && ts.tabActive]} onPress={() => onChange('search')} activeOpacity={0.8}>
        <Text style={[ts.label, tab === 'search' && ts.labelActive]}>Describe</Text>
      </TouchableOpacity>
    </View>
  );
}

const ts = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: 3,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.md },
  tabActive: { backgroundColor: colors.surfaceHighlight },
  label: { fontSize: fontSize.subhead, fontWeight: '600', color: colors.textSecondary, fontFamily: fonts.mono, letterSpacing: 0.3 },
  labelActive: { color: colors.text },
});

// ─── Loading state ─────────────────────────────────────────────────────────

function LoadingState({ status }) {
  return (
    <View style={loadStyles.wrap}>
      <PulseDots />
      <Text style={loadStyles.title}>Analyzing</Text>
      <Text style={loadStyles.status}>{status || 'Working…'}</Text>
      <Text style={loadStyles.hint}>This usually takes 5–15 seconds.</Text>
    </View>
  );
}

const loadStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.sm, paddingHorizontal: spacing.lg },
  title: { marginTop: spacing.md, fontSize: fontSize.title3, fontWeight: '700', color: colors.text, fontFamily: fonts.serif },
  status: { fontSize: fontSize.subhead, color: colors.textSecondary, fontFamily: fonts.mono, textAlign: 'center' },
  hint: { marginTop: spacing.sm, fontSize: fontSize.caption, color: colors.textTertiary, fontFamily: fonts.mono, textAlign: 'center' },
});

// ─── Shared results view ──────────────────────────────────────────────────

function Macro({ v, u, c }) {
  return (
    <View style={r.macroCell}>
      <Text style={[r.macroVal, { color: c }]}>{v}</Text>
      <Text style={r.macroUnit}>{u}</Text>
    </View>
  );
}

function TotalCell({ label, value, color }) {
  return (
    <View style={r.totalCell}>
      <Text style={[r.totalVal, { color }]}>{value}</Text>
      <Text style={r.totalLabel}>{label}</Text>
    </View>
  );
}

function ResultsView({ results, setResults, onLog, onStartOver }) {
  const [editingId, setEditingId] = useState(null);
  const [editingQty, setEditingQty] = useState('');

  const recomputeTotals = useCallback((items) => {
    const totals = items.reduce(
      (acc, it) => ({
        calories: acc.calories + (Number(it.calories) || 0),
        protein: acc.protein + (Number(it.protein) || 0),
        carbs: acc.carbs + (Number(it.carbs) || 0),
        fat: acc.fat + (Number(it.fat) || 0),
        fiber: acc.fiber + (Number(it.fiber) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );
    return {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10,
    };
  }, []);

  const beginEdit = useCallback((item) => {
    setEditingId(item._localId);
    setEditingQty(String(item.quantity));
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingId) return;
    const newQty = parseFloat(editingQty);
    if (isNaN(newQty) || newQty <= 0) {
      setEditingId(null);
      return;
    }
    setResults(prev => {
      if (!prev) return prev;
      const items = prev.items.map(it => {
        if (it._localId !== editingId) return it;
        const ratio = newQty / (it.quantity || 1);
        return {
          ...it,
          quantity: newQty,
          calories: Math.round((it.calories || 0) * ratio),
          protein: Math.round((it.protein || 0) * ratio * 10) / 10,
          carbs: Math.round((it.carbs || 0) * ratio * 10) / 10,
          fat: Math.round((it.fat || 0) * ratio * 10) / 10,
          fiber: Math.round((it.fiber || 0) * ratio * 10) / 10,
        };
      });
      return { ...prev, items, totals: recomputeTotals(items) };
    });
    setEditingId(null);
  }, [editingId, editingQty, recomputeTotals, setResults]);

  const removeItem = useCallback((id) => {
    setResults(prev => {
      if (!prev) return prev;
      const items = prev.items.filter(it => it._localId !== id);
      return { ...prev, items, totals: recomputeTotals(items) };
    });
  }, [recomputeTotals, setResults]);

  const handleLog = useCallback(() => {
    if (!results || !results.items.length) return;
    onLog(results.items.map(({ _localId, ...rest }) => rest));
  }, [results, onLog]);

  const conf = results.confidence;
  const confColor = conf === 'high' ? colors.success : conf === 'low' ? '#FF453A' : '#FFA502';

  return (
    <ScrollView contentContainerStyle={r.scrollPad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={[r.confidencePill, { borderColor: confColor + '50', backgroundColor: confColor + '15' }]}>
        <View style={[r.confDot, { backgroundColor: confColor }]} />
        <Text style={[r.confText, { color: confColor }]}>{conf.toUpperCase()} CONFIDENCE</Text>
      </View>

      {!!results.notes && (
        <View style={r.noteBox}>
          <Text style={r.noteText}>{results.notes}</Text>
        </View>
      )}

      {results.items.length === 0 && (
        <Text style={r.emptyText}>No items left. Start over to try again.</Text>
      )}

      {results.items.map((it) => {
        const isEditing = editingId === it._localId;
        return (
          <View key={it._localId} style={r.itemCard}>
            <View style={r.itemTop}>
              <Text style={r.itemName} numberOfLines={2}>{it.name}</Text>
              <TouchableOpacity onPress={() => removeItem(it._localId)} hitSlop={8}>
                <Text style={r.itemRemove}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={r.itemRow}>
              {isEditing ? (
                <View style={r.qtyEdit}>
                  <TextInput
                    style={r.qtyInput}
                    value={editingQty}
                    onChangeText={setEditingQty}
                    keyboardType="decimal-pad"
                    autoFocus
                    onBlur={commitEdit}
                    onSubmitEditing={commitEdit}
                    returnKeyType="done"
                    selectionColor={colors.success}
                  />
                  <Text style={r.itemUnit}>{it.unit}</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={() => beginEdit(it)} style={r.qtyDisplay} activeOpacity={0.7}>
                  <Text style={r.itemQty}>{it.quantity}</Text>
                  <Text style={r.itemUnit}>{it.unit}</Text>
                  <Text style={r.itemEditHint}>edit</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={r.macroRow}>
              <Macro v={it.calories} u="kcal" c="#FF4757" />
              <Macro v={it.protein} u="P" c="#3742FA" />
              <Macro v={it.carbs} u="C" c="#FFA502" />
              <Macro v={it.fat} u="F" c="#A55EEA" />
            </View>
          </View>
        );
      })}

      <View style={r.totalsCard}>
        <Text style={r.totalsLabel}>TOTAL</Text>
        <View style={r.totalsGrid}>
          <TotalCell label="Calories" value={results.totals.calories} color="#FF4757" />
          <TotalCell label="Protein" value={`${results.totals.protein}g`} color="#3742FA" />
          <TotalCell label="Carbs" value={`${results.totals.carbs}g`} color="#FFA502" />
          <TotalCell label="Fat" value={`${results.totals.fat}g`} color="#A55EEA" />
        </View>
      </View>

      <TouchableOpacity
        style={[r.logBtn, !results.items.length && r.logBtnOff]}
        onPress={handleLog}
        activeOpacity={0.8}
        disabled={!results.items.length}
      >
        <Text style={r.logBtnText}>Log Food</Text>
      </TouchableOpacity>

      <TouchableOpacity style={r.retakeBtn} onPress={onStartOver} activeOpacity={0.7}>
        <Text style={r.retakeText}>Start over</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const r = StyleSheet.create({
  scrollPad: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },

  emptyText: { color: colors.textTertiary, fontFamily: fonts.mono, fontSize: fontSize.footnote, textAlign: 'center', paddingVertical: spacing.md },

  confidencePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2, paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  confDot: { width: 6, height: 6, borderRadius: 3 },
  confText: { fontSize: 10, fontWeight: '800', fontFamily: fonts.mono, letterSpacing: 1 },

  noteBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderLeftWidth: 3,
    borderLeftColor: '#FFA502',
  },
  noteText: { fontSize: fontSize.footnote, color: colors.textSecondary, fontFamily: fonts.mono, lineHeight: 18 },

  itemCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  itemName: { flex: 1, fontSize: fontSize.subhead, fontWeight: '700', color: colors.text, fontFamily: fonts.mono },
  itemRemove: { fontSize: 14, color: colors.textTertiary, fontWeight: '600', paddingHorizontal: 4 },

  itemRow: { flexDirection: 'row', alignItems: 'center' },
  qtyDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  qtyEdit: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyInput: {
    minWidth: 60,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    fontSize: fontSize.subhead,
    color: colors.text,
    fontFamily: fonts.mono,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.success + '60',
  },
  itemQty: { fontSize: fontSize.subhead, color: colors.text, fontFamily: fonts.mono, fontWeight: '700' },
  itemUnit: { fontSize: fontSize.footnote, color: colors.textSecondary, fontFamily: fonts.mono },
  itemEditHint: { marginLeft: 6, fontSize: 10, color: colors.textTertiary, fontFamily: fonts.mono, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },

  macroRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  macroCell: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  macroVal: { fontSize: fontSize.footnote, fontWeight: '700', fontFamily: fonts.mono },
  macroUnit: { fontSize: 10, color: colors.textTertiary, fontFamily: fonts.mono, fontWeight: '600' },

  totalsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  totalsLabel: { fontSize: 10, fontWeight: '700', color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 1.5 },
  totalsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  totalCell: { alignItems: 'center', gap: 2, flex: 1 },
  totalVal: { fontSize: fontSize.title3, fontWeight: '700', fontFamily: fonts.mono },
  totalLabel: { fontSize: 10, color: colors.textTertiary, fontFamily: fonts.mono, letterSpacing: 0.5, textTransform: 'uppercase' },

  logBtn: {
    backgroundColor: colors.success,
    borderRadius: radius.xl,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  logBtnOff: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  logBtnText: { fontSize: fontSize.headline, fontWeight: '700', color: '#fff', fontFamily: fonts.mono, letterSpacing: 0.5 },
  retakeBtn: { paddingVertical: spacing.sm, alignItems: 'center' },
  retakeText: { fontSize: fontSize.footnote, color: colors.textTertiary, fontFamily: fonts.mono, fontWeight: '600' },
});

// ─── Scan Tab ──────────────────────────────────────────────────────────────

function ScanTab({ photos, setPhotos, results, setResults, onLog, busy, setBusy, status, setStatus }) {
  const pickFromLibrary = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to pick meal photos.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.6,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
    });
    if (res.canceled) return;
    const next = res.assets.map(a => ({
      uri: a.uri,
      base64: a.base64,
      mediaType: a.mimeType ?? 'image/jpeg',
    }));
    setPhotos(prev => [...prev, ...next].slice(0, MAX_PHOTOS));
  }, [photos.length, setPhotos]);

  const takePhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take meal photos.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.6,
    });
    if (res.canceled) return;
    const a = res.assets[0];
    setPhotos(prev => [...prev, { uri: a.uri, base64: a.base64, mediaType: a.mimeType ?? 'image/jpeg' }].slice(0, MAX_PHOTOS));
  }, [photos.length, setPhotos]);

  const removePhoto = useCallback((idx) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }, [setPhotos]);

  const analyze = useCallback(async () => {
    if (!photos.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setBusy(true);
    setStatus('Sending photos to Claude…');
    setResults(null);
    try {
      const result = await analyzeFoodPhotos({
        images: photos.map(p => ({ base64: p.base64, mediaType: p.mediaType })),
        onProgress: msg => setStatus(msg),
      });
      const items = result.items.map((it, i) => ({ ...it, _localId: `r_${i}_${Math.random().toString(36).slice(2, 6)}` }));
      setResults({ ...result, items });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      Alert.alert('Analysis failed', err.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setBusy(false);
      setStatus('');
    }
  }, [photos, setBusy, setStatus, setResults]);

  if (busy) return <LoadingState status={status} />;

  if (results) {
    return (
      <ResultsView
        results={results}
        setResults={setResults}
        onLog={onLog}
        onStartOver={() => setResults(null)}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={scan.scrollPad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={scan.tipBox}>
        <Text style={scan.tipText}>
          Tip: 2–3 angles help estimate portion sizes more accurately.
        </Text>
      </View>

      <View style={scan.thumbRow}>
        {photos.map((p, i) => (
          <View key={i} style={scan.thumbWrap}>
            <Image source={{ uri: p.uri }} style={scan.thumb} />
            <TouchableOpacity onPress={() => removePhoto(i)} style={scan.thumbX} hitSlop={6}>
              <Text style={scan.thumbXText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity style={scan.addThumb} onPress={pickFromLibrary} activeOpacity={0.7}>
            <Text style={scan.addThumbPlus}>+</Text>
            <Text style={scan.addThumbLabel}>Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={scan.actionsRow}>
        <TouchableOpacity style={scan.secondaryBtn} onPress={takePhoto} activeOpacity={0.8} disabled={photos.length >= MAX_PHOTOS}>
          <Text style={scan.secondaryText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={scan.secondaryBtn} onPress={pickFromLibrary} activeOpacity={0.8} disabled={photos.length >= MAX_PHOTOS}>
          <Text style={scan.secondaryText}>From Library</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[scan.primaryBtn, !photos.length && scan.primaryBtnOff]}
        onPress={analyze}
        activeOpacity={0.8}
        disabled={!photos.length}
      >
        <Text style={[scan.primaryBtnText, !photos.length && scan.primaryBtnTextOff]}>
          Analyze Food
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const scan = StyleSheet.create({
  scrollPad: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },

  tipBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipText: { fontSize: fontSize.footnote, color: colors.textSecondary, fontFamily: fonts.mono, lineHeight: 18 },

  thumbRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  thumbWrap: { width: 92, height: 92, position: 'relative' },
  thumb: { width: 92, height: 92, borderRadius: radius.lg, backgroundColor: colors.surfaceElevated },
  thumbX: {
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
    ...shadow.sm,
  },
  thumbXText: { color: colors.text, fontSize: 10, fontWeight: '700' },
  addThumb: {
    width: 92, height: 92, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.textTertiary + '60', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  addThumbPlus: { fontSize: 24, color: colors.textSecondary, fontWeight: '300', lineHeight: 26 },
  addThumbLabel: { fontSize: 10, color: colors.textSecondary, fontFamily: fonts.mono, fontWeight: '600', letterSpacing: 0.5 },

  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  secondaryBtn: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  secondaryText: { fontSize: fontSize.subhead, fontWeight: '600', color: colors.text, fontFamily: fonts.mono, letterSpacing: 0.3 },

  primaryBtn: {
    backgroundColor: colors.text,
    borderRadius: radius.xl,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnOff: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  primaryBtnText: { fontSize: fontSize.headline, fontWeight: '700', color: colors.background, fontFamily: fonts.mono, letterSpacing: 0.5 },
  primaryBtnTextOff: { color: colors.textTertiary },
});

// ─── Search/Describe Tab ───────────────────────────────────────────────────

function SearchTab({ query, setQuery, results, setResults, busy, setBusy, status, setStatus, onLog }) {
  const analyze = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setBusy(true);
    setStatus('Asking Claude…');
    setResults(null);
    try {
      const result = await analyzeFoodText({
        query: q,
        onProgress: msg => setStatus(msg),
      });
      const items = result.items.map((it, i) => ({ ...it, _localId: `t_${i}_${Math.random().toString(36).slice(2, 6)}` }));
      setResults({ ...result, items });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      Alert.alert('Lookup failed', err.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setBusy(false);
      setStatus('');
    }
  }, [query, setBusy, setStatus, setResults]);

  if (busy) return <LoadingState status={status} />;

  if (results) {
    return (
      <ResultsView
        results={results}
        setResults={setResults}
        onLog={onLog}
        onStartOver={() => setResults(null)}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={search.scrollPad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={search.tipBox}>
        <Text style={search.tipText}>
          Describe what you ate in plain English. Include portions if you know them.
        </Text>
      </View>

      <TextInput
        style={search.input}
        value={query}
        onChangeText={setQuery}
        placeholder={'e.g. "1 cup oatmeal with banana and honey"'}
        placeholderTextColor={colors.textTertiary}
        multiline
        textAlignVertical="top"
        selectionColor={colors.success}
        autoCorrect
      />

      <View style={search.examples}>
        {[
          'Greek yogurt with berries',
          'Chipotle chicken bowl',
          '2 slices pepperoni pizza',
        ].map(ex => (
          <TouchableOpacity
            key={ex}
            style={search.examplePill}
            onPress={() => setQuery(ex)}
            activeOpacity={0.7}
          >
            <Text style={search.exampleText}>{ex}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[scan.primaryBtn, !query.trim() && scan.primaryBtnOff]}
        onPress={analyze}
        activeOpacity={0.8}
        disabled={!query.trim()}
      >
        <Text style={[scan.primaryBtnText, !query.trim() && scan.primaryBtnTextOff]}>
          Look Up
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const search = StyleSheet.create({
  scrollPad: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  tipBox: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipText: { fontSize: fontSize.footnote, color: colors.textSecondary, fontFamily: fonts.mono, lineHeight: 18 },

  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
    fontFamily: fonts.mono,
    minHeight: 110,
  },

  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  examplePill: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 6,
  },
  exampleText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

// ─── Modal Shell ───────────────────────────────────────────────────────────

export function AddFoodModal({ visible, initialTab = 'scan', onClose, onLogItems }) {
  const [tab, setTab] = useState('scan');

  // Scan state
  const [photos, setPhotos] = useState([]);
  const [scanResults, setScanResults] = useState(null);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanStatus, setScanStatus] = useState('');

  // Search state
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');

  const translateY = useRef(new Animated.Value(0)).current;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const busy = scanBusy || searchBusy;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      setTab(initialTab);
      setPhotos([]);
      setScanResults(null);
      setScanBusy(false);
      setScanStatus('');
      setQuery('');
      setSearchResults(null);
      setSearchBusy(false);
      setSearchStatus('');
    }
  }, [visible, initialTab]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          Animated.timing(translateY, { toValue: 800, duration: 200, useNativeDriver: true })
            .start(() => closeRef.current());
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 5 }).start();
        }
      },
    }),
  ).current;

  const handleLogItems = useCallback((items) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onLogItems(items);
  }, [onLogItems]);

  const handleClose = useCallback(() => {
    if (busy) {
      Alert.alert(
        'Cancel analysis?',
        'Analysis is still running. Closing now will discard the result.',
        [
          { text: 'Keep waiting', style: 'cancel' },
          { text: 'Cancel', style: 'destructive', onPress: onClose },
        ],
      );
      return;
    }
    onClose();
  }, [busy, onClose]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="height" style={shell.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose} />
        <Animated.View style={[shell.sheet, { transform: [{ translateY }] }]}>
          <View {...pan.panHandlers} style={shell.handleArea}>
            <View style={shell.handle} />
          </View>

          <View style={shell.header}>
            <Text style={shell.title}>Add Food</Text>
            <TouchableOpacity onPress={handleClose} style={shell.closeBtn} hitSlop={12}>
              <Text style={shell.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TabSwitcher tab={tab} onChange={setTab} />

          <View style={{ flex: 1 }}>
            {tab === 'scan' ? (
              <ScanTab
                photos={photos}
                setPhotos={setPhotos}
                results={scanResults}
                setResults={setScanResults}
                onLog={handleLogItems}
                busy={scanBusy}
                setBusy={setScanBusy}
                status={scanStatus}
                setStatus={setScanStatus}
              />
            ) : (
              <SearchTab
                query={query}
                setQuery={setQuery}
                results={searchResults}
                setResults={setSearchResults}
                busy={searchBusy}
                setBusy={setSearchBusy}
                status={searchStatus}
                setStatus={setSearchStatus}
                onLog={handleLogItems}
              />
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const shell = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    height: '88%',
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handleArea: { paddingTop: spacing.sm, paddingBottom: spacing.xs, alignItems: 'center' },
  handle: { width: 36, height: 4, backgroundColor: colors.border, borderRadius: radius.full },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, fontSize: fontSize.headline, fontWeight: '700', color: colors.text, fontFamily: fonts.mono, letterSpacing: 0.3 },
  closeBtn: {
    width: 28, height: 28, borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
});
