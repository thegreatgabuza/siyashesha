import { Redirect } from 'expo-router';

import { LandingPage } from '@/components/web/LandingPage';
import { useAppStore } from '@/store/useAppStore';

/**
 * Public marketing root on web (siyashesha.co.za / localhost).
 *
 * Web behavior:
 * 1. Logged-in & onboarded patient visiting root -> redirect to app dashboard.
 * 2. Unauthenticated visitor -> render marketing landing page with hero, features, and pricing.
 */
export default function WebRootIndex() {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  if (isSignedIn && hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return <LandingPage />;
}
