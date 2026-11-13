import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';

import { LandingPage } from '@/components/web/LandingPage';
import { useAppStore } from '@/store/useAppStore';

/**
 * Public marketing root on web (siyashesha.co.za / localhost).
 *
 * Web behavior:
 * 1. After persisted store hydration, logged-in & onboarded users -> redirect to app dashboard.
 * 2. Unauthenticated visitor or SSR -> render marketing landing page with hero, features, and pricing.
 */
export default function WebRootIndex() {
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    if (useAppStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAppStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  if (hydrated && isSignedIn && hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return <LandingPage />;
}
