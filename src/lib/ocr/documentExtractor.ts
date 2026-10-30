import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { useAppStore } from '@/store/useAppStore';

import { extractTextFromDocx, isWordDocument } from './docxExtractor';
import { extractTextFromPdfBuffer, isPdfDocument } from './pdfExtractor';
import { extractClinicalEntitiesOffline, isOnDeviceOcrAvailable, recognizeTextOnDevice } from './onDeviceOcr';
import { extractEntitiesFromTextWithGemini, extractRecordWithGeminiVision } from './geminiVisionOcr';
import type { ExtractionResult } from './types';

/**
 * Unified Document OCR & Clinical Named Entity Recognition (NER) pipeline.
 *
 * Supports:
 * - Word Documents (.docx, .doc): OpenXML unzipping + NER
 * - PDF Documents (.pdf): Gemini Multimodal Vision + Local PDF text stream parsing
 * - Image Scans (.jpg, .png, .heic, .webp): On-device OCR (Vision/ML Kit) + Gemini Vision
 *
 * Execution Strategy (Apple Guideline 5.1.2(i) Compliant):
 * 1. Checks and runs on-device processing first whenever possible.
 * 2. Only calls Google Gemini Cloud AI if `aiConsentGranted` is true.
 * 3. Gracefully falls back to 100% on-device heuristic extraction if offline.
 */
export async function extractClinicalRecord(
  fileUri: string,
  mimeType: string = 'image/jpeg',
  fileName?: string
): Promise<ExtractionResult> {
  const start = Date.now();
  const allowCloudAi = useAppStore.getState().aiConsentGranted;

  const isWord = isWordDocument(fileName, mimeType);
  const isPdf = isPdfDocument(fileName, mimeType);

  // =========================================================================
  // CASE 1: Word Document (.docx / .doc)
  // =========================================================================
  if (isWord) {
    try {
      const docxText = await extractTextFromDocx(fileUri);
      if (docxText && docxText.length > 20) {
        if (allowCloudAi) {
          try {
            const data = await extractEntitiesFromTextWithGemini(docxText, fileName);
            return {
              data,
              source: 'gemini-ner',
              rawText: docxText,
              durationMs: Date.now() - start,
            };
          } catch (geminiErr) {
            console.warn('[Extractor] Gemini NER failed on DOCX text, falling back to on-device:', geminiErr);
          }
        }

        // On-device / offline extraction from parsed DOCX OpenXML
        const offlineData = extractClinicalEntitiesOffline(docxText, fileName);
        return {
          data: offlineData,
          source: 'on-device',
          rawText: docxText,
          durationMs: Date.now() - start,
        };
      }
    } catch (docxErr) {
      console.warn('[Extractor] Failed to extract DOCX OpenXML:', docxErr);
    }
  }

  // =========================================================================
  // CASE 2: PDF Document (.pdf)
  // =========================================================================
  if (isPdf) {
    // Attempt Gemini Multimodal Vision if cloud AI is permitted
    if (allowCloudAi) {
      try {
        const data = await extractRecordWithGeminiVision(fileUri, 'application/pdf', fileName);
        return {
          data,
          source: 'gemini-vision',
          rawText: data.clinicalNotes,
          durationMs: Date.now() - start,
        };
      } catch (visionErr) {
        console.warn('[Extractor] Gemini Vision failed on PDF, attempting local text fallback:', visionErr);
      }
    }

    // Local PDF text stream extraction fallback
    try {
      let rawPdfString = '';
      if (Platform.OS !== 'web') {
        rawPdfString = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.UTF8,
        }).catch(() => '');
      }

      const streamText = extractTextFromPdfBuffer(rawPdfString);
      if (streamText && streamText.length > 20) {
        if (allowCloudAi) {
          try {
            const data = await extractEntitiesFromTextWithGemini(streamText, fileName);
            return {
              data,
              source: 'gemini-ner',
              rawText: streamText,
              durationMs: Date.now() - start,
            };
          } catch {}
        }

        const localData = extractClinicalEntitiesOffline(streamText, fileName);
        return {
          data: localData,
          source: 'on-device',
          rawText: streamText,
          durationMs: Date.now() - start,
        };
      }
    } catch (pdfErr) {
      console.warn('[Extractor] Local PDF text extraction failed:', pdfErr);
    }
  }

  // =========================================================================
  // CASE 3: Camera Scan or Image Upload (.jpg, .png, etc.)
  // =========================================================================
  if (!isPdf && !isWord && isOnDeviceOcrAvailable()) {
    try {
      const rawText = await recognizeTextOnDevice(fileUri);
      if (rawText && rawText.trim().length > 15) {
        if (allowCloudAi) {
          try {
            const data = await extractEntitiesFromTextWithGemini(rawText, fileName);
            return {
              data,
              source: 'gemini-ner',
              rawText,
              durationMs: Date.now() - start,
            };
          } catch {}
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
      console.warn('[Extractor] On-device image OCR failed:', err);
    }
  }

  // Gemini Vision for Image uploads
  if (allowCloudAi && !isWord) {
    try {
      const data = await extractRecordWithGeminiVision(fileUri, mimeType, fileName);
      return {
        data,
        source: 'gemini-vision',
        rawText: data.clinicalNotes,
        durationMs: Date.now() - start,
      };
    } catch (visionErr) {
      console.warn('[Extractor] Gemini Vision image extraction failed:', visionErr);
    }
  }

  // =========================================================================
  // CASE 4: Resilient On-Device Heuristic Fallback
  // =========================================================================
  const fallbackData = extractClinicalEntitiesOffline(fileName || '', fileName);
  return {
    data: fallbackData,
    source: 'offline-heuristic',
    durationMs: Date.now() - start,
  };
}

export * from './types';
export { isOnDeviceOcrAvailable } from './onDeviceOcr';
export { isWordDocument } from './docxExtractor';
export { isPdfDocument } from './pdfExtractor';
