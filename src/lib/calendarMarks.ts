import dayjs from 'dayjs';

import { appointments, type Appointment } from '@/data/appointments';
import { healthDays, type HealthDayCard } from '@/data/healthDays';

export interface DayAgenda {
  dateKey: string;
  appointments: Appointment[];
  healthDays: HealthDayCard[];
}

function healthDaysOnDate(date: dayjs.Dayjs): HealthDayCard[] {
  const month = date.month() + 1;
  const day = date.date();
  return healthDays.filter((card) => {
    if (card.endMonth && card.endDay) {
      if (card.month === card.endMonth) {
        return month === card.month && day >= card.day && day <= card.endDay;
      }
      const afterStart = month > card.month || (month === card.month && day >= card.day);
      const beforeEnd = month < card.endMonth || (month === card.endMonth && day <= card.endDay);
      return afterStart && beforeEnd;
    }
    return card.month === month && card.day === day;
  });
}

export function getHealthDaysForDateString(dateString: string): HealthDayCard[] {
  return healthDaysOnDate(dayjs(dateString));
}

export function getDayAgenda(dateKey: string): DayAgenda {
  const date = dayjs(dateKey);
  return {
    dateKey,
    appointments: appointments.filter((a) => a.date === dateKey),
    healthDays: healthDaysOnDate(date),
  };
}

/** Marks for every day in the visible month (YYYY-MM), used to decorate the calendar grid. */
export function getMonthMarks(yearMonth: string): Record<string, DayAgenda> {
  const start = dayjs(`${yearMonth}-01`);
  const daysInMonth = start.daysInMonth();
  const marks: Record<string, DayAgenda> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    const date = start.date(d);
    const key = date.format('YYYY-MM-DD');
    const agenda = getDayAgenda(key);
    if (agenda.appointments.length || agenda.healthDays.length) {
      marks[key] = agenda;
    }
  }
  return marks;
}

export function upcomingHealthDays(fromDate: Date = new Date(), count = 6): HealthDayCard[] {
  const month = fromDate.getMonth() + 1;
  const day = fromDate.getDate();
  const sorted = [...healthDays].sort((a, b) => a.month - b.month || a.day - b.day);
  const startIndex = sorted.findIndex((c) => c.month > month || (c.month === month && c.day >= day));
  const from = startIndex === -1 ? 0 : startIndex;
  const ordered = [...sorted.slice(from), ...sorted.slice(0, from)];
  return ordered.slice(0, count);
}
