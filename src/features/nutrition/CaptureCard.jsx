import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, fontSize, radius, shadow, spacing, surfaces, text } from '../../theme';
import { CameraIcon } from '../../shell/icons';

// Big "Add food" call-to-action card at the top of the Nutrition tab.
// Single tap opens the AddFoodSheet.
export function CaptureCard({ onScan }) {
  return (
    <TouchableOpacity style={s.primary} onPress={onScan} activeOpacity={0.85}>
      <View style={s.iconCircle}>
        <CameraIcon color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>Add food</Text>
        <Text style={s.sub}>Snap a photo, describe it, or both</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  primary: {
    ...surfaces.card,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    ...shadow.sm,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...text.title3, fontSize: fontSize.headline },
  sub: { ...text.bodySecondary, fontSize: 13, marginTop: 2 },
});
