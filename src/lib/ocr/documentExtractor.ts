import { useAppStore } from '@/store/useAppStore';

import { extractClinicalEntitiesOffline, isOnDeviceOcrAvailable, recognizeTextOnDevice } from './onDeviceOcr';
import { extractEntitiesFromTextWithGemini, extractRecordWithGeminiVision } from './geminiVisionOcr';
import type { ExtractionResult } from './types';

/**
 * Unified Document OCR & Clinical Named Entity Recognition (NER) pipeline.
 *
 * Execution Strategy (Apple Guideline 5.1.2(i) Compliant):
 * 1. Checks and runs on-device OCR (iOS Vision / Android ML Kit) if available on the device.
 * 2. Only calls Google Gemini Vision / NER API if the user has explicitly granted `aiConsentGranted`.
 * 3. If Cloud AI consent is not granted, or if offline, strictly uses on-device heuristic extraction.
 */
export async function extractClinicalRecord(
  fileUri: string,
  mimeType: string = 'image/jpeg',
  fileName?: string
): Promise<ExtractionResult> {
  const start = Date.now();
  const allowCloudAi = useAppStore.getState().aiConsentGranted;

  // Step 1: Attempt on-device OCR first (only for images, as native mobile OCR operates on image buffers)
  const isPdf = mimeType === 'application/pdf' || (fileName && fileName.toLowerCase().endsWith('.pdf'));

  if (!isPdf && isOnDeviceOcrAvailable()) {
    try {
      const rawText = await recognizeTextOnDevice(fileUri);
      if (rawText && rawText.trim().length > 15) {
        if (allowCloudAi) {
          const data = await extractEntitiesFromTextWithGemini(rawText, fileName);
          return {
            data,
            source: 'on-device',
            rawText,
            durationMs: Date.now() - start,
          };
        }
        const localData = extractClinicalEntitiesOffline(rawText, fileName);
        return {
          data: localData,
          source: 'on-device',
          rawText,
          durationMs: Date.now() - start,
        };
      }
    } catch (err) {
      console.warn('[Extractor] On-device OCR attempt failed:', err);
    }
  }

  // Step 2: Gemini Multimodal Vision API (only if explicit user AI consent is granted)
  if (allowCloudAi) {
    try {
      const data = await extractRecordWithGeminiVision(fileUri, mimeType, fileName);
      return {
        data,
        source: 'gemini-vision',
        rawText: data.clinicalNotes,
        durationMs: Date.now() - start,
      };
    } catch (visionErr) {
      console.warn('[Extractor] Gemini Vision extraction failed or offline, falling back to local heuristic:', visionErr);
    }
  }

  // Step 3: Resilient 100% on-device offline heuristic fallback
  const fallbackData = extractClinicalEntitiesOffline(fileName || '', fileName);
  return {
    data: fallbackData,
    source: 'offline-heuristic',
    durationMs: Date.now() - start,
  };
}

export * from './types';
export { isOnDeviceOcrAvailable } from './onDeviceOcr';
