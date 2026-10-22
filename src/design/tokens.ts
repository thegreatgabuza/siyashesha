import { Platform, type TextStyle } from 'react-native';
import type { WithSpringConfig } from 'react-native-reanimated';

/**
 * Siyashesha design tokens. The single source of truth for colour, type, spacing, radii,
 * elevation and motion. Navy is the anchor, red is the one accent (emergency and safety only),
 * green means complete or healthy and nothing else.
 */

/** Navy scale, anchored on the logo navy (500) with the deep hero surface at 800. */
export const navy = {
  50: '#F4F6FB',
  100: '#E6EBF4',
  200: '#C5D0E3',
  300: '#8FA0C2',
  400: '#3F5A8A',
  500: '#0B2559',
  600: '#0A2150',
  700: '#0B1E40',
  800: '#081733',
  900: '#050F24',
} as const;

export const red = {
  50: '#FDECEC',
  100: '#FBD5D5',
  500: '#DC1F26',
  600: '#B3181E',
} as const;

export const green = {
  50: '#E9F7EE',
  500: '#16A34A',
  600: '#15803D',
} as const;

export const slate = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
} as const;

export interface Palette {
  canvas: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  hairline: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnNavy: string;
  textOnNavyMuted: string;
  hero: string;
  heroDeep: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  success: string;
  successSoft: string;
  successText: string;
  interactive: string;
  interactiveSoft: string;
  glassTint: string;
  scrim: string;
}

export const palette: Record<'light' | 'dark', Palette> = {
  light: {
    canvas: slate[50],
    surface: '#FFFFFF',
    surfaceMuted: slate[100],
    border: slate[200],
    hairline: 'rgba(11,37,89,0.08)',
    text: navy[500],
    textSecondary: '#2A3B5C',
    textMuted: '#5B6478', // 6:1 on canvas
    textOnNavy: '#FFFFFF',
    textOnNavyMuted: 'rgba(255,255,255,0.72)',
    hero: navy[700],
    heroDeep: navy[900],
    accent: red[500],
    accentSoft: red[50],
    accentText: red[600], // AA on white for small text
    success: green[500],
    successSoft: green[50],
    successText: green[600],
    interactive: navy[500],
    interactiveSoft: navy[100],
    glassTint: 'rgba(255,255,255,0.72)',
    scrim: 'rgba(5,15,36,0.45)',
  },
  dark: {
    canvas: '#0B1024',
    surface: '#151D36',
    surfaceMuted: '#1B2442',
    border: '#26304F',
    hairline: 'rgba(255,255,255,0.08)',
    text: '#F4F6FB',
    textSecondary: '#D4DAE8',
    textMuted: '#9AA6C4',
    textOnNavy: '#FFFFFF',
    textOnNavyMuted: 'rgba(255,255,255,0.72)',
    hero: '#13275A',
    heroDeep: '#0A1736',
    accent: '#F05A5F',
    accentSoft: 'rgba(240,90,95,0.16)',
    accentText: '#FF8A8E',
    success: '#34D399',
    successSoft: 'rgba(52,211,153,0.14)',
    successText: '#6EE7B7',
    interactive: '#B9C8E6',
    interactiveSoft: 'rgba(143,160,194,0.18)',
    glassTint: 'rgba(21,29,54,0.72)',
    scrim: 'rgba(0,0,0,0.55)',
  },
};

/** Brand gradients. The passport surface runs deep navy to logo navy. */
export const gradients = {
  passport: [navy[800], navy[700], navy[500]] as const,
  passportDark: ['#0A1736', '#102452', '#1A3570'] as const,
  sheen: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.16)', 'rgba(255,255,255,0)'] as const,
  emergency: [red[500], red[600]] as const,
};

/** Category tints for record thumbnails. Drawn only from navy, slate, red and green. */
export const categoryTints = {
  navy: { ink: navy[500], paper: navy[50], band: navy[100] },
  steel: { ink: navy[400], paper: '#EEF2F8', band: '#DCE4F0' },
  slate: { ink: '#2A3B5C', paper: slate[100], band: slate[200] },
  red: { ink: red[500], paper: '#FFF6F6', band: red[50] },
  green: { ink: green[600], paper: '#F3FBF6', band: green[50] },
} as const;
export type CategoryTint = keyof typeof categoryTints;

const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  display: 'BebasNeue_400Regular',
} as const;
export const fonts = font;

/**
 * Type scale. Every style keeps system font scaling on; layouts flex rather than clamp, so long
 * isiZulu, Afrikaans and Setswana strings wrap instead of truncating.
 */
export const type = {
  display: { fontFamily: font.bold, fontSize: 40, lineHeight: 44, letterSpacing: -1 },
  title: { fontFamily: font.bold, fontSize: 28, lineHeight: 33, letterSpacing: -0.6 },
  headline: { fontFamily: font.bold, fontSize: 20, lineHeight: 26, letterSpacing: -0.3 },
  bodyStrong: { fontFamily: font.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 22 },
  callout: { fontFamily: font.medium, fontSize: 14, lineHeight: 20 },
  footnote: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: font.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 1.2, textTransform: 'uppercase' },
  number: { fontFamily: font.bold, fontSize: 34, lineHeight: 38, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 15,
    letterSpacing: 2.4,
  },
} satisfies Record<string, TextStyle>;

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40, huge: 56 } as const;

export const radii = { xs: 10, sm: 14, md: 20, lg: 24, xl: 28, pill: 999 } as const;

/** Minimum touch target. */
export const touch = 48;

/** Soft, navy-tinted shadows. */
export const elevation = {
  1: { shadowColor: navy[500], shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  2: { shadowColor: navy[500], shadowOpacity: 0.09, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  3: { shadowColor: navy[800], shadowOpacity: 0.28, shadowRadius: 28, shadowOffset: { width: 0, height: 14 }, elevation: 10 },
} as const;

/** Spring presets. Snappy for presses, bouncy for entrances and flips, gentle for layout. */
export const springs = {
  snappy: { damping: 18, stiffness: 320, mass: 0.6 },
  bouncy: { damping: 13, stiffness: 170, mass: 0.9 },
  gentle: { damping: 22, stiffness: 140, mass: 1 },
  flip: { damping: 16, stiffness: 120, mass: 1 },
} satisfies Record<string, WithSpringConfig>;

export const motion = {
  /** Delay between staggered entrances. */
  stagger: 45,
  /** Press-in scale for tappable surfaces. */
  pressScale: 0.97,
  sheenLoopMs: 7000,
} as const;
