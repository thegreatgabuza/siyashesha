import dayjs from 'dayjs';
import { NativeModules, Platform } from 'react-native';

import type { RecordCategory, RecordField } from '@/data/records';
import type { ExtractedClinicalRecord } from './types';

/**
 * Checks if on-device OCR engine is accessible on the current device (iOS Vision / Android ML Kit).
 */
export function isOnDeviceOcrAvailable(): boolean {
  const hasNativeModule = Boolean(
    NativeModules.TextRecognition ||
    NativeModules.MLKitTextRecognition ||
    NativeModules.OCRManager ||
    NativeModules.ExpoTextRecognition
  );

  const hasWebDetector =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'TextDetector' in window;

  return hasNativeModule || hasWebDetector;
}

/**
 * Attempts to recognize text from an image URI using on-device OCR.
 * Returns recognized string on success, or null if on-device OCR is not available/fails.
 */
export async function recognizeTextOnDevice(imageUri: string): Promise<string | null> {
  try {
    const nativeModule =
      NativeModules.TextRecognition ||
      NativeModules.MLKitTextRecognition ||
      NativeModules.OCRManager ||
      NativeModules.ExpoTextRecognition;

    if (nativeModule && typeof nativeModule.recognize === 'function') {
      const result = await nativeModule.recognize(imageUri);
      if (typeof result === 'string' && result.trim().length > 0) {
        return result.trim();
      }
      if (result && typeof result.text === 'string' && result.text.trim().length > 0) {
        return result.text.trim();
      }
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'TextDetector' in window) {
      const TextDetectorConstructor = (window as unknown as { TextDetector: new () => { detect: (img: HTMLImageElement) => Promise<{ rawValue: string }[]> } }).TextDetector;
      const detector = new TextDetectorConstructor();
      const img = new Image();
      img.src = imageUri;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Image failed to load'));
      });
      const detections = await detector.detect(img);
      const combined = detections.map((d) => d.rawValue).join('\n').trim();
      if (combined.length > 0) {
        return combined;
      }
    }

    return null;
  } catch (err) {
    console.warn('[OnDeviceOCR] On-device recognition unavailable or threw error:', err);
    return null;
  }
}

/**
 * Offline rule-based Named Entity Recognition (NER) for South African clinical records.
 * Used when processing local text streams, DOCX OpenXML, or as an instant resilient fallback.
 */
export function extractClinicalEntitiesOffline(
  rawText: string,
  fileName?: string
): ExtractedClinicalRecord {
  const text = rawText || '';
  const lower = text.toLowerCase();
  const fileHint = (fileName || '').toLowerCase();

  // 1. Detect Category
  let category: RecordCategory = 'Other';
  if (/blood|pathology|haematology|lipogram|serology|full blood count|fbc|u&e|creatinine|hba1c|lipid profile|urinalysis/i.test(lower)) {
    category = 'Blood Tests';
  } else if (/x-ray|xray|mri|ct scan|ultrasound|sonar|mammogram|radiology|radiograph|fluoroscopy/i.test(lower)) {
    category = 'Radiology';
  } else if (/prescription|repeat script|dispense|schedule|take with meals|oral daily|po bd|po daily|mg po/i.test(lower)) {
    category = 'Prescriptions';
  } else if (/discharge summary|admitted|ward|discharge diagnosis|date of discharge/i.test(lower)) {
    category = 'Discharge Summaries';
  } else if (/specialist letter|consultation report|referral note|cardiology review|neurology report|endocrinology review/i.test(lower)) {
    category = 'Specialist Letters';
  } else if (/clinic visit|chc|phc|chronic club|community health|primary health/i.test(lower)) {
    category = 'Clinic Visits';
  } else if (/operation|procedure report|laparoscopic|cholecystectomy|theatre|surgical note/i.test(lower)) {
    category = 'Operations';
  } else if (/vaccine|vaccination|immunisation|immunization|covid-19 vaccine|tetanus/i.test(lower)) {
    category = 'Vaccinations';
  } else if (/chronic care|diabetes review|hypertension review|asthma action plan/i.test(lower)) {
    category = 'Chronic Care';
  } else if (/hospital visit|inpatient|casualty|emergency unit|trauma unit/i.test(lower)) {
    category = 'Hospital Visits';
  }

  // 2. Detect South African Healthcare Facility / Lab
  let facility = 'Not recorded';
  const facilityPatterns = [
    /Lancet Laboratories[,\s\w]*/i,
    /Ampath Laboratories[,\s\w]*/i,
    /National Health Laboratory Service|NHLS/i,
    /Rosebank Family Practice[,\s\w]*/i,
    /Milpark Hospital|Milpark Cardiology[,\s\w]*/i,
    /Edenvale Community Health Centre|Edenvale CHC/i,
    /Chris Hani Baragwanath Hospital|Bara Hospital/i,
    /Charlotte Maxeke Johannesburg Academic Hospital|Joburg Gen/i,
    /Helen Joseph Hospital/i,
    /Rahima Moosa Mother and Child Hospital/i,
    /Groote Schuur Hospital/i,
    /Tygerberg Hospital/i,
    /Steve Biko Academic Hospital/i,
    /King Edward VIII Hospital/i,
    /Addington Hospital/i,
    /Livingstone Hospital/i,
    /Netcare [A-Za-z0-9\s]+/i,
    /Mediclinic [A-Za-z0-9\s]+/i,
    /Life Healthcare [A-Za-z0-9\s]+/i,
    /Dis-Chem Pharmacy[,\s\w]*/i,
    /Clicks Pharmacy[,\s\w]*/i,
  ];

  for (const pat of facilityPatterns) {
    const match = text.match(pat);
    if (match) {
      facility = match[0].trim().replace(/,\s*$/, '');
      break;
    }
  }

  // 3. Detect Clinician / Doctor
  let doctor: string | undefined;
  const docMatch = text.match(/(?:Dr|Doctor|Sr|Sister|Prof|Professor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
  if (docMatch) {
    doctor = docMatch[0].trim();
  }

  // 4. Detect Encounter / Test Date
  let eventDate = dayjs().format('YYYY-MM-DD');
  const dateMatch =
    text.match(/\b(\d{4}[-/]\d{2}[-/]\d{2})\b/) ||
    text.match(/\b(\d{1,2}[-/]\d{1,2}[-/]\d{4})\b/);

  if (dateMatch) {
    const parsed = dayjs(dateMatch[1]);
    if (parsed.isValid() && parsed.isBefore(dayjs().add(1, 'year')) && parsed.isAfter(dayjs('1900-01-01'))) {
      eventDate = parsed.format('YYYY-MM-DD');
    }
  }

  // 5. Detect Diagnosis or Reason
  let diagnosis: string | undefined;
  const diagMatch = text.match(/(?:Diagnosis|Final Diagnosis|Impression|Assessment|Condition|Indication)[:\s]+([^\n\r.]{3,70})/i);
  if (diagMatch && diagMatch[1]) {
    diagnosis = diagMatch[1].trim();
  }

  // 6. Detect Follow-up Plan
  let followUp: string | undefined;
  const followUpMatch = text.match(/(?:Follow-up|Follow up|Plan|Review in|Recall)[:\s]+([^\n\r.]{3,70})/i);
  if (followUpMatch && followUpMatch[1]) {
    followUp = followUpMatch[1].trim();
  }

  // 7. Extract Structured Clinical Metrics (BP, HbA1c, Glucose, eGFR, etc.)
  const fields: RecordField[] = [];

  const bpMatch = text.match(/\b(?:BP|Blood Pressure)[:\s]+(\d{2,3}\/\d{2,3}(?:\s*mmHg)?)/i);
  if (bpMatch) {
    fields.push({ label: 'Blood Pressure', value: bpMatch[1] });
  }

  const hba1cMatch = text.match(/\b(?:HbA1c|HBA1C)[:\s]+(\d+(?:\.\d+)?\s*%)/i);
  if (hba1cMatch) {
    fields.push({ label: 'HbA1c', value: hba1cMatch[1] });
  }

  const glucoseMatch = text.match(/\b(?:Glucose|Blood Sugar|Fasting Glucose)[:\s]+(\d+(?:\.\d+)?\s*(?:mmol\/[Ll]|mg\/[Dd][Ll]))/i);
  if (glucoseMatch) {
    fields.push({ label: 'Blood Glucose', value: glucoseMatch[1] });
  }

  const cholMatch = text.match(/\b(?:Total Cholesterol|Cholesterol)[:\s]+(\d+(?:\.\d+)?\s*(?:mmol\/[Ll]|mg\/[Dd][Ll]))/i);
  if (cholMatch) {
    fields.push({ label: 'Total Cholesterol', value: cholMatch[1] });
  }

  const egfrMatch = text.match(/\b(?:eGFR|GFR)[:\s]+(>?\s*\d+(?:\.\d+)?\s*(?:mL\/min)?)/i);
  if (egfrMatch) {
    fields.push({ label: 'eGFR', value: egfrMatch[1] });
  }

  const creatMatch = text.match(/\b(?:Creatinine|Creat)[:\s]+(\d+(?:\.\d+)?\s*(?:umol\/[Ll]|mg\/[Dd][Ll]))/i);
  if (creatMatch) {
    fields.push({ label: 'Creatinine', value: creatMatch[1] });
  }

  const weightMatch = text.match(/\b(?:Weight|Wt)[:\s]+(\d+(?:\.\d+)?\s*kg)/i);
  if (weightMatch) {
    fields.push({ label: 'Weight', value: weightMatch[1] });
  }

  const pulseMatch = text.match(/\b(?:Pulse|Heart Rate|HR)[:\s]+(\d{2,3}\s*(?:bpm)?)/i);
  if (pulseMatch) {
    fields.push({ label: 'Heart Rate', value: pulseMatch[1] });
  }

  // 8. Generate Clean, Professional Title
  let title = 'Clinical Record';
  if (category === 'Blood Tests') {
    title = fields.some((f) => f.label === 'HbA1c')
      ? 'HbA1c & Pathology Panel'
      : fields.some((f) => f.label === 'Total Cholesterol')
      ? 'Lipogram & Lipid Profile'
      : 'Blood Tests & Lab Panel';
  } else if (category === 'Radiology') {
    title = /chest/i.test(lower) ? 'Chest Radiograph Report' : 'Radiology Diagnostic Report';
  } else if (category === 'Prescriptions') {
    title = 'Prescription Order';
  } else if (category === 'Discharge Summaries') {
    title = facility !== 'Not recorded' ? `Discharge Summary — ${facility}` : 'Hospital Discharge Summary';
  } else if (category === 'Specialist Letters') {
    title = doctor ? `Specialist Letter — ${doctor}` : 'Specialist Clinical Letter';
  } else if (category === 'Chronic Care') {
    title = diagnosis ? `Chronic Review — ${diagnosis}` : 'Chronic Care Review';
  } else if (fileName && !fileHint.startsWith('image') && !fileHint.startsWith('scanned')) {
    title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  const clinicalNotes = text.length > 0
    ? text.slice(0, 450).trim()
    : 'Document uploaded to your health passport. Review details before saving.';

  return {
    title,
    category,
    facility,
    doctor,
    eventDate,
    diagnosis,
    followUp,
    clinicalNotes,
    fields,
    confidence: text.length > 50 ? 'medium' : 'low',
    rawText: text,
  };
}
