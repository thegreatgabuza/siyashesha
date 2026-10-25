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

export const medicalRecords: MedicalRecord[] = [
  {
    id: 'rec-001',
    category: 'Blood Tests',
    title: 'HbA1c, Lipogram & Renal Function Panel',
    facility: 'Lancet Laboratories, Bedfordview',
    doctor: 'Dr N. Mokoena',
    eventDate: '2026-09-02',
    uploadedAt: '2026-09-03',
    sourceType: 'Upload',
    documentType: 'Laboratory Report',
    diagnosis: 'Type 2 Diabetes Mellitus — stable glycaemic control',
    followUp: 'Repeat HbA1c in 3 months. Continue current regimen.',
    status: 'Patient confirmed',
    clinicalNotes:
      'HbA1c 7.1% (improved from 7.8%). Fasting glucose 7.4 mmol/L. LDL cholesterol 2.6 mmol/L, HDL 1.3 mmol/L, Triglycerides 1.5 mmol/L. eGFR 88 mL/min/1.73m² (normal). No evidence of diabetic nephropathy. Continue Metformin 500mg BD and lifestyle measures.',
    fields: [
      { label: 'HbA1c', value: '7.1 %' },
      { label: 'Fasting glucose', value: '7.4 mmol/L' },
      { label: 'LDL cholesterol', value: '2.6 mmol/L' },
      { label: 'HDL cholesterol', value: '1.3 mmol/L' },
      { label: 'Triglycerides', value: '1.5 mmol/L' },
      { label: 'eGFR', value: '88 mL/min/1.73m²' },
    ],
  },
  {
    id: 'rec-002',
    category: 'Blood Tests',
    title: 'HbA1c & Lipogram',
    facility: 'Lancet Laboratories, Bedfordview',
    doctor: 'Dr N. Mokoena',
    eventDate: '2026-03-04',
    uploadedAt: '2026-03-05',
    sourceType: 'Upload',
    documentType: 'Laboratory Report',
    diagnosis: 'Type 2 Diabetes Mellitus — suboptimal control',
    followUp: 'Reinforce dietary adherence. Review in 6 months.',
    status: 'Patient confirmed',
    clinicalNotes:
      'HbA1c 7.8%. Fasting glucose 8.6 mmol/L. LDL cholesterol 2.9 mmol/L. Discussed carbohydrate portion control and increased activity.',
    fields: [
      { label: 'HbA1c', value: '7.8 %' },
      { label: 'Fasting glucose', value: '8.6 mmol/L' },
      { label: 'LDL cholesterol', value: '2.9 mmol/L' },
    ],
  },
  {
    id: 'rec-003',
    category: 'Blood Tests',
    title: 'HbA1c Monitoring',
    facility: 'Lancet Laboratories, Bedfordview',
    doctor: 'Dr N. Mokoena',
    eventDate: '2025-09-10',
    uploadedAt: '2025-09-11',
    sourceType: 'Scan',
    documentType: 'Laboratory Report',
    diagnosis: 'Type 2 Diabetes Mellitus',
    followUp: 'Continue Metformin. Recheck in 6 months.',
    status: 'Extracted from document',
    clinicalNotes: 'HbA1c 8.2%. Fasting glucose 9.1 mmol/L. Patient reports inconsistent medication timing.',
    fields: [
      { label: 'HbA1c', value: '8.2 %' },
      { label: 'Fasting glucose', value: '9.1 mmol/L' },
    ],
  },
  {
    id: 'rec-004',
    category: 'Radiology',
    title: 'Abdominal Ultrasound (Pre-operative)',
    facility: 'Life Fourways Radiology',
    doctor: 'Dr T. van Wyk',
    eventDate: '2024-10-20',
    uploadedAt: '2024-10-21',
    sourceType: 'Upload',
    documentType: 'Radiology Report',
    diagnosis: 'Cholelithiasis (gallstones)',
    followUp: 'Referred for surgical consultation.',
    status: 'Patient confirmed',
    clinicalNotes:
      'Ultrasound demonstrates multiple gallstones within a thin-walled gallbladder. No pericholecystic fluid. Common bile duct not dilated. Liver, pancreas and kidneys unremarkable.',
  },
  {
    id: 'rec-005',
    category: 'Prescriptions',
    title: 'Chronic Prescription — Metformin & Amlodipine',
    facility: 'Rosebank Family Practice',
    doctor: 'Dr N. Mokoena',
    eventDate: '2026-09-02',
    uploadedAt: '2026-09-02',
    sourceType: 'Scan',
    documentType: 'Prescription',
    diagnosis: 'Type 2 Diabetes Mellitus; Hypertension',
    followUp: 'Repeat script valid for 6 months.',
    status: 'Patient confirmed',
    clinicalNotes:
      'Metformin 500mg — one tablet orally twice daily with meals. Amlodipine 5mg — one tablet orally once daily in the morning. Dispense 6 repeats.',
    fields: [
      { label: 'Metformin', value: '500 mg · twice daily' },
      { label: 'Amlodipine', value: '5 mg · once daily' },
    ],
  },
  {
    id: 'rec-006',
    category: 'Prescriptions',
    title: 'Chronic Prescription — Atorvastatin & Aspirin',
    facility: 'Milpark Cardiology',
    doctor: 'Dr S. Naidoo',
    eventDate: '2026-06-18',
    uploadedAt: '2026-06-18',
    sourceType: 'Scan',
    documentType: 'Prescription',
    diagnosis: 'Raised cholesterol; Cardiovascular risk reduction',
    followUp: 'Lipogram in 6 months.',
    status: 'Patient confirmed',
    clinicalNotes:
      'Atorvastatin 20mg — one tablet orally at night. Aspirin 81mg — one tablet orally after breakfast. Dispense 6 repeats.',
    fields: [
      { label: 'Atorvastatin', value: '20 mg · nightly' },
      { label: 'Aspirin', value: '81 mg · daily' },
    ],
  },
  {
    id: 'rec-007',
    category: 'Specialist Letters',
    title: 'Cardiology Review Letter',
    facility: 'Milpark Cardiology',
    doctor: 'Dr S. Naidoo',
    eventDate: '2026-06-18',
    uploadedAt: '2026-06-19',
    sourceType: 'Upload',
    documentType: 'Specialist Letter',
    diagnosis: 'Essential Hypertension — well controlled',
    followUp: 'Routine cardiology review in 12 months.',
    status: 'Patient confirmed',
    clinicalNotes:
      'Blood pressure 128/82 mmHg on current therapy. ECG normal sinus rhythm. Echocardiogram shows normal left ventricular function. Continue Amlodipine 5mg daily and Aspirin 81mg daily. Advise low-sodium diet and regular aerobic activity.',
  },
  {
    id: 'rec-008',
    category: 'Discharge Summaries',
    title: 'Discharge Summary — Laparoscopic Cholecystectomy',
    facility: 'Netcare Milpark Hospital',
    doctor: 'Dr R. Abrahams',
    eventDate: '2024-11-05',
    uploadedAt: '2024-11-06',
    sourceType: 'Upload',
    documentType: 'Discharge Summary',
    diagnosis: 'Symptomatic cholelithiasis',
    followUp: 'Wound check at 10 days. Resume normal diet gradually.',
    status: 'Patient confirmed',
    clinicalNotes:
      'Patient underwent elective laparoscopic cholecystectomy without complication. Post-operative recovery uneventful. Discharged on day 1 with oral analgesia. Advised to avoid heavy lifting for 4 weeks.',
  },
  {
    id: 'rec-009',
    category: 'Hospital Visits',
    title: 'Emergency Department Visit — Hypertensive Urgency',
    facility: 'Netcare Linksfield Hospital',
    doctor: 'Dr F. Khumalo',
    eventDate: '2025-01-22',
    uploadedAt: '2025-01-23',
    sourceType: 'Scan',
    documentType: 'Hospital Visit Record',
    diagnosis: 'Hypertensive urgency',
    followUp: 'Follow up with GP within 1 week. Medication adjusted.',
    status: 'Extracted from document',
    clinicalNotes:
      'Presented with headache and blood pressure 178/104 mmHg. Treated with oral antihypertensive and observed for 4 hours. Blood pressure improved to 142/88 mmHg prior to discharge. Advised to continue home medication and follow up urgently with usual GP.',
  },
  {
    id: 'rec-010',
    category: 'Clinic Visits',
    title: 'Chronic Diabetes Follow-up',
    facility: 'Edenvale Community Health Centre',
    doctor: 'Sr P. Dlamini (Professional Nurse)',
    eventDate: '2026-07-30',
    uploadedAt: '2026-07-30',
    sourceType: 'Manual',
    documentType: 'Clinic Visit Note',
    diagnosis: 'Type 2 Diabetes Mellitus; Hypertension — routine review',
    followUp: 'Return in 3 months for chronic medicine collection.',
    status: 'Patient confirmed',
    clinicalNotes:
      'Routine chronic club visit at public clinic. Weight stable, blood pressure 130/84 mmHg, random glucose 8.9 mmol/L. Foot examination normal, no ulcers. Medication collected for 3 months. Counselled on diet and exercise.',
  },
  {
    id: 'rec-011',
    category: 'Operations',
    title: 'Operation Note — Laparoscopic Cholecystectomy',
    facility: 'Netcare Milpark Hospital',
    doctor: 'Dr R. Abrahams',
    eventDate: '2024-11-04',
    uploadedAt: '2024-11-06',
    sourceType: 'Upload',
    documentType: 'Operation Note',
    diagnosis: 'Symptomatic cholelithiasis',
    followUp: 'See discharge summary for post-operative instructions.',
    status: 'Patient confirmed',
    clinicalNotes:
      'Laparoscopic cholecystectomy performed under general anaesthesia. Four-port technique. Gallbladder containing multiple stones removed intact. No bile duct injury. Estimated blood loss minimal. Patient stable throughout.',
  },
  {
    id: 'rec-012',
    category: 'Vaccinations',
    title: 'Influenza & COVID-19 Booster',
    facility: 'Clearwater Family Clinic',
    doctor: 'Dr L. Petersen',
    eventDate: '2026-04-02',
    uploadedAt: '2026-04-02',
    sourceType: 'Manual',
    documentType: 'Vaccination Record',
    diagnosis: undefined,
    followUp: 'Annual influenza vaccine recommended.',
    status: 'Patient confirmed',
    clinicalNotes:
      'Seasonal influenza vaccine (quadrivalent) administered, left deltoid. COVID-19 booster administered, right deltoid. No immediate adverse reaction observed. Advised to monitor injection sites for 24 hours.',
    fields: [
      { label: 'Influenza vaccine', value: 'Administered 2026-04-02' },
      { label: 'COVID-19 booster', value: 'Administered 2026-04-02' },
    ],
  },
];

export function getRecordsByCategory(category: RecordCategory | 'All') {
  if (category === 'All') return medicalRecords;
  return medicalRecords.filter((r) => r.category === category);
}

export function categoryCounts(): Record<RecordCategory | 'All', number> {
  const counts = { All: medicalRecords.length } as Record<RecordCategory | 'All', number>;
  for (const cat of recordCategories) {
    counts[cat] = medicalRecords.filter((r) => r.category === cat).length;
  }
  return counts;
}
