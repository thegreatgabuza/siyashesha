import { StatusBar } from 'expo-status-bar';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { ClerkProvider } from '@clerk/clerk-expo';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/global.css';
import { BiometricGate } from '@/components/security/BiometricGate';
import { ToastProvider } from '@/components/ui/Toast';
import { useEffectiveColorScheme, useSyncColorScheme } from '@/hooks/useColorSchemePreference';
import { tokenCache } from '@/lib/clerkTokenCache';
import { todayKey } from '@/lib/date';
import { getNotifications } from '@/lib/notify';
import { snoozeReminder, syncReminders } from '@/lib/reminders';
import { useAppStore } from '@/store/useAppStore';

const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isSignedIn = useAppStore((s) => s.isSignedIn);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);
  const colorScheme = useEffectiveColorScheme();
  const isDark = colorScheme === 'dark';
  useSyncColorScheme();

  // Keep scheduled reminders in step with the saved settings on every launch.
  useEffect(() => {
    syncReminders().catch(() => {});
  }, []);

  // Listen for notification taps and interactive category actions (Spec §4.6 & §8.2)
  useEffect(() => {
    const N = getNotifications();
    if (!N) return;
    const sub = N.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data as {
        type?: string;
        dayId?: string;
        reminderId?: string;
        medicationName?: string;
        linkedNoteId?: string;
        noteId?: string;
      };

      // Interactive Action 1: Mark taken directly from notification banner/lockscreen
      if (actionId === 'take_dose' && data?.reminderId) {
        useAppStore.getState().toggleTaken(data.reminderId, todayKey());
        return;
      }

      // Interactive Action 2: Snooze 15 minutes
      if (actionId === 'snooze_dose') {
        const title = data?.medicationName ? `${data.medicationName} dose` : 'Medication dose';
        snoozeReminder(title, 15).catch(() => {});
        return;
      }

      // Interactive Action 3: View linked doctor consultation notes
      if (actionId === 'view_notes' || data?.type === 'diary_reminder') {
        router.push('/diary');
        return;
      }

      // Interactive Action 4: View calendar appointment
      if (actionId === 'view_calendar' || data?.type === 'appointment') {
        router.push('/calendar');
        return;
      }

      // Banner taps:
      if (data?.type === 'health_day' && data?.dayId) {
        router.push(`/calendar/${data.dayId}` as any);
        return;
      }

      if (data?.type === 'checkin') {
        router.push('/diary');
        return;
      }

      if (data?.type === 'medication_dose' || data?.type === 'missed_dose') {
        router.push('/(tabs)/more/notifications');
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

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ToastProvider>
          <BiometricGate>
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
          </BiometricGate>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  if (clerkPublishableKey) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
