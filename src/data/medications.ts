export interface Medication {
  id: string;
  name: string;
  strength: string;
  indication: string;
  route: string;
  frequency: string;
  directions: string;
  prescriber: string;
  facility: string;
  provenance: string;
  times: string[];
  status: 'active' | 'past';
  startDate: string;
  endDate?: string;
  note?: string;
}

export const medications: Medication[] = [];

export const medicationsSeed: Medication[] = [];

export const activeMedications: Medication[] = [];
export const pastMedications: Medication[] = [];

export interface ReminderInstance {
  id: string;
  medicationId: string;
  time: string;
  label: string;
}

export function todaysReminders(list?: Medication[]): ReminderInstance[] {
  const items: ReminderInstance[] = [];
  const source = (list ?? activeMedications).filter((m) => m.status === 'active');
  for (const med of source) {
    for (const time of med.times) {
      items.push({
        id: `${med.id}-${time}`,
        medicationId: med.id,
        time,
        label: `${med.name} ${med.strength}`,
      });
    }
  }
  return items.sort((a, b) => a.time.localeCompare(b.time));
}
