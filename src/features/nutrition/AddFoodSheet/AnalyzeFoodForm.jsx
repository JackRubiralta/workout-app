import React, { useCallback, useMemo } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, fontSize, radius, shadow, spacing, surfaces, text } from '../../../theme';
import { Button, LoadingState } from '../../../components/primitives';
import { analyzeFood } from '../services/anthropic';
import { ResultsView } from './ResultsView';
import { NoFoodView } from './NoFoodView';
import { FoodSource, MAX_PHOTOS, PHOTO_QUALITY } from '../../../constants/nutrition';

const QUERY_MAX_CHARS = 500;

// Single combined Add-Food form: photos (0–N), free-text context (0–500
// chars), one Analyze action. The two inputs are independent — either
// alone is enough to fire — and combined they let the user log things the
// camera can't see ("I ate 3 of these yogurts", "no dressing on this
// salad", "this is the low-fat version").
//
// State machine:
//   idle      → user is composing  (photos + query both editable)
//   busy      → request in flight  (LoadingState rendered, abortRef armed)
//   results   → AI returned items  (ResultsView)
//   no-food   → AI returned foodDetected:false (NoFoodView)
//
// `abortRef` is owned by the parent (AddFoodSheet) so the close-while-busy
// confirmation can cancel the in-flight request.
export function AnalyzeFoodForm({
  photos, setPhotos,
  query, setQuery,
  results, setResults,
  busy, setBusy,
  status, setStatus,
  onLog,
  abortRef,
}) {
  const hasPhotos = photos.length > 0;
  const trimmedQuery = query.trim();
  const canAnalyze = hasPhotos || trimmedQuery.length > 0;

  // Source recorded on each logged entry. Photo wins when present (even
  // with text context) since the photo is the dominant piece of evidence
  // — `notes` will still capture the user's text on the food entry.
  const source = useMemo(
    () => (hasPhotos ? FoodSource.PHOTO : FoodSource.TEXT),
    [hasPhotos],
  );

  // ── Photos ─────────────────────────────────────────────────────────────
  const remainingPhotoSlots = MAX_PHOTOS - photos.length;

  const appendPhotos = useCallback((assets) => {
    const next = assets.map(a => ({
      uri: a.uri,
      base64: a.base64,
      mediaType: a.mimeType ?? 'image/jpeg',
    }));
    setPhotos(prev => [...prev, ...next].slice(0, MAX_PHOTOS));
  }, [setPhotos]);

  const pickFromLibrary = useCallback(async () => {
    if (remainingPhotoSlots <= 0) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach meal photos.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: PHOTO_QUALITY,
      allowsMultipleSelection: true,
      selectionLimit: remainingPhotoSlots,
    });
    if (res.canceled) return;
    appendPhotos(res.assets);
  }, [remainingPhotoSlots, appendPhotos]);

  const takePhoto = useCallback(async () => {
    if (remainingPhotoSlots <= 0) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take meal photos.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], base64: true, quality: PHOTO_QUALITY,
    });
    if (res.canceled) return;
    appendPhotos(res.assets);
  }, [remainingPhotoSlots, appendPhotos]);

  const removePhoto = useCallback((idx) => {
    Haptics.selectionAsync().catch(() => {});
    setPhotos(prev => prev.filter((_, i) => i !== idx));
  }, [setPhotos]);

  // ── Analyze ────────────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze || busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setBusy(true);
    setStatus('Analyzing…');
    setResults(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const result = await analyzeFood({
        images: photos.map(p => ({ base64: p.base64, mediaType: p.mediaType })),
        query: trimmedQuery,
        signal: ctrl.signal,
        onProgress: msg => setStatus(msg),
      });
      // Stamp items with stable local ids so ResultsView can edit/remove them.
      const items = result.items.map((it, i) => ({
        ...it,
        _localId: `r_${i}_${Math.random().toString(36).slice(2, 6)}`,
      }));
      setResults({ ...result, items });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      if (err.name !== 'AbortError') {
        Alert.alert('Analysis failed', err.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    } finally {
      setBusy(false);
      setStatus('');
      abortRef.current = null;
    }
  }, [canAnalyze, busy, photos, trimmedQuery, setBusy, setStatus, setResults, abortRef]);

  // ── Render ─────────────────────────────────────────────────────────────
  if (busy) return <LoadingState status={status} />;

  if (results && results.foodDetected === false) {
    return (
      <NoFoodView
        notes={results.notes}
        source={source === FoodSource.PHOTO ? 'photo' : 'text'}
        onStartOver={() => { setResults(null); setPhotos([]); setQuery(''); }}
      />
    );
  }

  if (results) {
    return (
      <ResultsView
        results={results}
        setResults={setResults}
        onLog={onLog}
        onStartOver={() => setResults(null)}
        photos={photos}
        notes={trimmedQuery || results.notes || null}
        source={source}
      />
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={s.pad}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.sectionLabel}>PHOTOS · OPTIONAL</Text>
      <View style={s.thumbRow}>
        {photos.map((p, i) => (
          <View key={p.uri + i} style={s.thumbWrap}>
            <Image source={{ uri: p.uri }} style={s.thumb} />
            <TouchableOpacity onPress={() => removePhoto(i)} style={s.thumbX} hitSlop={6} activeOpacity={0.7}>
              <Text style={s.thumbXText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {remainingPhotoSlots > 0 && (
          <TouchableOpacity style={s.addThumb} onPress={pickFromLibrary} activeOpacity={0.7}>
            <Text style={s.addThumbPlus}>+</Text>
            <Text style={s.addThumbLabel}>Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.captureRow}>
        <TouchableOpacity
          style={[s.captureBtn, remainingPhotoSlots <= 0 && s.captureBtnOff]}
          onPress={takePhoto}
          activeOpacity={0.8}
          disabled={remainingPhotoSlots <= 0}
        >
          <Text style={s.captureText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.captureBtn, remainingPhotoSlots <= 0 && s.captureBtnOff]}
          onPress={pickFromLibrary}
          activeOpacity={0.8}
          disabled={remainingPhotoSlots <= 0}
        >
          <Text style={s.captureText}>From Library</Text>
        </TouchableOpacity>
      </View>

      <Text style={[s.sectionLabel, s.sectionLabelGap]}>
        {hasPhotos ? 'NOTES · OPTIONAL' : 'DESCRIBE · OPTIONAL'}
      </Text>
      <TextInput
        style={s.input}
        value={query}
        onChangeText={t => setQuery(t.slice(0, QUERY_MAX_CHARS))}
        placeholder={hasPhotos
          ? 'Anything the photo misses — "I ate 3 of these", "no dressing", "skim milk"…'
          : 'What did you eat? "1 cup oatmeal with banana and honey"'}
        placeholderTextColor={colors.textTertiary}
        multiline
        textAlignVertical="top"
        selectionColor={colors.success}
        autoCorrect
        maxLength={QUERY_MAX_CHARS}
      />

      <Button
        label="Analyze"
        onPress={handleAnalyze}
        disabled={!canAnalyze}
        color={colors.success}
        style={s.analyzeBtn}
      />
      {!canAnalyze ? (
        <Text style={s.analyzeHint}>Add a photo or description to enable</Text>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },

  sectionLabel: { ...text.eyebrowSmall, color: colors.textTertiary, marginBottom: spacing.xs, marginLeft: 2 },
  sectionLabelGap: { marginTop: spacing.md },

  thumbRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  thumbWrap: { width: 92, height: 92, position: 'relative' },
  thumb: { width: 92, height: 92, borderRadius: radius.lg, backgroundColor: colors.surfaceElevated },
  thumbX: {
    position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', ...shadow.sm,
  },
  thumbXText: { color: colors.text, fontSize: 10, fontWeight: '700' },
  addThumb: {
    width: 92, height: 92, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.textTertiary + '60', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  addThumbPlus: { fontSize: 24, color: colors.textSecondary, fontWeight: '300', lineHeight: 26 },
  addThumbLabel: { fontSize: 10, color: colors.textSecondary, fontFamily: fonts.mono, fontWeight: '600', letterSpacing: 0.5 },

  captureRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  captureBtn: {
    ...surfaces.row,
    flex: 1,
    paddingVertical: spacing.sm + 4, alignItems: 'center',
  },
  captureBtnOff: { opacity: 0.4 },
  captureText: { fontSize: fontSize.subhead, fontWeight: '600', color: colors.text, fontFamily: fonts.mono, letterSpacing: 0.3 },

  input: {
    ...surfaces.inset,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: fontSize.body, color: colors.text, fontFamily: fonts.mono,
    minHeight: 110,
  },

  analyzeBtn: { height: 52, marginTop: spacing.md },
  analyzeHint: {
    ...text.bodySecondary,
    fontSize: 12, color: colors.textTertiary,
    textAlign: 'center', marginTop: 6,
  },
});
