// Barrel export for the design-system primitives. Feature code pulls any
// primitive from a single path:
//
//   import { Button, IconButton, Sheet, ScreenHeader } from '../../ui';
//
// Icons live in the same folder but are intentionally NOT re-exported here:
// they're a different shape (per-icon SVG components) and consumers import
// them directly from '../../ui/icons' so tree-shaking stays granular.
export { Button, IconButton } from './Button';
export { Chip } from './Chip';
export { DetailHeader } from './DetailHeader';
export { EmptyState } from './EmptyState';
export { ScreenHeader } from './ScreenHeader';
export { SectionLabel } from './SectionLabel';
export { Sheet } from './Sheet';
export { SheetHeader } from './SheetHeader';
export { SheetInput } from './SheetInput';
export { DetailSheet } from './DetailSheet';
export { ScrollPicker } from './ScrollPicker';
export { SegmentedControl } from './SegmentedControl';
export { Sparkline } from './Sparkline';
export { StatCard } from './StatCard';
export { StatusPill } from './StatusPill';
export { Stepper } from './Stepper';
export { TrendChip } from './TrendChip';
export { Toggle } from './Toggle';
export { BarChart } from './BarChart';
export { LoadingState } from './LoadingState';
export { NumberedListRow, NumberedBadge } from './NumberedListRow';
