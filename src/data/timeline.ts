export type TimelineEventType =
  | 'Lab Result'
  | 'Prescription'
  | 'Specialist Letter'
  | 'Hospital Visit'
  | 'Clinic Visit'
  | 'Operation'
  | 'Discharge Summary'
  | 'Vaccination';

export interface TimelineEvent {
  id: string;
  date: string;
  type: TimelineEventType;
  title: string;
  facility: string;
  provider: string;
  summary: string;
  recordId?: string;
}

export const timelineEvents: TimelineEvent[] = [
  {
    id: 'tl-001',
    date: '2026-09-02',
    type: 'Lab Result',
    title: 'HbA1c, Lipogram & Renal Function Panel',
    facility: 'Lancet Laboratories, Bedfordview',
    provider: 'Dr N. Mokoena',
    summary: 'HbA1c improved to 7.1%. Kidney function normal.',
    recordId: 'rec-001',
  },
  {
    id: 'tl-002',
    date: '2026-09-02',
    type: 'Prescription',
    title: 'Chronic Prescription — Metformin & Amlodipine',
    facility: 'Rosebank Family Practice',
    provider: 'Dr N. Mokoena',
    summary: 'Repeat script issued, 6 repeats dispensed.',
    recordId: 'rec-005',
  },
  {
    id: 'tl-003',
    date: '2026-07-30',
    type: 'Clinic Visit',
    title: 'Chronic Diabetes Follow-up',
    facility: 'Edenvale Community Health Centre',
    provider: 'Sr P. Dlamini',
    summary: 'Routine chronic club visit. Blood pressure and glucose stable.',
    recordId: 'rec-010',
  },
  {
    id: 'tl-004',
    date: '2026-06-18',
    type: 'Specialist Letter',
    title: 'Cardiology Review Letter',
    facility: 'Milpark Cardiology',
    provider: 'Dr S. Naidoo',
    summary: 'Blood pressure well controlled. Routine review in 12 months.',
    recordId: 'rec-007',
  },
  {
    id: 'tl-005',
    date: '2026-06-18',
    type: 'Prescription',
    title: 'Chronic Prescription — Atorvastatin & Aspirin',
    facility: 'Milpark Cardiology',
    provider: 'Dr S. Naidoo',
    summary: 'Repeat script issued, 6 repeats dispensed.',
    recordId: 'rec-006',
  },
  {
    id: 'tl-006',
    date: '2026-04-02',
    type: 'Vaccination',
    title: 'Influenza & COVID-19 Booster',
    facility: 'Clearwater Family Clinic',
    provider: 'Dr L. Petersen',
    summary: 'Seasonal flu vaccine and COVID-19 booster administered.',
    recordId: 'rec-012',
  },
  {
    id: 'tl-007',
    date: '2026-03-04',
    type: 'Lab Result',
    title: 'HbA1c & Lipogram',
    facility: 'Lancet Laboratories, Bedfordview',
    provider: 'Dr N. Mokoena',
    summary: 'HbA1c 7.8%. Dietary adherence discussed.',
    recordId: 'rec-002',
  },
  {
    id: 'tl-008',
    date: '2025-09-10',
    type: 'Lab Result',
    title: 'HbA1c Monitoring',
    facility: 'Lancet Laboratories, Bedfordview',
    provider: 'Dr N. Mokoena',
    summary: 'HbA1c 8.2%. Medication timing inconsistent.',
    recordId: 'rec-003',
  },
  {
    id: 'tl-009',
    date: '2025-01-22',
    type: 'Hospital Visit',
    title: 'Emergency Department Visit — Hypertensive Urgency',
    facility: 'Netcare Linksfield Hospital',
    provider: 'Dr F. Khumalo',
    summary: 'Treated for elevated blood pressure. Medication adjusted.',
    recordId: 'rec-009',
  },
  {
    id: 'tl-010',
    date: '2024-11-05',
    type: 'Discharge Summary',
    title: 'Discharge Summary — Laparoscopic Cholecystectomy',
    facility: 'Netcare Milpark Hospital',
    provider: 'Dr R. Abrahams',
    summary: 'Discharged after uneventful recovery.',
    recordId: 'rec-008',
  },
  {
    id: 'tl-011',
    date: '2024-11-04',
    type: 'Operation',
    title: 'Operation Note — Laparoscopic Cholecystectomy',
    facility: 'Netcare Milpark Hospital',
    provider: 'Dr R. Abrahams',
    summary: 'Gallbladder removed without complication.',
    recordId: 'rec-011',
  },
  {
    id: 'tl-012',
    date: '2024-10-20',
    type: 'Lab Result',
    title: 'Abdominal Ultrasound (Pre-operative)',
    facility: 'Life Fourways Radiology',
    provider: 'Dr T. van Wyk',
    summary: 'Gallstones confirmed. Referred for surgery.',
    recordId: 'rec-004',
  },
];

export const timelineEventTypes: TimelineEventType[] = [
  'Lab Result',
  'Prescription',
  'Specialist Letter',
  'Hospital Visit',
  'Clinic Visit',
  'Operation',
  'Discharge Summary',
  'Vaccination',
];

export const timelineProviders: string[] = Array.from(
  new Set(timelineEvents.map((e) => e.facility))
);

export function sortedTimeline(): TimelineEvent[] {
  return [...timelineEvents].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export interface Hba1cPoint {
  date: string;
  value: number;
}

export const hba1cSeries: Hba1cPoint[] = [
  { date: '2024-09-15', value: 8.6 },
  { date: '2025-09-10', value: 8.2 },
  { date: '2026-03-04', value: 7.8 },
  { date: '2026-09-02', value: 7.1 },
];
