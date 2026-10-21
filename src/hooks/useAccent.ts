import { Colors } from '@/constants/theme';
import { useEffectiveColorScheme } from '@/hooks/useColorSchemePreference';

/** Brand accent for icons, switches and highlights. Navy in light mode, a lighter
 * blue in dark mode so it stays visible on dark surfaces. */
export function useAccent() {
  const scheme = useEffectiveColorScheme();
  return Colors[scheme];
}
