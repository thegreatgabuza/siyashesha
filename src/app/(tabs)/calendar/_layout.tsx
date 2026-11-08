import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

export default function CalendarLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[day]" />
    </Stack>
  );
}
