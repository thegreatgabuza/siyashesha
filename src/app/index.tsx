import { Redirect } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAppStore } from '@/store/useAppStore';

const subscribeHydration = (onStoreChange: () => void) =>
  useAppStore.persist.onFinishHydration(onStoreChange);
const getHydratedSnapshot = () => useAppStore.persist.hasHydrated();

/**
 * Native mobile root entry (Android & iOS).
 *
 * Waits for persisted Zustand store hydration, then routes mobile launches:
 * 1. Fresh install or un-onboarded user -> native mobile onboarding flow.
 * 2. Authenticated user who finished onboarding -> main app tabs.
 * 3. Returning user who is signed out -> native sign-in screen.
 */
export default function NativeRootIndex() {
  const hydrated = useSyncExternalStore(subscribeHydration, getHydratedSnapshot, () => false);
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="small" color="#0B2559" />
      </View>
    );
  }

  // New installs / un-onboarded patients land directly in the native onboarding flow
  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  // Active authenticated patients access the health passport tabs
  if (isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  // Returning patients who signed out navigate to sign-in
  return <Redirect href="/(auth)/sign-in" />;
}
