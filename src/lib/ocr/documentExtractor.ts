import { extractClinicalEntitiesOffline, isOnDeviceOcrAvailable, recognizeTextOnDevice } from './onDeviceOcr';
import { extractEntitiesFromTextWithGemini, extractRecordWithGeminiVision } from './geminiVisionOcr';
import type { ExtractionResult } from './types';

/**
 * Unified Document OCR & Clinical Named Entity Recognition (NER) pipeline.
 *
 * Execution Strategy:
 * 1. Checks and runs on-device OCR (iOS Vision / Android ML Kit) if available on the device.
 * 2. If on-device OCR is unavailable, fails, or is running in standard Expo Go / Web,
 *    transparently calls Google Gemini Vision API to perform high-accuracy multimodal OCR + NER.
 * 3. If offline or Gemini is unreachable, falls back to local heuristic extraction.
 */
export async function extractClinicalRecord(
  fileUri: string,
  mimeType: string = 'image/jpeg',
  fileName?: string
): Promise<ExtractionResult> {
  const start = Date.now();

  // Step 1: Attempt on-device OCR first (only for images, as native mobile OCR operates on image buffers)
  const isPdf = mimeType === 'application/pdf' || (fileName && fileName.toLowerCase().endsWith('.pdf'));

  if (!isPdf && isOnDeviceOcrAvailable()) {
    try {
      const rawText = await recognizeTextOnDevice(fileUri);
      if (rawText && rawText.trim().length > 15) {
        // Run clinical NER on the on-device extracted text
        const data = await extractEntitiesFromTextWithGemini(rawText, fileName);
        return {
          data,
          source: 'on-device',
          rawText,
          durationMs: Date.now() - start,
        };
      }
    } catch (err) {
      console.warn('[Extractor] On-device OCR attempt failed, proceeding to Gemini Vision fallback:', err);
    }
  }

  // Step 2: Gemini Multimodal Vision API (handles both high-res medical photos and PDF documents)
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

  // Step 3: Resilient offline heuristic fallback
  const fallbackData = extractClinicalEntitiesOffline(fileName || '', fileName);
  return {
    data: fallbackData,
    source: 'offline-heuristic',
    durationMs: Date.now() - start,
  };
}

export * from './types';
export { isOnDeviceOcrAvailable } from './onDeviceOcr';
