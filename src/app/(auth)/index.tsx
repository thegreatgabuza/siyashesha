import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import LandingPage from '@/components/web/LandingPage';

/** Public root for signed-out visitors: marketing site on web, straight to sign-in on native. */
export default function AuthIndex() {
  if (Platform.OS !== 'web') return <Redirect href="/sign-in" />;
  return <LandingPage />;
}
