import { todaysReminders } from '@/data/medications';
import { pastDateKeys } from '@/lib/date';

/** Adherence over the last `windowDays` completed days (excludes today, which is still in progress). */
export function computeAdherence(takenLog: Record<string, boolean>, windowDays = 7) {
  const reminders = todaysReminders();
  const days = pastDateKeys(windowDays);
  let total = 0;
  let taken = 0;
  for (const day of days) {
    for (const reminder of reminders) {
      total += 1;
      if (takenLog[`${reminder.id}__${day}`]) taken += 1;
    }
  }
  const percent = total === 0 ? 0 : Math.round((taken / total) * 100);

  let streak = 0;
  for (const day of days) {
    const allTaken = reminders.every((r) => takenLog[`${r.id}__${day}`]);
    if (allTaken) streak += 1;
    else break;
  }

  return { percent, streak, windowDays };
}
