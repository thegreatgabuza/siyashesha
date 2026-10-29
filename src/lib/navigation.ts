import { router } from 'expo-router';

/**
 * Safely navigates back if there is a previous screen in the navigation stack;
 * otherwise replaces with the provided fallback route so Expo Router never
 * dispatches an unhandled 'GO_BACK' action.
 */
export function safeBack(fallbackRoute: string = '/') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackRoute as any);
  }
}
