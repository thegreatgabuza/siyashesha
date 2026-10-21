export const Colors = {
  light: {
    ink: '#0B2559',
    inkSoft: '#2A3B5C',
    inkMuted: '#5B6478',
    background: '#F4F6FB',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F4F9',
    border: '#E3E8F0',
    emergency: '#DC1F26',
    emergencySoft: '#FDECEC',
    success: '#16A34A',
    successSoft: '#E9F7EE',
    tabBarBg: '#0B2559',
    accent: '#0B2559',
    accentSoft: '#A9BCD8',
  },
  dark: {
    ink: '#F4F6FB',
    inkSoft: '#D4DAE8',
    inkMuted: '#8C98B8',
    background: '#0B1024',
    surface: '#17203A',
    surfaceMuted: '#1D2742',
    border: '#283456',
    emergency: '#F87171',
    emergencySoft: '#3A1A1E',
    success: '#2DD4BF',
    successSoft: '#123A35',
    tabBarBg: '#060A18',
    accent: '#8FB0DA',
    accentSoft: '#3B5378',
  },
} as const;

export type ThemeMode = keyof typeof Colors;

export const Gradients = {
  heroLight: ['#E6EBF4', '#C5D0E3', '#F4F6FB'],
  heroDark: ['#0E2A56', '#0A1A38', '#0B1024'],
  emergency: ['#DC1F26', '#B3181E'],
  success: ['#16A34A', '#15803D'],
  cardLight: ['#FFFFFF', '#F4F6FB'],
  cardDark: ['#1C2545', '#141B33'],
} as const;

export const Radii = {
  sm: 14,
  md: 20,
  lg: 24,
  xl: 28,
  pill: 999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const ChartColors = {
  line: '#3F5A8A',
  fillFrom: 'rgba(11,37,89,0.35)',
  fillTo: 'rgba(11,37,89,0.02)',
  point: '#0B2559',
  grid: '#E3E8F0',
};
