// One-time onboarding card. Asks for whichever of {name, body weight,
// height} the app doesn't have yet, then commits everything in a single
// "Save & start" action so the conversation can begin with a populated
// `<state>` block.
//
// The fields shown are decided per-render by the caller (so a user who
// already logged a body weight via Tracking never sees that field). The
// card hides itself once everything is filled — see `CoachScreen`.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type TextStyle,
} from 'react-native';
import { colors, fonts, fontSize, radius, spacing, surfaces, text } from '@/shared/theme';
import { Button, SegmentedControl } from '@/shared/components';
import { SparklesIcon } from '@/shared/components/icons';
import { unitLabel, UnitSystem, type UnitSystemValue } from '@/shared/utils/units';

const NAME_MAX = 40;

type HeightSystem = 'imperial' | 'metric';

export type OnboardingFields = {
  needsName: boolean;
  needsWeight: boolean;
  needsHeight: boolean;
};

export type OnboardingValues = {
  /** Trimmed display name; empty string when not collected. */
  name: string;
  /** Always pounds when collected; null when not collected. */
  weightLb: number | null;
  /** Always centimeters when collected; null when not collected. */
  heightCm: number | null;
};

export type CoachOnboardingProps = {
  fields: OnboardingFields;
  unitSystem: UnitSystemValue;
  /** Existing name (so we pre-fill if only weight/height is missing). */
  initialName: string | null;
  onSubmit: (values: OnboardingValues) => void;
};

export function CoachOnboarding({
  fields,
  unitSystem,
  initialName,
  onSubmit,
}: CoachOnboardingProps) {
  const [name, setName] = useState(initialName ?? '');
  const [weightInput, setWeightInput] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [heightCmInput, setHeightCmInput] = useState('');
  const [heightSystem, setHeightSystem] = useState<HeightSystem>(
    unitSystem === UnitSystem.METRIC ? 'metric' : 'imperial',
  );

  // Keep the height segmented in sync with the user's preferred unit
  // system if the parent re-renders with a new one (settings change
  // mid-onboarding is unlikely but cheap to handle).
  useEffect(() => {
    setHeightSystem(unitSystem === UnitSystem.METRIC ? 'metric' : 'imperial');
  }, [unitSystem]);

  const trimmedName = name.trim();

  const parsedWeightLb = useMemo<number | null>(() => {
    if (!fields.needsWeight) return null;
    const n = parseFloat(weightInput);
    if (!isFinite(n) || n <= 0) return null;
    return unitSystem === UnitSystem.METRIC ? Math.round(n * 2.2046226218 * 10) / 10 : Math.round(n * 10) / 10;
  }, [fields.needsWeight, weightInput, unitSystem]);

  const parsedHeightCm = useMemo<number | null>(() => {
    if (!fields.needsHeight) return null;
    if (heightSystem === 'metric') {
      const n = parseFloat(heightCmInput);
      if (!isFinite(n) || n < 50 || n > 260) return null;
      return Math.round(n * 10) / 10;
    }
    const ft = parseInt(heightFt, 10);
    const inch = heightIn === '' ? 0 : parseInt(heightIn, 10);
    if (!isFinite(ft) || ft < 3 || ft > 8) return null;
    if (!isFinite(inch) || inch < 0 || inch > 11) return null;
    return Math.round((ft * 12 + inch) * 2.54 * 10) / 10;
  }, [fields.needsHeight, heightSystem, heightCmInput, heightFt, heightIn]);

  const canSubmit =
    (!fields.needsName || trimmedName.length > 0) &&
    (!fields.needsWeight || parsedWeightLb != null) &&
    (!fields.needsHeight || parsedHeightCm != null);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      name: fields.needsName ? trimmedName : initialName ?? '',
      weightLb: fields.needsWeight ? parsedWeightLb : null,
      heightCm: fields.needsHeight ? parsedHeightCm : null,
    });
  };

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={s.heroIcon}>
          <SparklesIcon color={colors.text} size={28} />
        </View>
        <Text style={s.title}>Quick intro</Text>
        <Text style={s.subtitle}>
          {introCopy(fields)} Everything stays on this device — your coach uses it to write
          better recommendations.
        </Text>

        <View style={s.fields}>
          {fields.needsName ? (
            <Field label="WHAT SHOULD I CALL YOU?">
              <TextInput
                style={s.input}
                value={name}
                onChangeText={t => setName(t.slice(0, NAME_MAX))}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                selectionColor={colors.success}
              />
            </Field>
          ) : null}

          {fields.needsWeight ? (
            <Field
              label={`BODY WEIGHT (${unitLabel(unitSystem, { uppercase: true })})`}
              helper={
                unitSystem === UnitSystem.METRIC
                  ? 'Used to anchor maintenance calories and protein targets.'
                  : 'Used to anchor maintenance calories and protein targets.'
              }
            >
              <View style={s.inlineRow}>
                <TextInput
                  style={[s.input, s.inputNumber]}
                  value={weightInput}
                  onChangeText={t => setWeightInput(t.replace(/[^0-9.]/g, '').slice(0, 6))}
                  placeholder={unitSystem === UnitSystem.METRIC ? '75.0' : '170'}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  selectionColor={colors.success}
                />
                <Text style={s.unitLabel}>{unitLabel(unitSystem)}</Text>
              </View>
            </Field>
          ) : null}

          {fields.needsHeight ? (
            <Field label="HEIGHT">
              <SegmentedControl
                value={heightSystem}
                options={HEIGHT_OPTIONS}
                onChange={setHeightSystem}
              />
              <View style={{ height: spacing.sm }} />
              {heightSystem === 'metric' ? (
                <View style={s.inlineRow}>
                  <TextInput
                    style={[s.input, s.inputNumber]}
                    value={heightCmInput}
                    onChangeText={t => setHeightCmInput(t.replace(/[^0-9.]/g, '').slice(0, 5))}
                    placeholder="178"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    selectionColor={colors.success}
                  />
                  <Text style={s.unitLabel}>cm</Text>
                </View>
              ) : (
                <View style={s.imperialRow}>
                  <View style={s.imperialCell}>
                    <TextInput
                      style={[s.input, s.inputNumber, s.imperialInput]}
                      value={heightFt}
                      onChangeText={t => setHeightFt(t.replace(/[^0-9]/g, '').slice(0, 1))}
                      placeholder="5"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                      returnKeyType="next"
                      maxLength={1}
                      selectionColor={colors.success}
                    />
                    <Text style={s.imperialUnit}>ft</Text>
                  </View>
                  <View style={s.imperialCell}>
                    <TextInput
                      style={[s.input, s.inputNumber, s.imperialInput]}
                      value={heightIn}
                      onChangeText={t => setHeightIn(t.replace(/[^0-9]/g, '').slice(0, 2))}
                      placeholder="10"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      maxLength={2}
                      selectionColor={colors.success}
                    />
                    <Text style={s.imperialUnit}>in</Text>
                  </View>
                </View>
              )}
            </Field>
          ) : null}
        </View>

        <Button
          label="Save & start chatting"
          onPress={handleSubmit}
          disabled={!canSubmit}
          color={colors.success}
          style={s.cta}
        />

        <Text style={s.privacy}>
          Stored locally with the rest of your app data. Edit later via the AI tab header.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const HEIGHT_OPTIONS = [
  { value: 'imperial' as HeightSystem, label: 'ft / in' },
  { value: 'metric' as HeightSystem, label: 'cm' },
];

function introCopy(fields: OnboardingFields): string {
  const wants: string[] = [];
  if (fields.needsName) wants.push('your name');
  if (fields.needsWeight) wants.push('your body weight');
  if (fields.needsHeight) wants.push('your height');
  if (wants.length === 0) return 'You’re all set.';
  if (wants.length === 1) return `I just need ${wants[0]} to get started.`;
  if (wants.length === 2) return `I just need ${wants[0]} and ${wants[1]} to get started.`;
  return `I just need ${wants[0]}, ${wants[1]}, and ${wants[2]} to get started.`;
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
      {helper ? <Text style={s.fieldHelper}>{helper}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  heroIcon: {
    alignSelf: 'flex-start',
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { ...(text.title1 as TextStyle), marginBottom: spacing.xs },
  subtitle: {
    ...(text.bodySecondary as TextStyle),
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },

  fields: { gap: spacing.lg, marginBottom: spacing.xl },

  field: { gap: spacing.xs },
  fieldLabel: {
    ...(text.eyebrow as TextStyle),
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  fieldHelper: {
    ...(text.monoCaption as TextStyle),
    color: colors.textTertiary,
    marginTop: spacing.xs,
    lineHeight: 16,
  },

  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  imperialRow: { flexDirection: 'row', gap: spacing.sm },
  // Each imperial cell takes half the row. The unit suffix sits over the
  // input as an absolutely-positioned label so the input keeps its full
  // half-width without the nested-flex measurement quirks RN-web has
  // when a flex:1 TextInput is combined with a sibling label.
  imperialCell: { flex: 1, justifyContent: 'center' },
  imperialInput: { flex: 0, width: '100%', paddingRight: spacing.xl },
  imperialUnit: {
    position: 'absolute',
    right: spacing.md,
    color: colors.textSecondary,
    fontSize: fontSize.subhead,
    fontFamily: fonts.mono,
  },

  input: {
    ...surfaces.row,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.body,
    color: colors.text,
    fontFamily: fonts.sans,
  },
  inputNumber: { fontFamily: fonts.mono, textAlign: 'center' },
  unitLabel: {
    ...(text.monoSubhead as TextStyle),
    color: colors.textSecondary,
    width: 32,
    textAlign: 'left',
  },

  cta: { height: 56 },
  privacy: {
    ...(text.monoCaption as TextStyle),
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 16,
  },
});
