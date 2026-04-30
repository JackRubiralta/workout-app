import React, { useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Keyboard } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius, spacing } from '../../../theme';
import { analyzeFoodText } from '../services/anthropic';
import { LoadingState } from './PulseDots';
import { ResultsView } from './ResultsView';

export function SearchTab({
  query, setQuery, results, setResults,
  busy, setBusy, status, setStatus, onLog, abortRef,
}) {
  const analyze = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setBusy(true);
    setStatus('Asking Claude…');
    setResults(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const result = await analyzeFoodText({
        query: q,
        signal: ctrl.signal,
        onProgress: msg => setStatus(msg),
      });
      const items = result.items.map((it, i) => ({ ...it, _localId: `t_${i}_${Math.random().toString(36).slice(2, 6)}` }));
      setResults({ ...result, items });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      if (err.name !== 'AbortError') {
        Alert.alert('Lookup failed', err.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    } finally {
      setBusy(false);
      setStatus('');
      abortRef.current = null;
    }
  }, [query, setBusy, setStatus, setResults, abortRef]);

  if (busy) return <LoadingState status={status} />;
  if (results) return (
    <ResultsView
      results={results}
      setResults={setResults}
      onLog={onLog}
      onStartOver={() => setResults(null)}
      source="text"
    />
  );

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={s.pad}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}
    >
      <View style={s.tipBox}>
        <Text style={s.tipText}>Describe what you ate in plain English. Include portions if you know them.</Text>
      </View>

      <TextInput
        style={s.input}
        value={query}
        onChangeText={setQuery}
        placeholder={'e.g. "1 cup oatmeal with banana and honey"'}
        placeholderTextColor={colors.textTertiary}
        multiline
        textAlignVertical="top"
        selectionColor={colors.success}
        autoCorrect
      />

      <View style={s.examples}>
        {['Greek yogurt with berries', 'Chipotle chicken bowl', '2 slices pepperoni pizza'].map(ex => (
          <TouchableOpacity key={ex} style={s.examplePill} onPress={() => setQuery(ex)} activeOpacity={0.7}>
            <Text style={s.exampleText}>{ex}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[s.primaryBtn, !query.trim() && s.primaryBtnOff]}
        onPress={analyze}
        activeOpacity={0.8}
        disabled={!query.trim()}
      >
        <Text style={[s.primaryBtnText, !query.trim() && s.primaryBtnTextOff]}>Look Up</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
  tipBox: { backgroundColor: colors.surfaceElevated, borderRadius: radius.md, padding: spacing.sm + 2, borderWidth: 1, borderColor: colors.border },
  tipText: { fontSize: fontSize.footnote, color: colors.textSecondary, fontFamily: fonts.mono, lineHeight: 18 },

  input: {
    backgroundColor: colors.surfaceElevated, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    fontSize: fontSize.body, color: colors.text, fontFamily: fonts.mono,
    minHeight: 110,
  },
  examples: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  examplePill: {
    backgroundColor: colors.surface, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.sm + 2, paddingVertical: 6,
  },
  exampleText: { fontSize: 11, color: colors.textSecondary, fontFamily: fonts.mono, fontWeight: '600', letterSpacing: 0.3 },

  primaryBtn: {
    backgroundColor: colors.text, borderRadius: radius.xl, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm,
  },
  primaryBtnOff: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  primaryBtnText: { fontSize: fontSize.headline, fontWeight: '700', color: colors.background, fontFamily: fonts.mono, letterSpacing: 0.5 },
  primaryBtnTextOff: { color: colors.textTertiary },
});
