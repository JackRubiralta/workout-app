// Reusable keyboard-aware ScrollView for forms that live inside our `<Sheet>`
// (and any other long form where inputs near the bottom would otherwise be
// covered by the iOS keyboard).
//
// Wraps `KeyboardAwareScrollView` from `react-native-keyboard-controller`,
// whose native iOS observer follows the first-responder across UIWindows —
// so it works inside RN's `<Modal>` (which our Sheet uses) where RN's own
// `automaticallyAdjustKeyboardInsets` is unreliable.
//
// Defaults set here:
//   • `bottomOffset` — comfortable space between focused input and keyboard
//   • `keyboardShouldPersistTaps="handled"` — don't dismiss on a tap that
//     lands on a control (e.g. the day-color swatches in DayEditSheet)
//   • `keyboardDismissMode="on-drag"` — pull-down dismiss feels native
//
// Callers pass `contentContainerStyle` for their own padding; we preserve
// it as-is. Anything ScrollView accepts works because KAS forwards it.

import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from 'react-native-keyboard-controller';
import { spacing } from '@/shared/theme';

export type KeyboardAwareSheetScrollProps = KeyboardAwareScrollViewProps;

// 24pt of breathing room between the bottom of the focused input and the
// top of the keyboard. Matches `spacing.lg` so the gap reads as a regular
// section break rather than a hard touch.
const DEFAULT_BOTTOM_OFFSET = spacing.lg;

export const KeyboardAwareSheetScroll = forwardRef<
  React.ComponentRef<typeof KeyboardAwareScrollView>,
  KeyboardAwareSheetScrollProps
>(function KeyboardAwareSheetScroll(
  {
    bottomOffset = DEFAULT_BOTTOM_OFFSET,
    keyboardShouldPersistTaps = 'handled',
    keyboardDismissMode = 'on-drag',
    showsVerticalScrollIndicator = false,
    style,
    ...rest
  },
  ref,
) {
  return (
    <KeyboardAwareScrollView
      ref={ref}
      bottomOffset={bottomOffset}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      keyboardDismissMode={keyboardDismissMode}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      style={[styles.flex, style]}
      {...rest}
    />
  );
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
