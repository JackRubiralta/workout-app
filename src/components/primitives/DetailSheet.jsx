import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme';
import { Sheet } from './Sheet';
import { SheetHeader } from './SheetHeader';

/**
 * Convenience wrapper around `<Sheet>` + `<SheetHeader>` for the most
 * common form-style sheet (title at the top, scrollable body, sticky
 * footer). Removes ~10 lines of boilerplate from every consumer and
 * guarantees the chrome stays uniform.
 *
 *   <DetailSheet visible={open} onClose={close} title="Daily Goals" footer={<SaveButton />}>
 *     <ScrollView style={{ flex: 1 }}>...</ScrollView>
 *   </DetailSheet>
 *
 * For sheets that need finer control (custom header layout, no flex
 * sizing, no footer slot), drop down to `<Sheet>` directly.
 *
 * @param {object} props
 * @param {boolean} props.visible
 * @param {() => void} props.onClose
 * @param {string} props.title - Header title.
 * @param {string} [props.eyebrow] - Small uppercase line above the title.
 * @param {React.ReactNode} [props.headerLeft] - Slot before the title (e.g. a coloured day dot).
 * @param {React.ReactNode} [props.headerRight] - Slot between the title and the close button.
 * @param {React.ReactNode} [props.footer] - Sticky footer pinned below the scrollable body. Render any layout (Save button, Save+Delete row, etc.).
 * @param {boolean} [props.dismissable=true] - Whether the backdrop tap and drag handle close the sheet.
 * @param {string|number} [props.height='92%'] - Override panel height.
 * @param {React.ReactNode} props.children - The sheet body. Typically a `<ScrollView style={{ flex: 1 }}>`.
 */
export function DetailSheet({
  visible,
  onClose,
  title,
  eyebrow,
  headerLeft,
  headerRight,
  footer,
  dismissable = true,
  height = '92%',
  children,
}) {
  return (
    <Sheet visible={visible} onClose={onClose} flex height={height} dismissable={dismissable}>
      <SheetHeader
        eyebrow={eyebrow}
        title={title}
        left={headerLeft}
        right={headerRight}
        onClose={onClose}
      />
      <View style={styles.body}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
