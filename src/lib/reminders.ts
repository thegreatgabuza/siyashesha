import dayjs from 'dayjs';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { healthDays } from '@/data/healthDays';
import { activeMedications } from '@/data/medications';
import { useAppStore } from '@/store/useAppStore';
import { getNotifications } from './notify';
import { syncPushTokenToBackend, syncRemindersToBackend, type SyncReminderItem } from './supabase';

const CHANNEL_ID = 'medication';
const MISSED_DOSE_CHANNEL_ID = 'missed_dose_channel';
const APPOINTMENT_CHANNEL_ID = 'appointment_channel';
const DIARY_CHANNEL_ID = 'diary_channel';
const HEALTH_DAY_CHANNEL_ID = 'health_awareness';

/** Initialize foreground notification presentation handler */
const N_INIT = getNotifications();
if (N_INIT && typeof N_INIT.setNotificationHandler === 'function') {
  N_INIT.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

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
    name: 'Medication Doses',
    importance: N.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
  await N.setNotificationChannelAsync(MISSED_DOSE_CHANNEL_ID, {
    name: 'Missed Dose Alerts',
    importance: N.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 300, 200, 300],
  });
  await N.setNotificationChannelAsync(APPOINTMENT_CHANNEL_ID, {
    name: 'Doctor Appointment Alerts',
    importance: N.AndroidImportance.HIGH,
    sound: 'default',
  });
  await N.setNotificationChannelAsync(DIARY_CHANNEL_ID, {
    name: 'Consultation & Diary Reminders',
    importance: N.AndroidImportance.DEFAULT,
    sound: 'default',
  });
  await N.setNotificationChannelAsync(HEALTH_DAY_CHANNEL_ID, {
    name: 'WHO Health Awareness Days',
    importance: N.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

/**
 * Configures interactive notification categories for native action buttons (Spec §4.6 & §8.2).
 */
async function ensureCategories(N: NonNullable<ReturnType<typeof getNotifications>>) {
  if (typeof N.setNotificationCategoryAsync !== 'function') return;

  try {
    // 1. Medication dose reminder category
    await N.setNotificationCategoryAsync('medication_dose', [
      {
        identifier: 'take_dose',
        buttonTitle: 'Mark Taken',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'snooze_dose',
        buttonTitle: 'Snooze 15m',
        options: { opensAppToForeground: false },
      },
    ]);

    // 2. Missed dose alert category
    await N.setNotificationCategoryAsync('missed_dose', [
      {
        identifier: 'take_dose',
        buttonTitle: 'Take Now',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'snooze_dose',
        buttonTitle: 'Remind in 15m',
        options: { opensAppToForeground: false },
      },
    ]);

    // 3. Doctor appointment category
    await N.setNotificationCategoryAsync('appointment_visit', [
      {
        identifier: 'view_calendar',
        buttonTitle: 'View Visit',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'view_notes',
        buttonTitle: 'Doctor Notes',
        options: { opensAppToForeground: true },
      },
    ]);

    // 4. Consultation diary category
    await N.setNotificationCategoryAsync('diary_note', [
      {
        identifier: 'view_notes',
        buttonTitle: 'Open Note',
        options: { opensAppToForeground: true },
      },
    ]);
  } catch (err) {
    console.warn('[Notifications] Category registration notice:', err);
  }
}

/** Helper to add minutes to a "HH:mm" time string */
function addMinutesToTime(time: string, minutesToAdd = 45): { hour: number; minute: number; timeStr: string } {
  const [h, m] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutesToAdd;
  const newHour = Math.floor((totalMinutes / 60) % 24);
  const newMinute = totalMinutes % 60;
  const timeStr = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
  return { hour: newHour, minute: newMinute, timeStr };
}

/**
 * Builds the comprehensive list of scheduled reminders across all categories
 * for syncing with the cloud backend (Spec §4.6 & §8.2).
 */
export function collectScheduledRemindersList(): SyncReminderItem[] {
  const {
    notifications,
    medicationReminderEnabled,
    customReminders,
    appointments,
    medications,
    diaryNotes,
  } = useAppStore.getState();

  const items: SyncReminderItem[] = [];

  // 1. Medications and Missed Doses
  if (notifications.medicationReminders) {
    const activeList = (medications ?? activeMedications).filter((m) => m.status === 'active');
    for (const med of activeList) {
      if (!(medicationReminderEnabled[med.id] ?? true)) continue;
      for (const time of med.times) {
        items.push({
          id: `med_${med.id}_${time}`,
          reminderType: 'medication',
          title: `Time for ${med.name} ${med.strength}`,
          body: med.directions || 'Take as prescribed with water.',
          scheduledTime: time,
          recurrence: 'daily',
          status: 'active',
          metadata: { medicationId: med.id, medicationName: med.name, dose: med.strength },
        });

        if (notifications.missedDoseAlerts) {
          const missed = addMinutesToTime(time, 45);
          items.push({
            id: `missed_${med.id}_${time}`,
            reminderType: 'missed_dose',
            title: `Missed Dose: ${med.name}`,
            body: `You haven't logged your ${time} dose of ${med.name} ${med.strength}. Tap to log it now or snooze.`,
            scheduledTime: missed.timeStr,
            recurrence: 'daily',
            status: 'active',
            metadata: {
              medicationId: med.id,
              medicationName: med.name,
              originalDoseTime: time,
              gracePeriodMinutes: 45,
            },
          });
        }
      }
    }
  }

  // 2. Custom Reminders
  for (const reminder of customReminders) {
    items.push({
      id: `custom_${reminder.id}`,
      reminderType: 'custom',
      title: reminder.title,
      body: 'Scheduled reminder',
      scheduledTime: reminder.time,
      recurrence: 'daily',
      status: 'active',
      metadata: { customReminderId: reminder.id },
    });
  }

  // 3. Doctor Appointments (24h before & 2h before with linked diary questions)
  if (notifications.appointmentAlerts) {
    for (const appt of appointments) {
      const apptDateTime = dayjs(`${appt.date}T${appt.time || '09:00'}`);
      if (apptDateTime.isAfter(dayjs())) {
        const linkedNote = diaryNotes.find(
          (d) => d.linkedAppointmentId === appt.id || (d.category === 'Appointment' && d.entryDate === appt.date)
        );

        // 24 hours / 1 day before
        items.push({
          id: `appt_${appt.id}_24h`,
          reminderType: 'appointment',
          title: `Tomorrow: ${appt.title}`,
          body: `${appt.time !== '00:00' ? appt.time + ' · ' : ''}${appt.facility}${
            linkedNote ? ` · Attached Questions: "${linkedNote.title}"` : ''
          }. Tap to review visit details.`,
          scheduledTime: apptDateTime.subtract(1, 'day').hour(8).minute(30).format('YYYY-MM-DD HH:mm'),
          recurrence: 'once',
          status: 'active',
          metadata: {
            appointmentId: appt.id,
            facility: appt.facility,
            linkedNoteId: linkedNote?.id,
            hoursPrior: 24,
          },
        });

        // 2 hours before
        items.push({
          id: `appt_${appt.id}_2h`,
          reminderType: 'appointment',
          title: `Upcoming Appointment: ${appt.title}`,
          body: `Visit at ${appt.facility} in 2 hours.${
            linkedNote ? ` Review your prepared questions: "${linkedNote.title}".` : ''
          }`,
          scheduledTime: apptDateTime.subtract(2, 'hour').format('YYYY-MM-DD HH:mm'),
          recurrence: 'once',
          status: 'active',
          metadata: {
            appointmentId: appt.id,
            facility: appt.facility,
            linkedNoteId: linkedNote?.id,
            hoursPrior: 2,
          },
        });
      }
    }
  }

  // 4. Consultation Diary standalone reminders (Spec §8.2)
  for (const note of diaryNotes) {
    if (note.reminderAt && dayjs(note.reminderAt).isAfter(dayjs())) {
      items.push({
        id: `diary_${note.id}`,
        reminderType: 'diary_reminder',
        title: `Diary Reminder: ${note.title}`,
        body: note.body.slice(0, 100),
        scheduledTime: dayjs(note.reminderAt).format('YYYY-MM-DD HH:mm'),
        recurrence: 'once',
        status: 'active',
        metadata: { noteId: note.id, linkedAppointmentId: note.linkedAppointmentId },
      });
    }
  }

  // 5. WHO Health Awareness Days (Spec §7 F-02)
  if (notifications.educationalTips) {
    for (const card of healthDays) {
      items.push({
        id: `health_day_${card.id}`,
        reminderType: 'health_day',
        title: `Health Awareness Day: ${card.title}`,
        body: `Today is ${card.title}. Tap to learn about symptoms, prevention and your records.`,
        scheduledTime: `${card.month}-${card.day} 08:00`,
        recurrence: 'yearly',
        status: 'active',
        metadata: { healthDayId: card.id },
      });
    }
  }

  // 6. Wellness Check-in
  if (notifications.wellnessCheckins) {
    items.push({
      id: 'weekly_wellness_checkin',
      reminderType: 'checkin',
      title: 'Weekly Health Check-in',
      body: 'How are you feeling this week? Add a private note in your diary to reflect on your symptoms.',
      scheduledTime: 'Sun 18:00',
      recurrence: 'weekly',
      status: 'active',
    });
  }

  return items;
}

/**
 * Registers / retrieves the push token and syncs scheduled reminders with the Supabase backend.
 */
export async function syncPushTokenAndRemindersWithBackend(): Promise<{
  success: boolean;
  token?: string;
  remindersCount: number;
  message: string;
}> {
  const state = useAppStore.getState();
  const patientId = state.patientProfile?.idNumber || 'default_patient';

  let token = state.pushToken;
  if (!token) {
    const fetchedToken = await registerForPushNotifications();
    if (fetchedToken) {
      token = fetchedToken;
      state.setPushToken(token);
    }
  }

  const deviceName = Device.modelName ?? Device.deviceName ?? `${Platform.OS} Client`;
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  let tokenSynced = false;
  if (token) {
    tokenSynced = await syncPushTokenToBackend({
      patientId,
      token,
      deviceOs: Platform.OS,
      deviceName,
      appVersion,
    });
  }

  const syncedReminders = collectScheduledRemindersList();
  const remindersSynced = await syncRemindersToBackend(patientId, syncedReminders);

  const timestamp = new Date().toISOString();
  state.setLastPushSyncAt(timestamp);

  const success = tokenSynced || remindersSynced;
  const message = success
    ? `Synced device token and ${syncedReminders.length} reminders to Supabase.`
    : `Reminders staged locally (${syncedReminders.length} items).`;

  return {
    success,
    token: token ?? undefined,
    remindersCount: syncedReminders.length,
    message,
  };
}

/**
 * Obtains an Expo push notification token or creates a stable preview device token.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const N = getNotifications();
  if (!N) return null;

  try {
    const { granted } = await N.getPermissionsAsync();
    if (!granted) {
      const req = await N.requestPermissionsAsync();
      if (!req.granted) return null;
    }

    if (Device.isDevice) {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId ??
        process.env.EXPO_PUBLIC_PROJECT_ID;

      try {
        const tokenData = await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
        if (tokenData?.data) {
          return tokenData.data;
        }
      } catch (tokenErr) {
        console.warn('[Push] Expo push token fetch fallback:', tokenErr);
      }
    }

    // In simulator / preview or when EAS project ID is absent, generate a stable preview token
    const storeToken = useAppStore.getState().pushToken;
    if (storeToken) return storeToken;
    const patientId = useAppStore.getState().patientProfile?.idNumber || 'patient-sa-001';
    return `SimulatedPushToken_${patientId}_${Platform.OS}`;
  } catch (err) {
    console.warn('[Push] Registration error:', err);
    return null;
  }
}

/**
 * Makes the scheduled reminders match the settings.
 * Cancels everything, then schedules:
 * 1. Medicine doses (interactive category: medication_dose)
 * 2. Missed dose alerts 45 minutes after dose (interactive category: missed_dose)
 * 3. Custom reminders
 * 4. Health Calendar appointments (24 hours & 2 hours before, with linked diary notes)
 * 5. Consultation diary reminders (Spec §8.2)
 * 6. All 20 WHO Health Awareness Days (F-02)
 * 7. Weekly wellness check-in
 * And opportunistically syncs with the Supabase cloud backend.
 */
export async function syncReminders(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();

  const {
    notifications,
    medicationReminderEnabled,
    customReminders,
    appointments,
    medications,
    diaryNotes,
    patientProfile,
  } = useAppStore.getState();

  if (!(await notificationsGranted())) return;
  await ensureChannels(N);
  await ensureCategories(N);

  // 1. Medication doses & Missed Dose Alerts (Spec §4.6)
  if (notifications.medicationReminders) {
    const activeList = (medications ?? activeMedications).filter((m) => m.status === 'active');
    for (const med of activeList) {
      if (!(medicationReminderEnabled[med.id] ?? true)) continue;
      for (const time of med.times) {
        // Scheduled dose
        await scheduleDaily(
          N,
          `Time for ${med.name} ${med.strength}`,
          med.directions || 'Take as prescribed with water.',
          time,
          CHANNEL_ID,
          'medication_dose',
          { type: 'medication_dose', reminderId: med.id, medicationName: med.name, doseTime: time }
        );

        // Automated Missed Dose Follow-up Alert (Spec §4.6)
        if (notifications.missedDoseAlerts) {
          const missed = addMinutesToTime(time, 45);
          await scheduleDaily(
            N,
            `Missed Dose: ${med.name}`,
            `You haven't logged your ${time} dose of ${med.name} ${med.strength}. Tap to log it now or snooze.`,
            missed.timeStr,
            MISSED_DOSE_CHANNEL_ID,
            'missed_dose',
            {
              type: 'missed_dose',
              reminderId: med.id,
              medicationName: med.name,
              doseTime: time,
            }
          );
        }
      }
    }
  }

  // 2. Custom reminders
  for (const reminder of customReminders) {
    await scheduleDaily(
      N,
      reminder.title,
      'Scheduled reminder',
      reminder.time,
      CHANNEL_ID,
      undefined,
      { type: 'custom', reminderId: reminder.id }
    );
  }

  // 3. Doctor appointments (Spec §8.2: 24 hours before & 2 hours before with linked consultation notes)
  if (notifications.appointmentAlerts) {
    for (const appt of appointments) {
      const apptDateTime = dayjs(`${appt.date}T${appt.time || '09:00'}`);
      if (apptDateTime.isAfter(dayjs())) {
        const linkedNote = diaryNotes.find(
          (d) => d.linkedAppointmentId === appt.id || (d.category === 'Appointment' && d.entryDate === appt.date)
        );

        // 24 hours prior (day before at 08:30 AM)
        const dayBefore = apptDateTime.subtract(1, 'day').hour(8).minute(30);
        if (dayBefore.isAfter(dayjs())) {
          await N.scheduleNotificationAsync({
            content: {
              title: `Tomorrow: ${appt.title}`,
              body: `${appt.time !== '00:00' ? appt.time + ' · ' : ''}${appt.facility}${
                linkedNote ? ` · Linked Questions: "${linkedNote.title}"` : ''
              }. Tap to review visit details.`,
              data: { type: 'appointment', apptId: appt.id, linkedNoteId: linkedNote?.id },
              sound: true,
              categoryIdentifier: 'appointment_visit',
            },
            trigger: {
              type: N.SchedulableTriggerInputTypes.DATE,
              date: dayBefore.toDate(),
              channelId: APPOINTMENT_CHANNEL_ID,
            },
          });
        }

        // 2 hours prior to the appointment
        const twoHoursBefore = apptDateTime.subtract(2, 'hour');
        if (twoHoursBefore.isAfter(dayjs())) {
          await N.scheduleNotificationAsync({
            content: {
              title: `Upcoming Appointment: ${appt.title}`,
              body: `Visit at ${appt.facility} in 2 hours.${
                linkedNote ? ` Review your prepared questions: "${linkedNote.title}".` : ''
              }`,
              data: { type: 'appointment', apptId: appt.id, linkedNoteId: linkedNote?.id },
              sound: true,
              categoryIdentifier: 'appointment_visit',
            },
            trigger: {
              type: N.SchedulableTriggerInputTypes.DATE,
              date: twoHoursBefore.toDate(),
              channelId: APPOINTMENT_CHANNEL_ID,
            },
          });
        }
      }
    }
  }

  // 4. Consultation Diary standalone reminders (Spec §8.2)
  for (const note of diaryNotes) {
    if (note.reminderAt) {
      const reminderTime = dayjs(note.reminderAt);
      if (reminderTime.isAfter(dayjs())) {
        await N.scheduleNotificationAsync({
          content: {
            title: `Diary Reminder: ${note.title}`,
            body: note.body.slice(0, 100),
            data: { type: 'diary_reminder', noteId: note.id },
            sound: true,
            categoryIdentifier: 'diary_note',
          },
          trigger: {
            type: N.SchedulableTriggerInputTypes.DATE,
            date: reminderTime.toDate(),
            channelId: DIARY_CHANNEL_ID,
          },
        });
      }
    }
  }

  // 5. WHO Health Awareness Days (Spec §7 F-02): all 20 recognised health days
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
          channelId: HEALTH_DAY_CHANNEL_ID,
        },
      });
    }
  }

  // 6. Wellness check-in: every Sunday evening at 18:00
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

  // Background server sync attempt
  try {
    const patientId = patientProfile?.idNumber || 'default_patient';
    const syncedReminders = collectScheduledRemindersList();
    await syncRemindersToBackend(patientId, syncedReminders);
  } catch {
    // Non-blocking offline fallback
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
      channelId: CHANNEL_ID,
    },
  });
}

/** Instantly triggers a test Missed Dose alert with interactive actions for verification (Spec §4.6). */
export async function triggerTestMissedDoseAlert(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  if (!(await ensureNotificationPermission())) return false;
  await ensureChannels(N);
  await ensureCategories(N);

  await N.scheduleNotificationAsync({
    content: {
      title: 'Missed Dose: Metformin 500mg',
      body: "You haven't logged your 08:00 AM dose of Metformin 500mg. Tap to log it now or snooze.",
      sound: true,
      categoryIdentifier: 'missed_dose',
      data: {
        type: 'missed_dose',
        reminderId: 'med-001',
        medicationName: 'Metformin',
        doseTime: '08:00',
      },
    },
    trigger: null, // Triggers immediately
  });
  return true;
}

/** Instantly triggers a test Doctor Appointment alert linked to consultation notes (Spec §8.2). */
export async function triggerTestAppointmentAlert(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  if (!(await ensureNotificationPermission())) return false;
  await ensureChannels(N);
  await ensureCategories(N);

  await N.scheduleNotificationAsync({
    content: {
      title: 'Upcoming Appointment: Dr N. Mokoena',
      body: 'Visit at Rosebank Family Practice in 2 hours. You have linked notes ("Questions for my doctor") to discuss.',
      sound: true,
      categoryIdentifier: 'appointment_visit',
      data: {
        type: 'appointment',
        apptId: 'appt-001',
        linkedNoteId: 'diary-001',
      },
    },
    trigger: null, // Triggers immediately
  });
  return true;
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
  time: string,
  channelId?: string,
  categoryIdentifier?: string,
  data?: Record<string, any>
) {
  const [hour, minute] = time.split(':').map(Number);
  await N.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      categoryIdentifier,
      data,
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId,
    },
  });
}
