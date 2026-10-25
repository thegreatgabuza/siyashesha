import type { RecordCategory, RecordField } from '@/data/records';

export type ExtractionSource = 'on-device' | 'gemini-vision' | 'offline-heuristic';

export interface ExtractedClinicalRecord {
  title: string;
  category: RecordCategory;
  facility: string;
  doctor?: string;
  eventDate: string;
  diagnosis?: string;
  followUp?: string;
  clinicalNotes: string;
  fields: RecordField[];
  confidence: 'high' | 'medium' | 'low';
  rawText?: string;
}

export interface ExtractionResult {
  data: ExtractedClinicalRecord;
  source: ExtractionSource;
  rawText?: string;
  durationMs: number;
}
