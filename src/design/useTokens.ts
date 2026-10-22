import { useEffectiveColorScheme } from '@/hooks/useColorSchemePreference';
import { palette, type Palette } from './tokens';

/** The colour palette for the current light or dark scheme. */
export function useTokens(): Palette & { scheme: 'light' | 'dark' } {
  const scheme = useEffectiveColorScheme();
  return { ...palette[scheme], scheme };
}
