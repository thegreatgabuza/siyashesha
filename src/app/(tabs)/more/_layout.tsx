import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function MoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="billing" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="emergency" />
      <Stack.Screen name="medications" />
      <Stack.Screen name="sharing" />
      <Stack.Screen name="timeline" />
      <Stack.Screen name="assistant" />
      <Stack.Screen name="language" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}
