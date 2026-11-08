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

export const HISTORICAL_HBA1C_BASELINE: Hba1cPoint[] = [];

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
  const mapByDate = new Map<string, number>();

  for (const record of records) {
    const val = extractHba1cFromRecord(record);
    if (val !== null && record.eventDate) {
      mapByDate.set(record.eventDate, val);
    }
  }

  return Array.from(mapByDate.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export const timelineEvents: TimelineEvent[] = [];

export const timelineProviders: string[] = [];

export function sortedTimeline(records?: MedicalRecord[]): TimelineEvent[] {
  if (records && records.length > 0) {
    return deriveTimelineEvents(records);
  }
  return [];
}

export const hba1cSeries: Hba1cPoint[] = [];
