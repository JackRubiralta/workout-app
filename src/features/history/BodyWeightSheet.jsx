import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fontSize, radius, spacing, text } from '../../theme';
import { Sheet } from '../../components/primitives/Sheet';
import { ScrollPicker } from '../../components/primitives/ScrollPicker';
import { BODY_WEIGHT_MIN_LB, BODY_WEIGHT_MAX_LB, BODY_WEIGHT_STEP_LB } from '../../constants/history';

const VALUES = ScrollPicker.range(BODY_WEIGHT_MIN_LB, BODY_WEIGHT_MAX_LB, BODY_WEIGHT_STEP_LB);

function formatWeight(v) {
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

export function BodyWeightSheet({ visible, onClose, onSave, defaultWeight }) {
  const [weight, setWeight] = useState(170);
  const [openKey, setOpenKey] = useState(0);

  useEffect(() => {
    if (visible) {
      setWeight(defaultWeight && defaultWeight > 0 ? defaultWeight : 170);
      setOpenKey(k => k + 1);
    }
  }, [visible, defaultWeight]);

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSave(weight);
    onClose();
  };

  const now = new Date();
  const stamp = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    + ' · ' + now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View style={s.body}>
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>BODY WEIGHT</Text>
            <Text style={s.title}>Log weight</Text>
          </View>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={s.closeBtn}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.timestamp}>{stamp}</Text>

        <View style={s.pickerWrap}>
          <Text style={s.unitLabel}>WEIGHT (lb)</Text>
          <ScrollPicker
            key={`w${openKey}`}
            values={VALUES}
            value={weight}
            onChange={setWeight}
            format={formatWeight}
            accent={colors.success}
          />
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={s.saveText}>Save weight</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
  },
  eyebrow: { ...text.eyebrowSmall, color: colors.textTertiary, marginBottom: 2 },
  title: { ...text.title3, fontSize: fontSize.headline },
  closeBtn: { width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  timestamp: { ...text.bodySecondary, fontSize: 13, color: colors.textSecondary },

  pickerWrap: { gap: spacing.xs },
  unitLabel: { ...text.eyebrowSmall, textAlign: 'center' },

  saveBtn: {
    height: 52, backgroundColor: colors.success, borderRadius: radius.xl,
    alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.sm,
  },
  saveText: { ...text.button, color: '#fff', letterSpacing: 0.3 },
});
