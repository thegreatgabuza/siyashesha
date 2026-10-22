import { useEffect } from 'react';
import { Platform } from 'react-native';
import { colorScheme as nativewindColorScheme, useColorScheme as useNativewindColorScheme } from 'nativewind';

import { useAppStore } from '@/store/useAppStore';

/** Keeps NativeWind's `dark:` variants (and the native Appearance API) in sync with the
 * user's stored theme preference. Mount once near the root of the app. */
export function useSyncColorScheme() {
  const preference = useAppStore((s) => s.themePreference);
  useEffect(() => {
    nativewindColorScheme.set(preference);
  }, [preference]);
}

/** The scheme NativeWind is actually rendering, so token colours always match the `dark:` classes. */
export function useEffectiveColorScheme(): 'light' | 'dark' {
  const { colorScheme } = useNativewindColorScheme();
  // On web the `dark:` classes only apply when the root element carries the `dark` class.
  if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.documentElement.classList.contains('dark')) return 'light';
  return colorScheme === 'dark' ? 'dark' : 'light';
}
