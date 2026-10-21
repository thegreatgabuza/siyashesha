import { Platform } from 'react-native';

import { healthDays } from '@/data/healthDays';
import { activeMedications } from '@/data/medications';
import { useAppStore } from '@/store/useAppStore';
import { getNotifications } from './notify';

const CHANNEL_ID = 'medication';

/** False in builds where notifications are not available (for example Expo Go on Android). */
export function remindersAvailable(): boolean {
  return getNotifications() !== null;
}

/** True when the phone currently allows notifications from this app. */
export async function notificationsGranted(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  return (await N.getPermissionsAsync()).granted;
}

/**
 * Asks for notification permission if needed.
 * Returns true when reminders are allowed on this phone.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  return (await N.requestPermissionsAsync()).granted;
}

async function ensureChannel(N: NonNullable<ReturnType<typeof getNotifications>>) {
  if (Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Medication reminders',
    importance: N.AndroidImportance.DEFAULT,
  });
}

/**
 * Makes the scheduled reminders match the settings.
 * Cancels everything, then schedules: medicine doses, custom reminders, health-day tips and the weekly check-in.
 * Does nothing where notifications are unavailable or not allowed.
 */
export async function syncReminders(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();

  const { notifications, medicationReminderEnabled, customReminders } = useAppStore.getState();
  if (!(await notificationsGranted())) return;
  await ensureChannel(N);

  if (notifications.medicationReminders) {
    for (const med of activeMedications) {
      if (!(medicationReminderEnabled[med.id] ?? true)) continue;
      for (const time of med.times) {
        await scheduleDaily(N, `Time for ${med.name} ${med.strength}`, med.directions, time);
      }
    }
  }

  for (const reminder of customReminders) {
    await scheduleDaily(N, reminder.title, 'Your reminder', reminder.time);
  }

  // Educational tips: a reminder on each WHO health day, repeating every year at 08:00.
  if (notifications.educationalTips) {
    for (const card of healthDays) {
      await N.scheduleNotificationAsync({
        content: { title: `Health day: ${card.title}`, body: 'Tap to read what this day is about.' },
        trigger: {
          type: N.SchedulableTriggerInputTypes.YEARLY,
          month: card.month,
          day: card.day,
          hour: 8,
          minute: 0,
          channelId: CHANNEL_ID,
        },
      });
    }
  }

  // Wellness check-in: every Sunday evening.
  if (notifications.wellnessCheckins) {
    await N.scheduleNotificationAsync({
      content: { title: 'Weekly check-in', body: 'How are you feeling this week? Add a note in your diary if you like.' },
      trigger: {
        type: N.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1,
        hour: 18,
        minute: 0,
        channelId: CHANNEL_ID,
      },
    });
  }
}

/** Schedules a one-off reminder a few minutes from now, used by the Snooze action. */
export async function snoozeReminder(title: string, minutes = 15): Promise<void> {
  const N = getNotifications();
  if (!N || !(await notificationsGranted())) return;
  await ensureChannel(N);
  await N.scheduleNotificationAsync({
    content: { title, body: `Snoozed for ${minutes} minutes` },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
      channelId: CHANNEL_ID,
    },
  });
}

async function scheduleDaily(
  N: NonNullable<ReturnType<typeof getNotifications>>,
  title: string,
  body: string,
  time: string
) {
  const [hour, minute] = time.split(':').map(Number);
  await N.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}
