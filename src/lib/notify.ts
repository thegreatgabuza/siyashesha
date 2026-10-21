import type * as NotificationsModule from 'expo-notifications';

let loaded: typeof NotificationsModule | null | undefined;

/**
 * Loads expo-notifications on demand. Some builds (Expo Go on Android) do not include its native module,
 * and importing it at the top of a file would crash the whole app. Returns null when it is unavailable.
 */
export function getNotifications(): typeof NotificationsModule | null {
  if (loaded !== undefined) return loaded;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate: load only when the native module exists
    loaded = require('expo-notifications') as typeof NotificationsModule;
  } catch {
    loaded = null;
  }
  return loaded;
}
