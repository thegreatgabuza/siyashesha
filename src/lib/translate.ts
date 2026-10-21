import type { LanguageCode } from '@/i18n/translations';
import type { MedicalRecord } from '@/data/records';
import { recordTranslationsAf, recordTranslationsZu } from '@/data/recordTranslations';

export function isFullyTranslated(lang: LanguageCode): boolean {
  return lang === 'zu' || lang === 'af';
}

/** Returns the translated notes, or null when this record has no translation in that language. */
export function translateRecordNotes(record: MedicalRecord, lang: LanguageCode): string | null {
  if (lang === 'en') return record.clinicalNotes;
  if (lang === 'zu') return recordTranslationsZu[record.id] ?? null;
  if (lang === 'af') return recordTranslationsAf[record.id] ?? null;
  return null;
}

export const translationSafetyNotice =
  'Translation — the original medical record remains the authoritative record. Medication names, doses, strengths, numerical results, units, dates and reference numbers are kept exactly as recorded.';
