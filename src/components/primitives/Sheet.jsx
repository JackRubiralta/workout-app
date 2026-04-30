import React, { useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { colors, radius, spacing } from '../../theme';

// Bottom sheet with drag-to-dismiss handle.
//
// `height`: number (px) or percentage string (e.g. '90%'). On native iOS,
// percentage maxHeight on a flex parent doesn't compute reliably, so we
// resolve to a numeric pixel value via useWindowDimensions before applying.
//
// `flex`: when true, the panel is given a fixed `height` so flex:1 children
// (e.g. tabbed scroll views) can size themselves. When false (default), the
// panel sizes to content but is capped at maxHeight.

export function Sheet({ visible, onClose, children, height = '90%', flex = false, dismissable = true }) {
  const translate = useRef(new Animated.Value(0)).current;
  const { height: winHeight } = useWindowDimensions();

  const panelHeight = useMemo(() => {
    if (typeof height === 'number') return height;
    if (typeof height === 'string' && height.endsWith('%')) {
      return Math.round(winHeight * (parseFloat(height) / 100));
    }
    return Math.round(winHeight * 0.9);
  }, [height, winHeight]);

  useEffect(() => {
    if (visible) translate.setValue(0);
  }, [visible, translate]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => dismissable,
      onMoveShouldSetPanResponder: (_, g) => dismissable && g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translate.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          Animated.timing(translate, { toValue: 600, duration: 200, useNativeDriver: true })
            .start(() => onCloseRef.current?.());
        } else {
          Animated.spring(translate, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 5 }).start();
        }
      },
    }),
  ).current;

  const sizeStyle = flex ? { height: panelHeight } : { maxHeight: panelHeight };

  // No KeyboardAvoidingView: with a fixed-height panel, the soft keyboard
  // overlays the bottom and the inner ScrollView's
  // `automaticallyAdjustKeyboardInsets` (iOS) scrolls the focused input into
  // view. Lifting the whole panel was causing content above to clip and
  // disabling internal scroll.
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={dismissable ? onClose : undefined} />
        <Animated.View style={[styles.panel, sizeStyle, { transform: [{ translateY: translate }] }]}>
          <View {...pan.panHandlers} style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handleArea: { paddingTop: spacing.sm, paddingBottom: spacing.xs, alignItems: 'center' },
  handle: { width: 36, height: 4, borderRadius: radius.full, backgroundColor: colors.border },
});
