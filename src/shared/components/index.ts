// Public surface for the design-system primitives.
// Feature code pulls any primitive from a single path:
//
//   import { Button, Sheet, ScreenHeader } from '@/shared/components';
//
// Icons are NOT re-exported here — they're per-icon SVG components and
// consumers import them directly from '@/shared/components/icons' so
// tree-shaking stays granular.
export { Button, IconButton } from './Button';
export type { ButtonProps, ButtonVariant, IconButtonProps, IconButtonVariant } from './Button';
export { Chip } from './Chip';
export type { ChipProps, ChipVariant } from './Chip';
export { DetailHeader } from './DetailHeader';
export type { DetailHeaderProps } from './DetailHeader';
export { DragList } from './DragList';
export type { DragListProps, DragListRenderInfo } from './DragList';
export { DetailSheet } from './DetailSheet';
export type { DetailSheetProps } from './DetailSheet';
export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';
export { LoadingState, PulseDots } from './LoadingState';
export type { LoadingStateProps } from './LoadingState';
export { NumberedListRow, NumberedBadge } from './NumberedListRow';
export type {
  NumberedBadgeProps,
  NumberedBadgeSize,
  NumberedBadgeVariant,
  NumberedListRowProps,
  NumberedNameStyle,
} from './NumberedListRow';
export { ScreenHeader } from './ScreenHeader';
export type { ScreenHeaderProps } from './ScreenHeader';
export { KeyboardAwareSheetScroll } from './KeyboardAwareSheetScroll';
export type { KeyboardAwareSheetScrollProps } from './KeyboardAwareSheetScroll';
export { ScrollPicker } from './ScrollPicker';
export type { ScrollPickerProps } from './ScrollPicker';
export { SectionLabel } from './SectionLabel';
export type { SectionLabelProps } from './SectionLabel';
export { SegmentedControl } from './SegmentedControl';
export type { SegmentedControlProps, SegmentedOption } from './SegmentedControl';
export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';
export { SheetHeader } from './SheetHeader';
export type { SheetHeaderProps } from './SheetHeader';
export { FieldLabel, SheetInput } from './SheetInput';
export type { FieldLabelProps, SheetInputProps } from './SheetInput';
export { Sparkline } from './Sparkline';
export type { SparklineProps, SparklinePoint } from './Sparkline';
export { StatCard } from './StatCard';
export type { StatCardProps } from './StatCard';
export { StatusPill } from './StatusPill';
export type { StatusPillProps } from './StatusPill';
export { Stepper } from './Stepper';
export type { StepperProps } from './Stepper';
export { Toggle } from './Toggle';
export type { ToggleProps } from './Toggle';
export { TrendChip } from './TrendChip';
export type { TrendChipProps } from './TrendChip';
export { BarChart } from './BarChart';
export type { BarChartProps, BarChartBar } from './BarChart';
