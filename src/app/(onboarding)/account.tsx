import { Redirect } from 'expo-router';

/**
 * Legacy account step now redirects cleanly to the post-onboarding paywall
 * so there are never non-functional placeholder buttons during App Store review.
 */
export default function AccountScreen() {
  return <Redirect href={'/(onboarding)/paywall' as any} />;
}
