import React, { useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, fontSize, radius, shadow, spacing } from '../../../theme';
import { analyzeFoodPhotos } from '../services/anthropic';
import { LoadingState } from './PulseDots';
import { ResultsView } from './ResultsView';
import { NoFoodView } from './NoFoodView';

const MAX_PHOTOS = 3;

export function ScanTab({
  photos, setPhotos, results, setResults, onLog,
  busy, setBusy, status, setStatus, abortRef,
}) {
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
    const next = res.assets.map(a => ({ uri: a.uri, base64: a.base64, mediaType: a.mimeType ?? 'image/jpeg' }));
    setPhotos(prev => [...prev, ...next].slice(0, MAX_PHOTOS));
  }, [photos.length, setPhotos]);

  const takePhoto = useCallback(async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow camera access to take meal photos.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], base64: true, quality: 0.6 });
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
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const result = await analyzeFoodPhotos({
        images: photos.map(p => ({ base64: p.base64, mediaType: p.mediaType })),
        signal: ctrl.signal,
        onProgress: msg => setStatus(msg),
      });
      const items = result.items.map((it, i) => ({ ...it, _localId: `r_${i}_${Math.random().toString(36).slice(2, 6)}` }));
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
  }, [photos, setBusy, setStatus, setResults, abortRef]);

  if (busy) return <LoadingState status={status} />;
  if (results && results.foodDetected === false) return (
    <NoFoodView
      notes={results.notes}
      source="photo"
      onStartOver={() => { setResults(null); setPhotos([]); }}
    />
  );
  if (results) return (
    <ResultsView
      results={results}
      setResults={setResults}
      onLog={onLog}
      onStartOver={() => setResults(null)}
      photos={photos}
      source="photo"
    />
  );

  return (
    <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={s.tipBox}>
        <Text style={s.tipText}>Tip: 2–3 angles help estimate portion sizes more accurately.</Text>
      </View>

      <View style={s.thumbRow}>
        {photos.map((p, i) => (
          <View key={i} style={s.thumbWrap}>
            <Image source={{ uri: p.uri }} style={s.thumb} />
            <TouchableOpacity onPress={() => removePhoto(i)} style={s.thumbX} hitSlop={6}>
              <Text style={s.thumbXText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < MAX_PHOTOS && (
          <TouchableOpacity style={s.addThumb} onPress={pickFromLibrary} activeOpacity={0.7}>
            <Text style={s.addThumbPlus}>+</Text>
            <Text style={s.addThumbLabel}>Photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.actionsRow}>
        <TouchableOpacity style={s.secondaryBtn} onPress={takePhoto} activeOpacity={0.8} disabled={photos.length >= MAX_PHOTOS}>
          <Text style={s.secondaryText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={pickFromLibrary} activeOpacity={0.8} disabled={photos.length >= MAX_PHOTOS}>
          <Text style={s.secondaryText}>From Library</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[s.primaryBtn, !photos.length && s.primaryBtnOff]}
        onPress={analyze}
        activeOpacity={0.8}
        disabled={!photos.length}
      >
        <Text style={[s.primaryBtnText, !photos.length && s.primaryBtnTextOff]}>Analyze Food</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  tipBox: { backgroundColor: colors.surfaceElevated, borderRadius: radius.md, padding: spacing.sm + 2, borderWidth: 1, borderColor: colors.border },
  tipText: { fontSize: fontSize.footnote, color: colors.textSecondary, fontFamily: fonts.mono, lineHeight: 18 },

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

  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  secondaryBtn: {
    flex: 1, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.lg, paddingVertical: spacing.sm + 4, alignItems: 'center',
  },
  secondaryText: { fontSize: fontSize.subhead, fontWeight: '600', color: colors.text, fontFamily: fonts.mono, letterSpacing: 0.3 },

  primaryBtn: {
    backgroundColor: colors.text, borderRadius: radius.xl, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm,
  },
  primaryBtnOff: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  primaryBtnText: { fontSize: fontSize.headline, fontWeight: '700', color: colors.background, fontFamily: fonts.mono, letterSpacing: 0.5 },
  primaryBtnTextOff: { color: colors.textTertiary },
});
