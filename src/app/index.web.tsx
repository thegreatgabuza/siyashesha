import { Redirect } from 'expo-router';
import { useSyncExternalStore } from 'react';

import { LandingPage } from '@/components/web/LandingPage';
import { useAppStore } from '@/store/useAppStore';

const subscribeHydration = (onStoreChange: () => void) =>
  useAppStore.persist.onFinishHydration(onStoreChange);
const getHydratedSnapshot = () => useAppStore.persist.hasHydrated();

/**
 * Public marketing root on web (siyashesha.co.za / localhost).
 *
 * Web behavior:
 * 1. After persisted store hydration, logged-in & onboarded users -> redirect to app dashboard.
 * 2. Unauthenticated visitor or SSR -> render marketing landing page with hero, features, and pricing.
 */
export default function WebRootIndex() {
  const hydrated = useSyncExternalStore(subscribeHydration, getHydratedSnapshot, () => false);
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  if (hydrated && isSignedIn && hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return <LandingPage />;
}
