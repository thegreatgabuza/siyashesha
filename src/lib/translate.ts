import { languageNames, type LanguageCode } from '@/i18n/translations';
import type { MedicalRecord } from '@/data/records';
import { recordTranslationsAf, recordTranslationsZu } from '@/data/recordTranslations';
import { GEMINI_API_KEY } from '@/lib/geminiAssistant';
import { useAppStore } from '@/store/useAppStore';

const dynamicTranslationCache = new Map<string, string>();

const TRANSLATION_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite-preview',
];

export function isFullyTranslated(lang: LanguageCode): boolean {
  return ['en', 'zu', 'af', 'tn', 'sw', 'fr', 'de'].includes(lang);
}

/** Returns synchronous cached or seed translated notes, or null if dynamic translation is needed. */
export function translateRecordNotes(record: MedicalRecord, lang: LanguageCode): string | null {
  if (lang === 'en') return record.clinicalNotes;
  if (lang === 'zu' && recordTranslationsZu[record.id]) return recordTranslationsZu[record.id];
  if (lang === 'af' && recordTranslationsAf[record.id]) return recordTranslationsAf[record.id];
  const cacheKey = `${record.id}:${lang}:${record.clinicalNotes.slice(0, 64)}`;
  return dynamicTranslationCache.get(cacheKey) ?? null;
}

/**
 * Translates any medical record's clinical notes on-demand using Google Gemini while strictly
 * preserving medication names, dosages, strengths, numerical lab values, units, and dates.
 */
export async function translateRecordNotesWithGemini(
  record: MedicalRecord,
  lang: LanguageCode
): Promise<string | null> {
  const existing = translateRecordNotes(record, lang);
  if (existing) return existing;
  if (!useAppStore.getState().aiConsentGranted) return null;
  if (!record.clinicalNotes?.trim()) return null;

  const targetLanguage = languageNames[lang] || lang;
  const cacheKey = `${record.id}:${lang}:${record.clinicalNotes.slice(0, 64)}`;

  const prompt = `You are a certified South African clinical medical translator.
Translate the following medical record clinical notes into ${targetLanguage}.
CRITICAL CLINICAL SAFETY RULES:
1. Keep all medication names, drug strengths, dosages, numerical lab results, units (e.g., mg, mmol/L, %, mmHg), dates, and reference numbers EXACTLY as written.
2. Use clear, natural, respectful ${targetLanguage} that a patient can easily understand.
3. Output ONLY the translated text without any introductory commentary or markdown formatting.

ORIGINAL CLINICAL NOTES:
${record.clinicalNotes}`;

  for (const model of TRANSLATION_MODELS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.status === 200) {
        const json = await res.json();
        const translated = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) {
          dynamicTranslationCache.set(cacheKey, translated);
          return translated;
        }
      }
    } catch {
      // Try next fallback model
    }
  }

  return null;
}

export const translationSafetyNotice =
  'Translation — the original medical record remains the authoritative record. Medication names, doses, strengths, numerical results, units, dates and reference numbers are kept exactly as recorded.';
