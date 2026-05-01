import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, text } from '../../theme';
import { Button, ScrollPicker, Sheet, SheetHeader } from '../../components/primitives';
import { useSettingsData } from '../../shell/store';
import { BODY_WEIGHT_PICKER, fromLb, toLb, unitLabel } from '../../utils/units';

// Picker values in the user's preferred unit. Memoised on unitSystem so
// switching from imperial → metric rebuilds (different bounds + step).
function pickerValuesFor(system) {
  const { min, max, step } = BODY_WEIGHT_PICKER[system];
  return ScrollPicker.range(min, max, step);
}

function formatPickerValue(v) {
  return v % 1 === 0 ? String(v) : v.toFixed(1);
}

export function BodyWeightSheet({ visible, onClose, onSave, defaultWeight }) {
  const { unitSystem } = useSettingsData();
  const values = useMemo(() => pickerValuesFor(unitSystem), [unitSystem]);
  const fallback = unitSystem === 'metric' ? 75 : 170;

  // Picker state lives in display unit. We convert to lb on save so
  // storage stays uniform regardless of preference.
  const [displayWeight, setDisplayWeight] = useState(fallback);
  const [openKey, setOpenKey] = useState(0);

  useEffect(() => {
    if (visible) {
      const seedLb = defaultWeight && defaultWeight > 0 ? defaultWeight : (unitSystem === 'metric' ? toLb(75, 'metric') : 170);
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
  const stamp = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    + ' · ' + now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

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
  timestamp: { ...text.bodySecondary, fontSize: 13, color: colors.textSecondary },

  pickerWrap: { gap: spacing.xs },
  unitLabel: { ...text.eyebrowSmall, textAlign: 'center' },

  saveBtn: { height: 52, marginTop: spacing.sm },
});
