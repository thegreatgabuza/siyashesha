export type RecordCategory =
  | 'Blood Tests'
  | 'Radiology'
  | 'Prescriptions'
  | 'Discharge Summaries'
  | 'Hospital Visits'
  | 'Clinic Visits'
  | 'Operations'
  | 'Specialist Letters'
  | 'Vaccinations'
  | 'Chronic Care'
  | 'Other';

export const recordCategories: RecordCategory[] = [
  'Blood Tests',
  'Radiology',
  'Prescriptions',
  'Discharge Summaries',
  'Hospital Visits',
  'Clinic Visits',
  'Operations',
  'Specialist Letters',
  'Vaccinations',
  'Chronic Care',
  'Other',
];

export interface RecordField {
  label: string;
  value: string;
}

/** The file the patient gave us, copied into the app's own storage. */
export interface OriginalFile {
  uri: string;
  name: string;
  mimeType: string;
  remoteUrl?: string;
  storagePath?: string;
}

export interface MedicalRecord {
  id: string;
  originalFile?: OriginalFile;
  category: RecordCategory;
  title: string;
  facility: string;
  doctor?: string;
  eventDate: string;
  uploadedAt: string;
  sourceType: 'Upload' | 'Scan' | 'Manual';
  documentType: string;
  diagnosis?: string;
  followUp?: string;
  status: 'Extracted from document' | 'Patient confirmed';
  clinicalNotes: string;
  fields?: RecordField[];
}

export const medicalRecords: MedicalRecord[] = [];

export function recordsByCategory(category: RecordCategory | 'All', list: MedicalRecord[] = medicalRecords): MedicalRecord[] {
  if (category === 'All') return list;
  return list.filter((r) => r.category === category);
}

export function categoryCounts(list: MedicalRecord[] = medicalRecords): Record<RecordCategory | 'All', number> {
  const counts = { All: list.length } as Record<RecordCategory | 'All', number>;
  for (const cat of recordCategories) {
    counts[cat] = list.filter((r) => r.category === cat).length;
  }
  return counts;
}
