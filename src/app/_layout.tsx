import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/global.css';
import { ToastProvider } from '@/components/ui/Toast';
import { useSyncColorScheme } from '@/hooks/useColorSchemePreference';
import { getNotifications } from '@/lib/notify';
import { syncReminders } from '@/lib/reminders';
import { useAppStore } from '@/store/useAppStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  useSyncColorScheme();

  // Keep scheduled reminders in step with the saved settings on every launch.
  useEffect(() => {
    syncReminders().catch(() => {});
  }, []);

  // Listen for notification taps to route directly to the target feature.
  useEffect(() => {
    const N = getNotifications();
    if (!N) return;
    const sub = N.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string; dayId?: string };
      if (data?.type === 'health_day' && data?.dayId) {
        router.push(`/calendar/${data.dayId}` as any);
      } else if (data?.type === 'appointment') {
        router.push('/calendar');
      } else if (data?.type === 'checkin') {
        router.push('/diary');
      }
    });
    return () => sub.remove();
  }, []);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    BebasNeue_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!hasCompletedOnboarding}>
              <Stack.Screen name="(onboarding)" />
            </Stack.Protected>
            <Stack.Protected guard={isSignedIn}>
              <Stack.Screen name="(tabs)" />
            </Stack.Protected>
            <Stack.Protected guard={!isSignedIn}>
              <Stack.Screen name="(auth)" />
            </Stack.Protected>
          </Stack>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
