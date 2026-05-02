import React, { useCallback, useMemo, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, fontSize, radius, shadow, spacing, surfaces, text } from '@/shared/theme';
import { Button, LoadingState } from '@/shared/components';
import { analyzeFood } from '../../services/nutritionAiService';
import { prepareFoodImage } from '../../utils/prepareFoodImage';
import { ResultsView, type AnalyzeResultsState } from './ResultsView';
import { NoFoodView } from './NoFoodView';
import { FoodSource, MAX_PHOTOS } from '../../constants/nutritionConstants';
import type { FoodSourceValue } from '../../types/nutritionTypes';
import type { CapturedPhoto } from './AddFoodSheet';

const QUERY_MAX_CHARS = 500;

type LogItemsArg = Parameters<React.ComponentProps<typeof ResultsView>['onLog']>;

export type AnalyzeFoodFormProps = {
  photos: CapturedPhoto[];
  setPhotos: Dispatch<SetStateAction<CapturedPhoto[]>>;
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
  results: AnalyzeResultsState | null;
  setResults: Dispatch<SetStateAction<AnalyzeResultsState | null>>;
  busy: boolean;
  setBusy: Dispatch<SetStateAction<boolean>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  onLog: (...args: LogItemsArg) => void;
  abortRef: MutableRefObject<AbortController | null>;
};

export function AnalyzeFoodForm({
  photos,
  setPhotos,
  query,
  setQuery,
  results,
  setResults,
  busy,
  setBusy,
  status,
  setStatus,
  onLog,
  abortRef,
}: AnalyzeFoodFormProps) {
  const hasPhotos = photos.length > 0;
  const trimmedQuery = query.trim();
  const canAnalyze = hasPhotos || trimmedQuery.length > 0;

  const source: FoodSourceValue = useMemo(
    () => (hasPhotos ? FoodSource.PHOTO : FoodSource.TEXT),
    [hasPhotos],
  );

  const remainingPhotoSlots = MAX_PHOTOS - photos.length;

  const appendPhotos = useCallback(
    (assets: ImagePicker.ImagePickerAsset[]) => {
      // Capture URI + native dimensions only. The expensive base64 + resize
      // step is deferred to `handleAnalyze` so picking stays instant and we
      // don't hold multi-MB base64 strings in React state.
      const next: CapturedPhoto[] = assets
        .filter(a => a.uri)
        .map(a => ({
          uri: a.uri,
          width: a.width ?? 0,
          height: a.height ?? 0,
        }));
      setPhotos(prev => [...prev, ...next].slice(0, MAX_PHOTOS));
    },
    [setPhotos],
  );

  const pickFromLibrary = useCallback(async () => {
    if (remainingPhotoSlots <= 0) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to attach meal photos.');
      return;
    }
    // `quality: 1` and `base64: false` skip an unnecessary recompression
    // pass — `prepareFoodImage` does a single resize + JPEG encode at
    // analyze time.
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: false,
      quality: 1,
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
      mediaTypes: ['images'],
      base64: false,
      quality: 1,
    });
    if (res.canceled) return;
    appendPhotos(res.assets);
  }, [remainingPhotoSlots, appendPhotos]);

  const removePhoto = useCallback(
    (idx: number) => {
      Haptics.selectionAsync().catch(() => {});
      setPhotos(prev => prev.filter((_, i) => i !== idx));
    },
    [setPhotos],
  );

  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze || busy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setBusy(true);
    setResults(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      // Prep all photos in parallel before sending. Resize + JPEG encode is
      // CPU-bound and can take a second or two per image on older phones —
      // running them concurrently means the wall-clock cost is bounded by
      // the slowest image, not the sum.
      let preparedImages: Array<{ base64: string; mediaType: string }> = [];
      if (photos.length > 0) {
        setStatus(photos.length > 1 ? `Preparing ${photos.length} photos…` : 'Preparing photo…');
        const prepared = await Promise.all(photos.map(p => prepareFoodImage(p)));
        if (ctrl.signal.aborted) return;
        preparedImages = prepared.map(p => ({ base64: p.base64, mediaType: p.mediaType ?? 'image/jpeg' }));
      }

      setStatus('Analyzing…');
      const result = await analyzeFood({
        images: preparedImages,
        query: trimmedQuery,
        signal: ctrl.signal,
        onProgress: msg => setStatus(msg),
      });
      const items = result.items.map((it, i) => ({
        ...it,
        _localId: `r_${i}_${Math.random().toString(36).slice(2, 6)}`,
      }));
      setResults({ ...result, items });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      const e = err as Error;
      if (e.name !== 'AbortError' && !ctrl.signal.aborted) {
        Alert.alert('Analysis failed', e.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    } finally {
      setBusy(false);
      setStatus('');
      abortRef.current = null;
    }
  }, [canAnalyze, busy, photos, trimmedQuery, setBusy, setStatus, setResults, abortRef]);

  if (busy) return <LoadingState status={status} />;

  if (results && results.foodDetected === false) {
    return (
      <NoFoodView
        notes={results.notes}
        source={source === FoodSource.PHOTO ? 'photo' : 'text'}
        onStartOver={() => {
          setResults(null);
          setPhotos([]);
          setQuery('');
        }}
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
            <TouchableOpacity
              onPress={() => removePhoto(i)}
              style={s.thumbX}
              hitSlop={6}
              activeOpacity={0.7}
            >
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
        placeholder={
          hasPhotos
            ? 'Anything the photo misses — "I ate 3 of these", "no dressing", "skim milk"…'
            : 'What did you eat? "1 cup oatmeal with banana and honey"'
        }
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
      {!canAnalyze ? <Text style={s.analyzeHint}>Add a photo or description to enable</Text> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },

  sectionLabel: {
    ...(text.eyebrowSmall as object),
    color: colors.textTertiary,
    marginBottom: spacing.xs,
    marginLeft: 2,
  },
  sectionLabelGap: { marginTop: spacing.md },

  thumbRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  thumbWrap: { width: 92, height: 92, position: 'relative' },
  thumb: { width: 92, height: 92, borderRadius: radius.lg, backgroundColor: colors.surfaceElevated },
  thumbX: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  thumbXText: { color: colors.text, fontSize: 10, fontWeight: '700' },
  addThumb: {
    width: 92,
    height: 92,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.textTertiary + '60',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addThumbPlus: { fontSize: 24, color: colors.textSecondary, fontWeight: '300', lineHeight: 26 },
  addThumbLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  captureRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  captureBtn: {
    ...surfaces.row,
    flex: 1,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  captureBtnOff: { opacity: 0.4 },
  captureText: {
    fontSize: fontSize.subhead,
    fontWeight: '600',
    color: colors.text,
    fontFamily: fonts.mono,
    letterSpacing: 0.3,
  },

  input: {
    ...surfaces.inset,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.body,
    color: colors.text,
    fontFamily: fonts.mono,
    minHeight: 110,
  },

  analyzeBtn: { height: 52, marginTop: spacing.md },
  analyzeHint: {
    ...(text.bodySecondary as object),
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 6,
  },
});
