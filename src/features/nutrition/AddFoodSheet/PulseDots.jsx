import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';
import { colors, fontSize, fonts, spacing } from '../../../theme';

export function PulseDots() {
  const a1 = useRef(new Animated.Value(0.3)).current;
  const a2 = useRef(new Animated.Value(0.3)).current;
  const a3 = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    const seq = (av, delay) =>
      Animated.loop(Animated.sequence([
        Animated.timing(av, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
        Animated.timing(av, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ]));
    const l1 = seq(a1, 0); const l2 = seq(a2, 150); const l3 = seq(a3, 300);
    l1.start(); l2.start(); l3.start();
    return () => { l1.stop(); l2.stop(); l3.stop(); };
  }, [a1, a2, a3]);
  return (
    <View style={s.row}>
      <Animated.View style={[s.dot, { opacity: a1 }]} />
      <Animated.View style={[s.dot, { opacity: a2 }]} />
      <Animated.View style={[s.dot, { opacity: a3 }]} />
    </View>
  );
}

export function LoadingState({ status }) {
  return (
    <View style={s.wrap}>
      <PulseDots />
      <Text style={s.title}>Analyzing</Text>
      <Text style={s.status}>{status || 'Working…'}</Text>
      <Text style={s.hint}>This usually takes 5–15 seconds.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.text },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.sm, paddingHorizontal: spacing.lg },
  title: { marginTop: spacing.md, fontSize: fontSize.title3, fontWeight: '700', color: colors.text, fontFamily: fonts.serif },
  status: { fontSize: fontSize.subhead, color: colors.textSecondary, fontFamily: fonts.mono, textAlign: 'center' },
  hint: { marginTop: spacing.sm, fontSize: fontSize.caption, color: colors.textTertiary, fontFamily: fonts.mono, textAlign: 'center' },
});
