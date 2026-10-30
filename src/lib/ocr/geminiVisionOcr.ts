import dayjs from 'dayjs';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { recordCategories, type RecordCategory } from '@/data/records';
import { extractClinicalEntitiesOffline } from './onDeviceOcr';
import type { ExtractedClinicalRecord } from './types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

const CANDIDATE_MODELS = [
  process.env.EXPO_PUBLIC_GEMINI_MODEL,
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
].filter((m): m is string => Boolean(m) && m !== 'gemini-flash-latest');

const MODELS_TO_TRY = Array.from(new Set(CANDIDATE_MODELS));

const CLINICAL_NER_PROMPT = `You are an expert Clinical OCR and Named Entity Recognition (NER) system tailored for the South African healthcare ecosystem (public clinics/CHCs, private hospitals, Lancet, Ampath, NHLS, Dis-Chem, Rosebank Family Practice, etc.).

Analyze the document carefully, transcribe the clinical findings, and extract structured medical metadata into this exact JSON format:
{
  "title": "Concise, professional title (e.g. 'HbA1c & Lipogram Panel', 'Chronic Prescription — Metformin', 'Chest X-Ray Report', 'Discharge Summary — Charlotte Maxeke Hospital')",
  "category": "Must be exactly one of: Blood Tests, Radiology, Prescriptions, Discharge Summaries, Hospital Visits, Clinic Visits, Operations, Specialist Letters, Vaccinations, Chronic Care, Other",
  "facility": "Name of the clinic, hospital, surgery, practice, or laboratory (e.g. 'Lancet Laboratories, Bedfordview' or 'Rosebank Family Practice', or 'Not recorded')",
  "doctor": "Full name and title of the prescribing or attending clinician (e.g. 'Dr N. Mokoena' or 'Sr P. Dlamini'), or null if absent",
  "eventDate": "Date of encounter, specimen collection, or report in YYYY-MM-DD format. If only month/year or absent, use the closest visible date or today's date",
  "diagnosis": "Primary diagnosis, indication, or impression (e.g. 'Type 2 Diabetes Mellitus', 'Essential Hypertension'), or null",
  "followUp": "Follow-up instructions or recall schedule (e.g. 'Repeat in 3 months', 'Review at clinic club'), or null",
  "clinicalNotes": "Transcribed clinical verbatim text, findings, impressions, or prescription directions",
  "fields": [
    {"label": "Clinical metric name (e.g. 'HbA1c', 'Blood Pressure', 'eGFR', 'Total Cholesterol')", "value": "Value with units (e.g. '7.1%', '138/86 mmHg', '84 mL/min')"}
  ]
}
`;

/** Converts local file URI to base64 string on both native and web */
async function fileUriToBase64(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  return await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

function sanitizeCategory(cat?: string): RecordCategory {
  if (!cat) return 'Other';
  const found = recordCategories.find((c) => c.toLowerCase() === cat.trim().toLowerCase());
  return found ?? 'Other';
}

function parseGeminiJson(rawJson: string, fallbackFileName?: string): ExtractedClinicalRecord {
  try {
    const cleaned = rawJson
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    const title = parsed.title?.trim() || fallbackFileName?.replace(/\.[^/.]+$/, '') || 'Medical Record';
    const category = sanitizeCategory(parsed.category);
    const rawFacility = parsed.facility?.trim();
    const facility = rawFacility && !/^(n\/?a|unknown|none)$/i.test(rawFacility) ? rawFacility : 'Not recorded';

    const rawDoctor = parsed.doctor?.trim();
    const doctor = rawDoctor && !/^(n\/?a|none|unknown)$/i.test(rawDoctor) ? rawDoctor : undefined;

    const rawDiag = parsed.diagnosis?.trim();
    const diagnosis = rawDiag && !/^(n\/?a|none|unknown|nil)$/i.test(rawDiag) ? rawDiag : undefined;

    const rawFollowUp = parsed.followUp?.trim();
    const followUp = rawFollowUp && !/^(n\/?a|none|nil)$/i.test(rawFollowUp) ? rawFollowUp : undefined;

    const clinicalNotes = parsed.clinicalNotes?.trim() || 'Details extracted from medical document.';

    let eventDate = dayjs().format('YYYY-MM-DD');
    if (parsed.eventDate && dayjs(parsed.eventDate).isValid()) {
      eventDate = dayjs(parsed.eventDate).format('YYYY-MM-DD');
    }

    const fields = Array.isArray(parsed.fields)
      ? parsed.fields
          .filter((f: any) => f && typeof f.label === 'string' && typeof f.value === 'string')
          .map((f: any) => ({ label: f.label.trim(), value: f.value.trim() }))
      : [];

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
      confidence: 'high',
      rawText: clinicalNotes,
    };
  } catch (err) {
    console.warn('[GeminiVision] Failed to parse JSON reply from Gemini:', err);
    throw err;
  }
}

/**
 * Performs Multimodal Vision OCR and Clinical NER extraction on an image or PDF document.
 */
export async function extractRecordWithGeminiVision(
  fileUri: string,
  mimeType: string = 'image/jpeg',
  fileName?: string
): Promise<ExtractedClinicalRecord> {
  const base64Data = await fileUriToBase64(fileUri);
  const effectiveMime = mimeType === 'application/pdf' ? 'application/pdf' : mimeType.startsWith('image/') ? mimeType : 'image/jpeg';

  const payload = {
    contents: [
      {
        parts: [
          { text: CLINICAL_NER_PROMPT },
          {
            inlineData: {
              mimeType: effectiveMime,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      maxOutputTokens: 1200,
    },
  };

  for (const model of MODELS_TO_TRY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 200) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return parseGeminiJson(text, fileName);
        }
      }
      console.warn(`[GeminiVision] Model ${model} returned status ${res.status}`);
    } catch (err) {
      console.warn(`[GeminiVision] Error with model ${model}:`, err);
    }
  }

  throw new Error('All Gemini Vision model endpoints timed out or failed.');
}

/**
 * Performs Clinical NER entity extraction on raw text provided by an on-device OCR engine,
 * DOCX OpenXML document extractor, or text stream.
 */
export async function extractEntitiesFromTextWithGemini(
  rawText: string,
  fileName?: string
): Promise<ExtractedClinicalRecord> {
  const prompt = `${CLINICAL_NER_PROMPT}\n\nRAW EXTRACTED CLINICAL DOCUMENT TEXT:\n"""\n${rawText.slice(0, 15000)}\n"""`;

  const payload = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      maxOutputTokens: 1200,
    },
  };

  for (const model of MODELS_TO_TRY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 200) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return parseGeminiJson(text, fileName);
        }
      }
      console.warn(`[GeminiNER] Model ${model} returned status ${res.status}`);
    } catch (err) {
      console.warn(`[GeminiNER] Error with model ${model}:`, err);
    }
  }

  // Fallback to offline rule extractor
  return extractClinicalEntitiesOffline(rawText, fileName);
}
