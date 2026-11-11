import { Redirect } from 'expo-router';

import { useAppStore } from '@/store/useAppStore';

/**
 * Native mobile root entry (Android & iOS).
 *
 * Deterministically routes mobile launches based on patient state:
 * 1. Fresh install or un-onboarded user -> native mobile onboarding flow.
 * 2. Authenticated user who finished onboarding -> main app tabs.
 * 3. Returning user who is signed out -> native sign-in screen.
 */
export default function NativeRootIndex() {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

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
