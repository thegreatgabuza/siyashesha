import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { activeMedications } from '@/data/medications';
import { useAppStore } from '@/store/useAppStore';

const CHANNEL_ID = 'medication';

/**
 * Asks for notification permission if needed.
 * Returns true when reminders are allowed on this phone.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Makes the scheduled medication reminders match the settings.
 * Cancels everything first, then schedules one daily reminder per dose time for each active medicine
 * whose reminder is switched on. Does nothing if the medication reminders setting is off.
 */
export async function syncMedicationReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { notifications, medicationReminderEnabled } = useAppStore.getState();
  if (!notifications.medicationReminders) return;

  const allowed = (await Notifications.getPermissionsAsync()).granted;
  if (!allowed) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Medication reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  for (const med of activeMedications) {
    if (!(medicationReminderEnabled[med.id] ?? true)) continue;
    for (const time of med.times) {
      const [hour, minute] = time.split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Time for ${med.name} ${med.strength}`,
          body: med.directions,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: CHANNEL_ID,
        },
      });
    }
  }
}
