import { Stack } from 'expo-router';

/** Public marketing and legal pages. Always reachable, signed in or not. */
export default function SiteLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }} />;
}
