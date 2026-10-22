import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';

let loaded: typeof NotificationsModule | null | undefined;

/**
 * Loads expo-notifications on demand.
 * Expo Go (the store client) cannot load its native module on Android, so it is never loaded there.
 * Returns null when notifications are unavailable.
 */
export function getNotifications(): typeof NotificationsModule | null {
  if (loaded !== undefined) return loaded;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    loaded = null;
    return loaded;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate: load only when the native module exists
    loaded = require('expo-notifications') as typeof NotificationsModule;
  } catch {
    loaded = null;
  }
  return loaded;
}
