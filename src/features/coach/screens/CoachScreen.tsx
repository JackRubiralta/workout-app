// Full-screen AI coach. Composes:
//   • CoachOnboarding when profile/weight/height aren't all on record
//   • CoachEmpty + suggestions before the first message
//   • CoachTranscript for the live conversation
//   • CoachComposer pinned to the bottom (lives above the tab bar)
//   • A header "Edit profile" affordance after onboarding so the user
//     can update name/height later without leaving the screen

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, fonts, fontSize, layout, radius, spacing, surfaces, text } from '@/shared/theme';
import {
  Button,
  ScreenHeader,
  SegmentedControl,
  Sheet,
  SheetHeader,
} from '@/shared/components';
import { useBodyWeightData, useNutritionData, useSettingsData } from '@/shared/state/store';
import { UnitSystem, fromLb, toLb, type UnitSystemValue } from '@/shared/utils/units';
import type { Gender } from '@/shared/types/settingsTypes';

const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
import { useCoach } from '../hooks/useCoach';
import { CoachComposer } from '../components/CoachComposer';
import { CoachEmpty } from '../components/CoachEmpty';
import { CoachOnboarding, type OnboardingValues } from '../components/CoachOnboarding';
import { CoachTranscript } from '../components/CoachTranscript';

export function CoachScreen() {
  const { profile, updateProfile, unitSystem } = useSettingsData();
  const { latest: latestWeight, addEntry: addWeightEntry } = useBodyWeightData();
  const { goals } = useNutritionData();
  const coach = useCoach();

  const [draft, setDraft] = useState('');
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom on new content. Tiny delay lets the layout
  // settle before scrollToEnd measures — without it the first scroll
  // after a fresh message lands one row short on iOS.
  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(id);
  }, [coach.messages.length, coach.isThinking]);

  const onboardingFields = {
    needsName: !profile.name,
    needsGender: profile.gender == null,
    needsWeight: latestWeight == null,
    needsHeight: profile.heightCm == null,
  };
  const isOnboarding =
    onboardingFields.needsName ||
    onboardingFields.needsGender ||
    onboardingFields.needsWeight ||
    onboardingFields.needsHeight;

  const handleOnboardingSubmit = useCallback(
    (v: OnboardingValues) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const patch: { name?: string | null; heightCm?: number | null; gender?: Gender | null } = {};
      if (onboardingFields.needsName) patch.name = v.name;
      if (onboardingFields.needsGender) patch.gender = v.gender;
      if (onboardingFields.needsHeight) patch.heightCm = v.heightCm;
      if (Object.keys(patch).length > 0) updateProfile(patch);
      if (onboardingFields.needsWeight && v.weightLb && v.weightLb > 0) {
        addWeightEntry(v.weightLb, 'lb');
      }
    },
    [onboardingFields, updateProfile, addWeightEntry],
  );

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void coach.send(text);
  }, [draft, coach]);

  const handleSuggestion = useCallback(
    (text: string) => {
      if (coach.isThinking) return;
      void coach.send(text);
    },
    [coach],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {isOnboarding ? (
        <CoachOnboarding
          fields={onboardingFields}
          unitSystem={unitSystem}
          initialName={profile.name}
          onSubmit={handleOnboardingSubmit}
        />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <View style={styles.headerWrap}>
            <ScreenHeader
              eyebrow="AI"
              title="Coach"
              actionLabel={coach.messages.length > 0 ? 'New chat' : 'Edit profile'}
              onActionPress={
                coach.messages.length > 0
                  ? () => {
                      Haptics.selectionAsync().catch(() => {});
                      coach.reset();
                    }
                  : () => {
                      Haptics.selectionAsync().catch(() => {});
                      setProfileSheetOpen(true);
                    }
              }
            />
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {coach.messages.length === 0 && !coach.isThinking ? (
              <CoachEmpty name={profile.name} onPickSuggestion={handleSuggestion} />
            ) : (
              <CoachTranscript
                messages={coach.messages}
                isThinking={coach.isThinking}
                currentGoals={goals}
                onApplyWorkout={coach.applyWorkout}
                onDiscardWorkout={coach.discardWorkout}
                onApplyGoals={coach.applyGoals}
                onDiscardGoals={coach.discardGoals}
              />
            )}
            <View style={{ height: layout.tabBarClearance / 2 }} />
          </ScrollView>

          <CoachComposer
            value={draft}
            onChangeText={setDraft}
            onSend={handleSend}
            isThinking={coach.isThinking}
            errorText={coach.error}
          />
        </KeyboardAvoidingView>
      )}

      <ProfileSheet
        visible={profileSheetOpen}
        onClose={() => setProfileSheetOpen(false)}
        unitSystem={unitSystem}
      />
    </SafeAreaView>
  );
}

// ─── Profile sheet ──────────────────────────────────────────────────────────
// Lets the user revise the values gathered during onboarding. Sits in the
// same file as the screen because it's only ever rendered from here and
// shares all the same field-parsing logic.

type ProfileSheetProps = {
  visible: boolean;
  onClose: () => void;
  unitSystem: UnitSystemValue;
};

function ProfileSheet({ visible, onClose, unitSystem }: ProfileSheetProps) {
  const { profile, updateProfile } = useSettingsData();
  const { latest: latestWeight, addEntry: addWeightEntry } = useBodyWeightData();

  const [name, setName] = useState(profile.name ?? '');
  const [gender, setGender] = useState<Gender | null>(profile.gender);
  const [heightCmInput, setHeightCmInput] = useState(
    profile.heightCm != null ? String(Math.round(profile.heightCm * 10) / 10) : '',
  );
  const [weightInput, setWeightInput] = useState('');

  // Re-seed when the sheet opens so the values reflect the latest store
  // state. Avoids the stale-form-on-reopen bug.
  useEffect(() => {
    if (!visible) return;
    setName(profile.name ?? '');
    setGender(profile.gender);
    setHeightCmInput(
      profile.heightCm != null ? String(Math.round(profile.heightCm * 10) / 10) : '',
    );
    if (latestWeight) {
      const display = fromLb(latestWeight.weight, unitSystem);
      setWeightInput(unitSystem === UnitSystem.METRIC ? display.toFixed(1) : String(Math.round(display)));
    } else {
      setWeightInput('');
    }
  }, [visible, profile, latestWeight, unitSystem]);

  const handleSave = () => {
    const trimmedName = name.trim();
    const heightCm = (() => {
      const n = parseFloat(heightCmInput);
      if (!isFinite(n) || n < 50 || n > 260) return profile.heightCm;
      return Math.round(n * 10) / 10;
    })();
    updateProfile({
      name: trimmedName.length ? trimmedName.slice(0, 40) : null,
      heightCm,
      gender,
    });
    const w = parseFloat(weightInput);
    if (isFinite(w) && w > 0) {
      const lb = toLb(w, unitSystem);
      const rounded = Math.round(lb * 10) / 10;
      // Avoid duplicating the most recent entry if the user opened the
      // sheet, made no weight change, and tapped Save.
      if (!latestWeight || Math.abs(latestWeight.weight - rounded) > 0.05) {
        addWeightEntry(rounded, 'lb');
      }
    }
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <SheetHeader eyebrow="PROFILE" title="Edit profile" onClose={onClose} />
      <View style={profileStyles.body}>
        <View style={profileStyles.field}>
          <Text style={profileStyles.label}>NAME</Text>
          <TextInput
            style={profileStyles.input}
            value={name}
            onChangeText={t => setName(t.slice(0, 40))}
            placeholder="Your name"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            autoCorrect={false}
            selectionColor={colors.success}
          />
        </View>
        <View style={profileStyles.field}>
          <Text style={profileStyles.label}>GENDER</Text>
          <SegmentedControl<Gender>
            value={(gender ?? '__none__') as Gender}
            options={GENDER_OPTIONS}
            onChange={setGender}
          />
        </View>
        <View style={profileStyles.field}>
          <Text style={profileStyles.label}>HEIGHT (CM)</Text>
          <TextInput
            style={[profileStyles.input, profileStyles.inputNumber]}
            value={heightCmInput}
            onChangeText={t => setHeightCmInput(t.replace(/[^0-9.]/g, '').slice(0, 5))}
            placeholder="178"
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            selectionColor={colors.success}
          />
        </View>
        <View style={profileStyles.field}>
          <Text style={profileStyles.label}>
            BODY WEIGHT ({unitSystem === UnitSystem.METRIC ? 'KG' : 'LB'})
          </Text>
          <TextInput
            style={[profileStyles.input, profileStyles.inputNumber]}
            value={weightInput}
            onChangeText={t => setWeightInput(t.replace(/[^0-9.]/g, '').slice(0, 6))}
            placeholder={unitSystem === UnitSystem.METRIC ? '75.0' : '170'}
            placeholderTextColor={colors.textTertiary}
            keyboardType="decimal-pad"
            selectionColor={colors.success}
          />
          <Text style={profileStyles.helper}>
            Logs a new entry only if it differs from your most recent reading.
          </Text>
        </View>

        <Button label="Save" onPress={handleSave} color={colors.success} style={profileStyles.cta} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  headerWrap: { paddingHorizontal: spacing.lg },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
});

const profileStyles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  field: { gap: spacing.xs },
  label: { ...(text.eyebrow as TextStyle), color: colors.textTertiary },
  input: {
    ...surfaces.row,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: fontSize.body,
    color: colors.text,
    fontFamily: fonts.sans,
  },
  inputNumber: { fontFamily: fonts.mono },
  helper: {
    ...(text.monoCaption as TextStyle),
    color: colors.textTertiary,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  cta: { height: 52, marginTop: spacing.xs, borderRadius: radius.xl },
});
