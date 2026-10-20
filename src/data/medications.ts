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

export const medications: Medication[] = [
  {
    id: 'med-metformin',
    name: 'Metformin',
    strength: '500 mg',
    indication: 'Type 2 Diabetes Mellitus',
    route: 'Oral',
    frequency: 'Twice daily',
    directions: 'Take with meals',
    prescriber: 'Dr N. Mokoena',
    facility: 'Rosebank Family Practice',
    provenance: 'Prescription Scan',
    times: ['07:00', '19:00'],
    status: 'active',
    startDate: '2024-02-14',
  },
  {
    id: 'med-amlodipine',
    name: 'Amlodipine',
    strength: '5 mg',
    indication: 'Hypertension',
    route: 'Oral',
    frequency: 'Daily',
    directions: 'Take in the morning',
    prescriber: 'Dr S. Naidoo',
    facility: 'Milpark Cardiology',
    provenance: 'Specialist Letter',
    times: ['07:00'],
    status: 'active',
    startDate: '2025-01-20',
  },
  {
    id: 'med-atorvastatin',
    name: 'Atorvastatin',
    strength: '20 mg',
    indication: 'Raised Cholesterol',
    route: 'Oral',
    frequency: 'Daily at night',
    directions: 'Take at bedtime',
    prescriber: 'Dr N. Mokoena',
    facility: 'Rosebank Family Practice',
    provenance: 'Prescription Scan',
    times: ['21:00'],
    status: 'active',
    startDate: '2024-06-02',
  },
  {
    id: 'med-aspirin',
    name: 'Aspirin',
    strength: '81 mg',
    indication: 'Cardiovascular Risk Reduction',
    route: 'Oral',
    frequency: 'Daily',
    directions: 'Take after breakfast',
    prescriber: 'Dr S. Naidoo',
    facility: 'Milpark Cardiology',
    provenance: 'Prescription Scan',
    times: ['07:30'],
    status: 'active',
    startDate: '2025-06-18',
  },
  {
    id: 'med-enalapril',
    name: 'Enalapril',
    strength: '10 mg',
    indication: 'Hypertension',
    route: 'Oral',
    frequency: 'Daily',
    directions: 'Take in the morning',
    prescriber: 'Dr S. Naidoo',
    facility: 'Milpark Cardiology',
    provenance: 'Specialist Letter',
    times: ['07:00'],
    status: 'past',
    startDate: '2024-06-02',
    endDate: '2025-01-20',
    note: 'Discontinued due to a persistent dry cough; switched to Amlodipine.',
  },
];

export const activeMedications = medications.filter((m) => m.status === 'active');
export const pastMedications = medications.filter((m) => m.status === 'past');

export interface ReminderInstance {
  id: string;
  medicationId: string;
  time: string;
  label: string;
}

export function todaysReminders(): ReminderInstance[] {
  const items: ReminderInstance[] = [];
  for (const med of activeMedications) {
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
