export type AppointmentType = 'Appointment' | 'Medication Refill';

export interface Appointment {
  id: string;
  title: string;
  facility: string;
  provider?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: AppointmentType;
  notes?: string;
}

export const appointmentsSeed: Appointment[] = [
  {
    id: 'appt-001',
    title: 'Quarterly Diabetes & Hypertension Review',
    facility: 'Rosebank Family Practice',
    provider: 'Dr N. Mokoena',
    date: '2026-10-22',
    time: '09:00',
    type: 'Appointment',
    notes: 'Bring glucose diary and current medication.',
  },
  {
    id: 'appt-002',
    title: 'Chronic Medicine Collection',
    facility: 'Edenvale Community Health Centre',
    provider: 'Sr P. Dlamini',
    date: '2026-10-30',
    time: '08:30',
    type: 'Appointment',
  },
  {
    id: 'appt-003',
    title: 'Metformin Repeat Script Due',
    facility: 'Rosebank Family Practice',
    date: '2026-11-02',
    time: '00:00',
    type: 'Medication Refill',
  },
  {
    id: 'appt-004',
    title: 'Repeat HbA1c & Lipogram',
    facility: 'Lancet Laboratories, Bedfordview',
    provider: 'Dr N. Mokoena',
    date: '2026-11-30',
    time: '07:30',
    type: 'Appointment',
    notes: 'Fasting required — no food for 8 hours before the test.',
  },
  {
    id: 'appt-005',
    title: 'Cardiology Annual Review',
    facility: 'Milpark Cardiology',
    provider: 'Dr S. Naidoo',
    date: '2027-06-18',
    time: '10:00',
    type: 'Appointment',
  },
];

export const appointments = appointmentsSeed;

export function nextAppointment(list: Appointment[] = appointmentsSeed, fromDate: Date = new Date()): Appointment | undefined {
  const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : 1));
  return sorted.find((a) => new Date(`${a.date}T${a.time || '00:00'}`) >= fromDate);
}
