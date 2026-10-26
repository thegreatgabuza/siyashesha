import type { MedicalRecord, RecordCategory } from './records';

export type TimelineEventType =
  | 'Lab Result'
  | 'Prescription'
  | 'Specialist Letter'
  | 'Hospital Visit'
  | 'Clinic Visit'
  | 'Operation'
  | 'Discharge Summary'
  | 'Vaccination'
  | 'Other';

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

export const timelineEventTypes: TimelineEventType[] = [
  'Lab Result',
  'Prescription',
  'Specialist Letter',
  'Hospital Visit',
  'Clinic Visit',
  'Operation',
  'Discharge Summary',
  'Vaccination',
  'Other',
];

export interface Hba1cPoint {
  date: string;
  value: number;
}

export const HISTORICAL_HBA1C_BASELINE: Hba1cPoint[] = [
  { date: '2024-09-15', value: 8.6 },
];

const seedSummaries: Record<string, string> = {
  'rec-001': 'HbA1c improved to 7.1%. Kidney function normal.',
  'rec-002': 'HbA1c 7.8%. Dietary adherence discussed.',
  'rec-003': 'HbA1c 8.2%. Medication timing inconsistent.',
  'rec-004': 'Gallstones confirmed. Referred for surgery.',
  'rec-005': 'Repeat script issued, 6 repeats dispensed.',
  'rec-006': 'Repeat script issued, 6 repeats dispensed.',
  'rec-007': 'Blood pressure well controlled. Routine review in 12 months.',
  'rec-008': 'Discharged after uneventful recovery.',
  'rec-009': 'Treated for elevated blood pressure. Medication adjusted.',
  'rec-010': 'Routine chronic club visit. Blood pressure and glucose stable.',
  'rec-011': 'Gallbladder removed without complication.',
  'rec-012': 'Seasonal flu vaccine and COVID-19 booster administered.',
};

export function categoryToTimelineType(category: RecordCategory): TimelineEventType {
  switch (category) {
    case 'Blood Tests':
    case 'Radiology':
      return 'Lab Result';
    case 'Prescriptions':
      return 'Prescription';
    case 'Specialist Letters':
      return 'Specialist Letter';
    case 'Hospital Visits':
      return 'Hospital Visit';
    case 'Clinic Visits':
    case 'Chronic Care':
      return 'Clinic Visit';
    case 'Operations':
      return 'Operation';
    case 'Discharge Summaries':
      return 'Discharge Summary';
    case 'Vaccinations':
      return 'Vaccination';
    default:
      return 'Other';
  }
}

export function recordToTimelineSummary(record: MedicalRecord): string {
  if (seedSummaries[record.id]) {
    return seedSummaries[record.id];
  }
  if (record.diagnosis) {
    const diag = record.diagnosis.trim();
    if (record.followUp) {
      return `${diag}. ${record.followUp}`;
    }
    return diag;
  }
  if (record.clinicalNotes) {
    const firstSentence = record.clinicalNotes.split(/\.\s+/)[0]?.trim();
    if (firstSentence && firstSentence.length > 5) {
      return firstSentence.endsWith('.') ? firstSentence : `${firstSentence}.`;
    }
    return record.clinicalNotes.slice(0, 120);
  }
  return 'Clinical encounter recorded.';
}

export function recordToTimelineEvent(record: MedicalRecord): TimelineEvent {
  return {
    id: `tl-${record.id}`,
    date: record.eventDate,
    type: categoryToTimelineType(record.category),
    title: record.title,
    facility: record.facility,
    provider: record.doctor || record.facility || 'Healthcare Provider',
    summary: recordToTimelineSummary(record),
    recordId: record.id,
  };
}

export function deriveTimelineEvents(records: MedicalRecord[]): TimelineEvent[] {
  return records
    .map(recordToTimelineEvent)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function extractHba1cFromRecord(record: MedicalRecord): number | null {
  // 1. Check extracted key-value fields first
  if (record.fields && record.fields.length > 0) {
    for (const f of record.fields) {
      if (/hba1c|glycated\s*h(a|e)moglobin|a1c/i.test(f.label)) {
        const num = parseFloat(f.value.replace(/[^0-9.]/g, ''));
        if (!isNaN(num) && num >= 3 && num <= 20) {
          return +(num.toFixed(1));
        }
      }
    }
  }

  // 2. Scan diagnosis and clinical notes for HbA1c patterns
  const text = `${record.title} ${record.diagnosis || ''} ${record.clinicalNotes || ''}`;
  const match = text.match(/HbA1c\s*(?:level|result|value|count)?\s*(?:is|was|of|:)?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i);
  if (match && match[1]) {
    const num = parseFloat(match[1]);
    if (!isNaN(num) && num >= 3 && num <= 20) {
      return +(num.toFixed(1));
    }
  }

  return null;
}

export function deriveHba1cSeries(records: MedicalRecord[]): Hba1cPoint[] {
  const pointsFromRecords: Hba1cPoint[] = [];

  for (const record of records) {
    const val = extractHba1cFromRecord(record);
    if (val !== null && record.eventDate) {
      pointsFromRecords.push({
        date: record.eventDate,
        value: val,
      });
    }
  }

  // Combine with baseline points
  const mapByDate = new Map<string, number>();

  for (const p of HISTORICAL_HBA1C_BASELINE) {
    mapByDate.set(p.date, p.value);
  }

  // Record points override or add new entries
  for (const p of pointsFromRecords) {
    mapByDate.set(p.date, p.value);
  }

  // Chronologically ascending for line charts
  return Array.from(mapByDate.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
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

export const timelineProviders: string[] = Array.from(
  new Set(timelineEvents.map((e) => e.facility))
);

export function sortedTimeline(records?: MedicalRecord[]): TimelineEvent[] {
  if (records && records.length > 0) {
    return deriveTimelineEvents(records);
  }
  return [...timelineEvents].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const hba1cSeries: Hba1cPoint[] = [
  { date: '2024-09-15', value: 8.6 },
  { date: '2025-09-10', value: 8.2 },
  { date: '2026-03-04', value: 7.8 },
  { date: '2026-09-02', value: 7.1 },
];
