import { Colors } from './theme';

/**
 * Records screen tokens. They come from the brand palette in theme.ts, so the Records screen matches
 * the rest of the app: navy for primary text and actions, red only for emergency and deletion,
 * and a light grey-blue background.
 */
const light = Colors.light;

export const RecordsTokens = {
  background: '#F8FAFC', // cool-slate page background
  surface: '#FFFFFF',
  border: light.border, // #E3E8F0
  text: light.ink, // #0B2559 navy headings and primary text
  textMuted: light.inkMuted, // #5B6478, about 6:1 on the background
  accent: light.ink, // primary actions and active chips
  accentSoft: '#E6EBF4', // brand-100
  track: light.border,
  success: '#16A34A',
  successText: '#15803D', // darker green so small text passes AA
  successSoft: light.successSoft,
  emergency: light.emergency, // #DC1F26
  emergencySoft: light.emergencySoft,
  radius: { card: 24, tile: 18, pill: 999 },
  shadow: {
    shadowColor: '#0B2559',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  type: {
    title: 28,
    cardTitle: 16,
    body: 14,
    meta: 13,
    tiny: 11,
  },
} as const;
