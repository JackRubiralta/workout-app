import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import { IconButton } from './Button';
import { ChevronLeft } from '../../shell/icons';

// Top chrome row for detail screens (DayPreStart, ActiveSession,
// SessionDetail, FoodItemDetail). Back chevron on the left, optional
// `center` slot, optional `right` slot (delete icon, edit pill, etc.).
//
//   <DetailHeader
//     onBack={() => navigation.goBack()}
//     right={<IconButton onPress={handleDelete}><TrashIcon ... /></IconButton>}
//   />
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
