export const Colors = {
  light: {
    ink: '#0B1E40',
    inkSoft: '#2A3B5C',
    inkMuted: '#5B6B8A',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceMuted: '#F1F4F9',
    border: '#E3E8F0',
    emergency: '#DC2626',
    emergencySoft: '#FDECEC',
    success: '#0D9488',
    successSoft: '#E7F7F3',
    tabBarBg: '#0B1E40',
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
  },
} as const;

export type ThemeMode = keyof typeof Colors;

export const Gradients = {
  heroLight: ['#EDE9FB', '#DCE6FB', '#F8FAFC'],
  heroDark: ['#1B1440', '#141A33', '#0B1024'],
  emergency: ['#DC2626', '#B91C1C'],
  success: ['#0D9488', '#0B7A70'],
  cardLight: ['#FFFFFF', '#F3F0FD'],
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
  line: '#6D5BD0',
  fillFrom: 'rgba(109,91,208,0.35)',
  fillTo: 'rgba(109,91,208,0.02)',
  point: '#0B1E40',
  grid: '#E3E8F0',
};
