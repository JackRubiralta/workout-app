import React, { type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '@/shared/theme';
import { Sheet } from './Sheet';
import { SheetHeader } from './SheetHeader';

export type DetailSheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  footer?: ReactNode;
  dismissable?: boolean;
  height?: string | number;
  children: ReactNode;
};

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
}: DetailSheetProps) {
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
