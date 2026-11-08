import { Redirect } from 'expo-router';

/** Public root on native for signed-out visitors: straight to sign-in. */
export default function AuthIndex() {
  return <Redirect href="/sign-in" />;
}
