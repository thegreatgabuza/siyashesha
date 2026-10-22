import { todaysReminders } from '@/data/medications';
import { pastDateKeys } from '@/lib/date';

/** Adherence over the last `windowDays` completed days (excludes today, which is still in progress). */
export function computeAdherence(takenLog: Record<string, boolean>, windowDays = 7) {
  const reminders = todaysReminders();
  const days = pastDateKeys(windowDays);
  let total = 0;
  let taken = 0;
  let logged = 0;
  for (const day of days) {
    for (const reminder of reminders) {
      total += 1;
      const key = `${reminder.id}__${day}`;
      if (key in takenLog) logged += 1;
      if (takenLog[key]) taken += 1;
    }
  }
  const percent = total === 0 ? 0 : Math.round((taken / total) * 100);

  let streak = 0;
  for (const day of days) {
    const allTaken = reminders.every((r) => takenLog[`${r.id}__${day}`]);
    if (allTaken) streak += 1;
    else break;
  }

  // Without any logged doses in the window a percentage would only read as failure, so callers
  // show a neutral state instead.
  const hasData = reminders.length > 0 && logged > 0;

  return { percent, streak, windowDays, hasData, scheduled: reminders.length };
}
