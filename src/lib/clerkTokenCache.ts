import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { TokenCache } from '@clerk/clerk-expo';

/**
 * Cross-platform and SSR-safe token cache for Clerk authentication.
 * Uses expo-secure-store on iOS & Android, and localStorage in browser environments.
 */
export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key);
        }
        return null;
      }
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn('[Clerk TokenCache] Error reading token:', err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn('[Clerk TokenCache] Error saving token:', err);
    }
  },
  async clearToken(key: string) {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn('[Clerk TokenCache] Error clearing token:', err);
    }
  },
};
