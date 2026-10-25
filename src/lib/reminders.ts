import dayjs from 'dayjs';
import { Platform } from 'react-native';

import { healthDays } from '@/data/healthDays';
import { activeMedications } from '@/data/medications';
import { useAppStore } from '@/store/useAppStore';
import { getNotifications } from './notify';

const CHANNEL_ID = 'medication';
const HEALTH_DAY_CHANNEL_ID = 'health_awareness';

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

async function ensureChannels(N: NonNullable<ReturnType<typeof getNotifications>>) {
  if (Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Medication and Clinical Reminders',
    importance: N.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
  await N.setNotificationChannelAsync(HEALTH_DAY_CHANNEL_ID, {
    name: 'WHO Health Awareness Days',
    importance: N.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

/**
 * Makes the scheduled reminders match the settings.
 * Cancels everything, then schedules:
 * 1. Medicine doses
 * 2. Custom reminders
 * 3. Health Calendar appointments
 * 4. All 20 WHO Health Awareness Days (F-02)
 * 5. Weekly wellness check-in
 */
export async function syncReminders(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();

  const { notifications, medicationReminderEnabled, customReminders, appointments, medications } = useAppStore.getState();
  if (!(await notificationsGranted())) return;
  await ensureChannels(N);

  // 1. Medication doses
  if (notifications.medicationReminders) {
    const activeList = (medications ?? activeMedications).filter((m) => m.status === 'active');
    for (const med of activeList) {
      if (!(medicationReminderEnabled[med.id] ?? true)) continue;
      for (const time of med.times) {
        await scheduleDaily(N, `Time for ${med.name} ${med.strength}`, med.directions, time);
      }
    }
  }

  // 2. Custom reminders
  for (const reminder of customReminders) {
    await scheduleDaily(N, reminder.title, 'Scheduled reminder', reminder.time);
  }

  // 3. Health Calendar appointments (1 day before & 2 hours before)
  for (const appt of appointments) {
    const apptDateTime = dayjs(`${appt.date}T${appt.time || '09:00'}`);
    if (apptDateTime.isAfter(dayjs())) {
      // 1 day before at 08:30 AM
      const dayBefore = apptDateTime.subtract(1, 'day').hour(8).minute(30);
      if (dayBefore.isAfter(dayjs())) {
        await N.scheduleNotificationAsync({
          content: {
            title: `Tomorrow: ${appt.title}`,
            body: `${appt.time !== '00:00' ? appt.time + ' · ' : ''}${appt.facility}. Tap to review visit details.`,
            data: { type: 'appointment', apptId: appt.id },
            sound: true,
          },
          trigger: {
            type: N.SchedulableTriggerInputTypes.DATE,
            date: dayBefore.toDate(),
          },
        });
      }
    }
  }

  // 4. WHO Health Awareness Days (Spec §7 F-02): all 20 recognised health days
  if (notifications.educationalTips) {
    for (const card of healthDays) {
      await N.scheduleNotificationAsync({
        content: {
          title: `Health Awareness Day: ${card.title}`,
          body: `Today is ${card.title}. Tap to learn about symptoms, prevention and your records.`,
          data: { type: 'health_day', dayId: card.id },
          sound: true,
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.YEARLY,
          month: card.month,
          day: card.day,
          hour: 8,
          minute: 0,
        },
      });
    }
  }

  // 5. Wellness check-in: every Sunday evening at 18:00
  if (notifications.wellnessCheckins) {
    await N.scheduleNotificationAsync({
      content: {
        title: 'Weekly Health Check-in',
        body: 'How are you feeling this week? Add a private note in your diary to reflect on your symptoms.',
        data: { type: 'checkin' },
        sound: true,
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1,
        hour: 18,
        minute: 0,
      },
    });
  }
}

/** Schedules a one-off reminder a few minutes from now, used by the Snooze action. */
export async function snoozeReminder(title: string, minutes = 15): Promise<void> {
  const N = getNotifications();
  if (!N || !(await notificationsGranted())) return;
  await ensureChannels(N);
  await N.scheduleNotificationAsync({
    content: {
      title,
      body: `Snoozed for ${minutes} minutes`,
      sound: true,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: minutes * 60,
    },
  });
}

/** Instantly triggers a test Health Awareness Day push notification for verification. */
export async function triggerTestHealthDayAlert(dayId?: string): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  if (!(await ensureNotificationPermission())) return false;
  await ensureChannels(N);

  const card = healthDays.find((d) => d.id === dayId) ?? healthDays[0];
  await N.scheduleNotificationAsync({
    content: {
      title: `Health Awareness Day: ${card.title}`,
      body: `Today is ${card.title}. Tap to learn about symptoms, prevention and your records.`,
      data: { type: 'health_day', dayId: card.id },
      sound: true,
    },
    trigger: null, // Triggers immediately
  });
  return true;
}

async function scheduleDaily(
  N: NonNullable<ReturnType<typeof getNotifications>>,
  title: string,
  body: string,
  time: string
) {
  const [hour, minute] = time.split(':').map(Number);
  await N.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}
