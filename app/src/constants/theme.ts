import { vars } from 'nativewind';
import { Platform } from 'react-native';

const lightColors = {
  background1: '#0A1529',
  background2: '#FFFFFF',
  background3: '#F4F7FB',
  foreground: '#FF6E32',
  foregroundStrong: '#D95420',
  text: '#FFFFFF',
  textOnBackground2: '#0A1529',
  textSecondary: '#D3DCEB',
  muted: '#D3DCEB',
  border: '#D9E2EF',
  backgroundSelected: '#E7EDF5',
  success: '#2E9B6F',
  warning: '#D99100',
  danger: '#D64545',
  info: '#3C87F7',
} as const;

const darkColors = {
  background1: '#060D1A',
  background2: '#111D31',
  background3: '#192842',
  foreground: '#FF8F68',
  foregroundStrong: '#FFB099',
  text: '#F7FAFF',
  textOnBackground2: '#F7FAFF',
  textSecondary: '#B8C4D6',
  muted: '#B8C4D6',
  border: '#2A3B58',
  backgroundSelected: '#1D304D',
  success: '#66D19E',
  warning: '#F3B95F',
  danger: '#FF7979',
  info: '#78ABFF',
} as const;

export const Colors = {
  light: {
    ...lightColors,
    background: lightColors.background1,
    backgroundElement: lightColors.background3,
  },
  dark: {
    ...darkColors,
    background: darkColors.background1,
    backgroundElement: darkColors.background3,
  },
} as const;

const toThemeVars = (colors: Record<keyof typeof lightColors, string>) =>
  vars({
    '--color-background1': colors.background1,
    '--color-background2': colors.background2,
    '--color-background3': colors.background3,
    '--color-foreground': colors.foreground,
    '--color-foreground-strong': colors.foregroundStrong,
    '--color-text': colors.text,
    '--color-textOnBackground2': colors.textOnBackground2,
    '--color-backgroundSelected': colors.backgroundSelected,
    '--color-text-secondary': colors.textSecondary,
    '--color-muted': colors.muted,
    '--color-border': colors.border,
    '--color-success': colors.success,
    '--color-warning': colors.warning,
    '--color-danger': colors.danger,
    '--color-info': colors.info,
  });

export const Theme = {
  light: toThemeVars(lightColors),
  dark: toThemeVars(darkColors),
};

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
