import dayjs from 'dayjs';
import { NativeModules, Platform } from 'react-native';

import type { RecordCategory, RecordField } from '@/data/records';
import type { ExtractedClinicalRecord } from './types';

/**
 * Checks if on-device OCR engine is accessible on the current device (iOS Vision / Android ML Kit).
 */
export function isOnDeviceOcrAvailable(): boolean {
  // Check for any registered native OCR modules (e.g., from custom development builds)
  const hasNativeModule = Boolean(
    NativeModules.TextRecognition ||
    NativeModules.MLKitTextRecognition ||
    NativeModules.OCRManager ||
    NativeModules.ExpoTextRecognition
  );

  // Check Web TextDetector API if in a supported browser environment
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
    // 1. Check native modules (iOS VisionKit / Android ML Kit)
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

    // 2. Check Web TextDetector API
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
 * Used when on-device OCR provides raw text, or as an instant local fallback.
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
  if (/blood|pathology|haematology|lipogram|serology|full blood count|fbc|u&e|creatinine/i.test(lower)) {
    category = 'Blood Tests';
  } else if (/x-ray|xray|mri|ct scan|ultrasound|sonar|mammogram|radiology/i.test(lower)) {
    category = 'Radiology';
  } else if (/prescription|repeat script|dispense|schedule|take with meals|oral daily/i.test(lower)) {
    category = 'Prescriptions';
  } else if (/discharge summary|admitted|ward|discharge diagnosis/i.test(lower)) {
    category = 'Discharge Summaries';
  } else if (/specialist letter|consultation report|referral note|cardiology review/i.test(lower)) {
    category = 'Specialist Letters';
  } else if (/clinic visit|chc|phc|chronic club|community health/i.test(lower)) {
    category = 'Clinic Visits';
  } else if (/operation|procedure report|laparoscopic|cholecystectomy|theatre/i.test(lower)) {
    category = 'Operations';
  } else if (/vaccine|vaccination|immunisation|immunization/i.test(lower)) {
    category = 'Vaccinations';
  } else if (/chronic care|diabetes|hypertension|asthma/i.test(lower)) {
    category = 'Chronic Care';
  } else if (/hospital|casualty|inpatient/i.test(lower)) {
    category = 'Hospital Visits';
  }

  // 2. Detect South African Healthcare Facility
  let facility = 'Not recorded';
  const facilityPatterns = [
    /Lancet Laboratories[,\s\w]*/i,
    /Ampath Laboratories[,\s\w]*/i,
    /National Health Laboratory Service|NHLS/i,
    /Rosebank Family Practice[,\s\w]*/i,
    /Milpark Cardiology[,\s\w]*/i,
    /Edenvale Community Health Centre|Edenvale CHC/i,
    /Chris Hani Baragwanath Hospital/i,
    /Charlotte Maxeke Johannesburg Academic Hospital/i,
    /Helen Joseph Hospital/i,
    /Netcare [A-Za-z\s]+/i,
    /Mediclinic [A-Za-z\s]+/i,
    /Life Healthcare [A-Za-z\s]+/i,
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
  const docMatch = text.match(/(?:Dr|Doctor|Sr|Sister)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
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
    if (parsed.isValid()) {
      eventDate = parsed.format('YYYY-MM-DD');
    }
  }

  // 5. Extract Structured Clinical Metrics (BP, HbA1c, Glucose, etc.)
  const fields: RecordField[] = [];

  const bpMatch = text.match(/\b(?:BP|Blood Pressure)[:\s]+(\d{2,3}\/\d{2,3}(?:\s*mmHg)?)/i);
  if (bpMatch) {
    fields.push({ label: 'Blood Pressure', value: bpMatch[1] });
  }

  const hba1cMatch = text.match(/\b(?:HbA1c|HBA1C)[:\s]+(\d+(?:\.\d+)?\s*%)/i);
  if (hba1cMatch) {
    fields.push({ label: 'HbA1c', value: hba1cMatch[1] });
  }

  const glucoseMatch = text.match(/\b(?:Glucose|Blood Sugar)[:\s]+(\d+(?:\.\d+)?\s*(?:mmol\/[Ll]|mg\/[Dd][Ll]))/i);
  if (glucoseMatch) {
    fields.push({ label: 'Blood Glucose', value: glucoseMatch[1] });
  }

  const weightMatch = text.match(/\b(?:Weight|Wt)[:\s]+(\d+(?:\.\d+)?\s*kg)/i);
  if (weightMatch) {
    fields.push({ label: 'Weight', value: weightMatch[1] });
  }

  // 6. Generate Clean Title
  let title = 'Clinical Record';
  if (category === 'Blood Tests') {
    title = fields.some((f) => f.label === 'HbA1c')
      ? 'HbA1c & Pathology Panel'
      : 'Blood Tests & Lab Panel';
  } else if (category === 'Radiology') {
    title = 'Radiology Diagnostic Report';
  } else if (category === 'Prescriptions') {
    title = 'Prescription Order';
  } else if (category === 'Discharge Summaries') {
    title = 'Hospital Discharge Summary';
  } else if (category === 'Specialist Letters') {
    title = doctor ? `Specialist Letter — ${doctor}` : 'Specialist Clinical Letter';
  } else if (category === 'Chronic Care') {
    title = 'Chronic Care Review';
  } else if (fileName && !fileHint.startsWith('image') && !fileHint.startsWith('scanned')) {
    title = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  return {
    title,
    category,
    facility,
    doctor,
    eventDate,
    diagnosis: undefined,
    followUp: undefined,
    clinicalNotes: text.slice(0, 300).trim() || 'Record scanned on device. Review details before saving.',
    fields,
    confidence: text.length > 50 ? 'medium' : 'low',
    rawText: text,
  };
}
