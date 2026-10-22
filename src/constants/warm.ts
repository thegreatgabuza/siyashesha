/**
 * Warm design tokens: off-white background, soft white cards, one warm accent, charcoal text.
 * Used by the Records screen and available to any screen that wants the same style.
 * The navy and red brand palette in theme.ts is unchanged.
 */
export const Warm = {
  background: '#F7F3EC',
  surface: '#FFFFFF',
  border: '#EAE4D9',
  text: '#1F2328', // primary text and the bottom nav colour
  textMuted: '#6B6F76', // metadata, 4.6:1 on the background
  accent: '#B45309', // primary action and active states; white text passes AA
  accentSoft: '#FCEFDF',
  track: '#EFE9DE',
  radius: { card: 24, tile: 18, pill: 999 },
  shadow: {
    shadowColor: '#1F2328',
    shadowOpacity: 0.06,
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
