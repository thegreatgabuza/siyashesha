import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { healthDays } from '@/data/healthDays';
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

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Medication reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Makes the scheduled reminders match the settings.
 * Cancels everything, then schedules one daily notification per medicine dose time (when the medication
 * reminders setting and that medicine's reminder are on) and one per custom reminder.
 */
export async function syncReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { notifications, medicationReminderEnabled, customReminders } = useAppStore.getState();
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await ensureChannel();

  if (notifications.medicationReminders) {
    for (const med of activeMedications) {
      if (!(medicationReminderEnabled[med.id] ?? true)) continue;
      for (const time of med.times) {
        await scheduleDaily(`Time for ${med.name} ${med.strength}`, med.directions, time);
      }
    }
  }

  for (const reminder of customReminders) {
    await scheduleDaily(reminder.title, 'Your reminder', reminder.time);
  }

  // Educational tips: a reminder on each WHO health day, repeating every year at 08:00.
  if (notifications.educationalTips) {
    for (const card of healthDays) {
      await Notifications.scheduleNotificationAsync({
        content: { title: `Health day: ${card.title}`, body: 'Tap to read what this day is about.' },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.YEARLY,
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
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Weekly check-in', body: 'How are you feeling this week? Add a note in your diary if you like.' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
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
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title, body: `Snoozed for ${minutes} minutes` },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
      channelId: CHANNEL_ID,
    },
  });
}

async function scheduleDaily(title: string, body: string, time: string) {
  const [hour, minute] = time.split(':').map(Number);
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}
