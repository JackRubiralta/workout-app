import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, radius, spacing, text } from '../../../theme';
import { FieldLabel, SheetInput } from '../../../components/primitives/SheetInput';

export function ManualTab({ onLog }) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('serving');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [fiber, setFiber] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const qty = parseFloat(quantity) || 1;
    Keyboard.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onLog([{
      name: name.trim(),
      quantity: qty,
      unit: unit.trim() || 'serving',
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      fiber: parseFloat(fiber) || 0,
      source: 'manual',
    }], []);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={s.pad}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}
    >
      <FieldLabel>NAME</FieldLabel>
      <SheetInput value={name} onChangeText={setName} placeholder="e.g. Greek yogurt" />

      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <FieldLabel>QTY</FieldLabel>
          <SheetInput value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 2 }}>
          <FieldLabel>UNIT</FieldLabel>
          <SheetInput value={unit} onChangeText={setUnit} placeholder="serving / cup / tbsp" />
        </View>
      </View>

      <FieldLabel style={{ marginTop: spacing.sm }}>CALORIES (kcal)</FieldLabel>
      <SheetInput value={calories} onChangeText={setCalories} keyboardType="decimal-pad" placeholder="0" />

      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <FieldLabel>PROTEIN (g)</FieldLabel>
          <SheetInput value={protein} onChangeText={setProtein} keyboardType="decimal-pad" placeholder="0" />
        </View>
        <View style={{ flex: 1 }}>
          <FieldLabel>CARBS (g)</FieldLabel>
          <SheetInput value={carbs} onChangeText={setCarbs} keyboardType="decimal-pad" placeholder="0" />
        </View>
      </View>

      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <FieldLabel>FAT (g)</FieldLabel>
          <SheetInput value={fat} onChangeText={setFat} keyboardType="decimal-pad" placeholder="0" />
        </View>
        <View style={{ flex: 1 }}>
          <FieldLabel>FIBER (g)</FieldLabel>
          <SheetInput value={fiber} onChangeText={setFiber} keyboardType="decimal-pad" placeholder="0" />
        </View>
      </View>

      <TouchableOpacity
        style={[s.btn, !name.trim() && s.btnOff]}
        disabled={!name.trim()}
        onPress={handleAdd}
        activeOpacity={0.8}
      >
        <Text style={[s.btnText, !name.trim() && s.btnTextOff]}>Add to Log</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pad: { padding: spacing.md, gap: spacing.xs, paddingBottom: spacing.xxl },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  btn: {
    backgroundColor: colors.success, borderRadius: radius.xl, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: spacing.md,
  },
  btnOff: { backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  btnText: { fontSize: fontSize.headline, fontWeight: '700', color: '#fff', fontFamily: fonts.mono, letterSpacing: 0.5 },
  btnTextOff: { color: colors.textTertiary },
});
