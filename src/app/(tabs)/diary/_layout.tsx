import { Redirect, Stack } from 'expo-router';

import { useAppStore } from '@/store/useAppStore';

export const unstable_settings = {
  anchor: 'index',
};

export default function DiaryLayout() {
  const userRole = useAppStore((s) => s.userRole);

  if (userRole === 'doctor') {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
