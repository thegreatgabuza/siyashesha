import { useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { colorScheme as nativewindColorScheme } from 'nativewind';

import { useAppStore } from '@/store/useAppStore';

/** Keeps NativeWind's `dark:` variants (and the native Appearance API) in sync with the
 * user's stored theme preference. Mount once near the root of the app. */
export function useSyncColorScheme() {
  const preference = useAppStore((s) => s.themePreference);
  useEffect(() => {
    nativewindColorScheme.set(preference);
  }, [preference]);
}

export function useEffectiveColorScheme(): 'light' | 'dark' {
  const scheme = useRNColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}
