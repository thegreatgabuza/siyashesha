export type AppointmentType = 'Appointment' | 'Medication Refill';

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled';

export type AppointmentReminderOption = '1_day' | '2_hours' | 'morning_of' | 'none';

export interface Appointment {
  id: string;
  title: string;
  facility: string;
  provider?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: AppointmentType;
  notes?: string;
  status?: AppointmentStatus;
  reminderOption?: AppointmentReminderOption;
  linkedRecordId?: string;
}

export const appointmentsSeed: Appointment[] = [];

export const appointments: Appointment[] = [];

export function nextAppointment(list: Appointment[] = [], fromDate: Date = new Date()): Appointment | undefined {
  const sorted = [...list]
    .filter((a) => a.status !== 'completed' && a.status !== 'cancelled')
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  return sorted.find((a) => new Date(`${a.date}T${a.time || '00:00'}`) >= fromDate);
}
