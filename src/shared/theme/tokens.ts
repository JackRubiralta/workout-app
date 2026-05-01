import { Platform, type ViewStyle } from 'react-native';

export const palette = {
  black: '#0A0A0A',
  near: '#141414',
  raise: '#1C1C1C',
  raiseHi: '#242424',
  hairline: '#1E1E1E',
  border: '#2A2A2A',
  white: '#FFFFFF',
  gray1: '#EBEBF5',
  gray2: '#8E8E93',
  gray3: '#636366',
  gray4: '#48484A',
  green: '#32D74B',
  red: '#FF453A',
  amber: '#FFA726',
} as const;

export const colors = {
  background: '#0B0B0E',
  surface: '#15161A',
  surfaceElevated: '#1C1E24',
  surfaceHigh: '#252830',
  hairline: '#1E2026',
  border: '#2A2D35',
  borderStrong: '#3A3F4A',

  text: '#F5F5F7',
  textSecondary: '#9AA0A6',
  textTertiary: '#6B7280',
  textMuted: '#4A4F5A',

  success: palette.green,
  successBg: 'rgba(50, 215, 75, 0.12)',
  danger: palette.red,
  dangerBg: 'rgba(255, 69, 58, 0.12)',
  warning: palette.amber,

  timerTrack: palette.raiseHi,
  overlay: 'rgba(0,0,0,0.6)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export const fonts = {
  mono: Platform.select({ ios: 'Courier New', android: 'monospace' }) as string,
  serif: Platform.select({ ios: 'Georgia', android: 'serif' }) as string,
  sans: Platform.select({ ios: 'System', android: 'sans-serif' }) as string,
} as const;

export const fontSize = {
  largeTitle: 34,
  title1: 28,
  title2: 22,
  title3: 20,
  headline: 17,
  body: 17,
  callout: 16,
  subhead: 15,
  footnote: 13,
  caption: 12,
  micro: 10,
} as const;

type ShadowStyle = ViewStyle;

export const shadow = {
  sm: Platform.select<ShadowStyle>({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 8 },
    android: { elevation: 2 },
    default: { boxShadow: '0 2px 8px rgba(0,0,0,0.35)' as unknown as string },
  }) as ShadowStyle,
  md: Platform.select<ShadowStyle>({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 16 },
    android: { elevation: 6 },
    default: { boxShadow: '0 6px 16px rgba(0,0,0,0.4)' as unknown as string },
  }) as ShadowStyle,
  lg: Platform.select<ShadowStyle>({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.5, shadowRadius: 24 },
    android: { elevation: 12 },
    default: { boxShadow: '0 12px 24px rgba(0,0,0,0.5)' as unknown as string },
  }) as ShadowStyle,
  glow: (hex: string, intensity = 0.55): ShadowStyle =>
    Platform.select<ShadowStyle>({
      ios: { shadowColor: hex, shadowOffset: { width: 0, height: 6 }, shadowOpacity: intensity, shadowRadius: 18 },
      android: { elevation: 10 },
      default: { boxShadow: `0 6px 20px ${hex}55` as unknown as string },
    }) as ShadowStyle,
} as const;

export const layout = {
  tabBarClearance: 88,
  sectionIndent: 2,
} as const;

export const dayPalette = ['#FF4757', '#3742FA', '#2ED573', '#FFA502', '#A55EEA', '#00B894', '#FF7675', '#74B9FF'] as const;

export const macroColors = {
  calories: '#FF4757',
  protein: '#3742FA',
  carbs: '#FFA502',
  fat: '#A55EEA',
  fiber: '#26C6DA',
} as const;
