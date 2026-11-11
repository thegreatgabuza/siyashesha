import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'sign-in',
  initialRouteName: 'sign-in',
};

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="two-factor" />
      <Stack.Screen name="doctor-signup" />
    </Stack>
  );
}

