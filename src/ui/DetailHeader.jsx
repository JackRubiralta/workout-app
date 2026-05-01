import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import { IconButton } from './Button';
import { ChevronLeft } from '../../shell/icons';

/**
 * Top chrome row for detail screens (DayPreStart, SessionDetail,
 * FoodItemDetail). Back chevron on the left, optional `center` slot,
 * optional `right` slot (delete icon, edit pill, etc.).
 *
 * @param {object} props
 * @param {() => void} props.onBack - Tap handler for the back chevron.
 * @param {React.ReactNode} [props.center] - Slot between the back chevron and the right action — typically a small badge (day dot, focus tag).
 * @param {React.ReactNode} [props.right] - Slot for the right-side action (delete icon, edit pill).
 *
 * @example
 *   <DetailHeader
 *     onBack={() => navigation.goBack()}
 *     right={<IconButton variant="danger" onPress={handleDelete}><TrashIcon ... /></IconButton>}
 *   />
 */
export function DetailHeader({ onBack, center, right }) {
  return (
    <View style={styles.row}>
      <IconButton onPress={onBack}>
        <ChevronLeft color={colors.text} size={20} />
      </IconButton>
      <View style={styles.center}>{center}</View>
      <View>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
