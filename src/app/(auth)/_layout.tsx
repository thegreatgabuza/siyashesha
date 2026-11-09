import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export const unstable_settings = {
  anchor: Platform.OS === 'web' ? 'index' : 'sign-in',
};

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {Platform.OS === 'web' ? (
        <>
          <Stack.Screen name="index" />
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="otp" />
          <Stack.Screen name="two-factor" />
          <Stack.Screen name="doctor-signup" />
        </>
      ) : (
        <>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="otp" />
          <Stack.Screen name="two-factor" />
          <Stack.Screen name="doctor-signup" />
          <Stack.Screen name="index" />
        </>
      )}
    </Stack>
  );
}

