import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

/**
 * Intercepts the Android hardware back button / back gesture when an overlay,
 * modal, or active edit state is open, invoking `onBack` and consuming the event
 * so the app does not unexpectedly navigate away or close.
 */
export function useHardwareBack(active: boolean, onBack: () => void | boolean) {
  useEffect(() => {
    if (Platform.OS !== 'android' || !active) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const result = onBack();
      // If handler returns false, propagate; otherwise default to consuming the event
      return result === false ? false : true;
    });

    return () => subscription.remove();
  }, [active, onBack]);
}
