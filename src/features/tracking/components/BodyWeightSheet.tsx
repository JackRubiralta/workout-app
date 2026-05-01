import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, type TextStyle } from 'react-native';
import { colors, spacing, text } from '@/shared/theme';
import { Button, ScrollPicker, Sheet, SheetHeader } from '@/shared/components';
import { useSettingsData } from '@/shared/state/store';
import {
  BODY_WEIGHT_PICKER,
  fromLb,
  toLb,
  unitLabel,
  UnitSystem,
  type UnitSystemValue,
} from '@/shared/utils/units';
import type { BodyWeightUnit } from '../types/trackingTypes';

function pickerValuesFor(system: UnitSystemValue): number[] {
  const { min, max, step } = BODY_WEIGHT_PICKER[system];
  return ScrollPicker.range(min, max, step);
}

function formatPickerValue(v: number): string {
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

export type BodyWeightSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (weightLb: number, unit: BodyWeightUnit) => void;
  defaultWeight: number;
};

export function BodyWeightSheet({ visible, onClose, onSave, defaultWeight }: BodyWeightSheetProps) {
  const { unitSystem } = useSettingsData();
  const values = useMemo(() => pickerValuesFor(unitSystem), [unitSystem]);

  const [displayWeight, setDisplayWeight] = useState(unitSystem === UnitSystem.METRIC ? 75 : 170);
  const [openKey, setOpenKey] = useState(0);

  useEffect(() => {
    if (visible) {
      const seedLb =
        defaultWeight && defaultWeight > 0
          ? defaultWeight
          : unitSystem === UnitSystem.METRIC
            ? toLb(75, UnitSystem.METRIC)
            : 170;
      setDisplayWeight(Math.round(fromLb(seedLb, unitSystem) * 10) / 10);
      setOpenKey(k => k + 1);
    }
  }, [visible, defaultWeight, unitSystem]);

  const handleSave = () => {
    const lb = toLb(displayWeight, unitSystem);
    onSave(Math.round(lb * 10) / 10, 'lb');
    onClose();
  };

  const now = new Date();
  const stamp =
    now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' +
    now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <Sheet visible={visible} onClose={onClose}>
      <SheetHeader eyebrow="BODY WEIGHT" title="Log Weight" onClose={onClose} />
      <View style={s.body}>
        <Text style={s.timestamp}>{stamp}</Text>

        <View style={s.pickerWrap}>
          <Text style={s.unitLabel}>WEIGHT ({unitLabel(unitSystem)})</Text>
          <ScrollPicker
            key={`w${openKey}-${unitSystem}`}
            values={values}
            value={displayWeight}
            onChange={setDisplayWeight}
            format={formatPickerValue}
            accent={colors.success}
          />
        </View>

        <Button label="Save Weight" onPress={handleSave} color={colors.success} style={s.saveBtn} />
      </View>
    </Sheet>
  );
}

const s = StyleSheet.create({
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.md },
  timestamp: { ...(text.bodySecondary as TextStyle), fontSize: 13, color: colors.textSecondary },

  pickerWrap: { gap: spacing.xs },
  unitLabel: { ...(text.eyebrowSmall as TextStyle), textAlign: 'center' },

  saveBtn: { height: 52, marginTop: spacing.sm },
});
