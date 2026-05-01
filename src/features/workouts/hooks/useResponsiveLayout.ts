import { useWindowDimensions } from 'react-native';

export type ResponsiveLayout = {
  timerSize: number;
  nameFontSize: number;
  isSmall: boolean;
  mainContentMinHeight: number;
};

/**
 * Layout-derived sizing for the active-session stage. Pulled into a hook so
 * the screen reads cleanly. `timerSize` keeps the circle visible on small
 * phones; `nameFontSize` shrinks the exercise hero on shorter viewports.
 */
export function useResponsiveLayout(): ResponsiveLayout {
  const { height } = useWindowDimensions();
  const timerSize = Math.round(Math.min(180, height * 0.22));
  const nameFontSize = Math.round(Math.min(34, height * 0.046));
  const isSmall = height < 700;
  const mainContentMinHeight = timerSize + (isSmall ? 80 : 110);
  return { timerSize, nameFontSize, isSmall, mainContentMinHeight };
}
