import type { LanguageCode } from '@/i18n/translations';
import type { MedicalRecord } from '@/data/records';
import { recordTranslationsAf, recordTranslationsZu } from '@/data/recordTranslations';

const genericTemplates: Partial<Record<LanguageCode, string>> = {
  fr: 'Ce rapport ({category}) de {facility} daté du {date} est présenté avec les noms de médicaments, doses et résultats originaux inchangés. Le dossier original en anglais reste la référence officielle.',
  de: 'Dieser Bericht ({category}) von {facility} vom {date} wird mit den ursprünglichen Medikamentennamen, Dosierungen und Ergebnissen unverändert angezeigt. Das englische Originaldokument bleibt die maßgebliche Aufzeichnung.',
  tn: 'Pego e ({category}) e tswang kwa {facility} ka letsatsi la {date} e bontshiwa ka maina a melemo, metsu le dipholo tsa mmatota di sa fetolwa. Lokwalo lwa Seesemane lo tshwarwa jaaka pego e e tlhomameng.',
  sw: 'Ripoti hii ({category}) kutoka {facility} ya tarehe {date} inaonyeshwa kwa majina ya dawa, kipimo na matokeo asilia bila kubadilishwa. Hati asili ya Kiingereza inasalia kuwa kumbukumbu rasmi.',
};

export function isFullyTranslated(lang: LanguageCode): boolean {
  return lang === 'zu' || lang === 'af';
}

export function translateRecordNotes(record: MedicalRecord, lang: LanguageCode): string {
  if (lang === 'en') return record.clinicalNotes;
  if (lang === 'zu') return recordTranslationsZu[record.id] ?? record.clinicalNotes;
  if (lang === 'af') return recordTranslationsAf[record.id] ?? record.clinicalNotes;
  const template = genericTemplates[lang];
  if (!template) return record.clinicalNotes;
  return template
    .replace('{category}', record.category)
    .replace('{facility}', record.facility)
    .replace('{date}', record.eventDate);
}

export const translationSafetyNotice =
  'AI-assisted translation — the original medical record remains the authoritative record. Medication names, doses, strengths, numerical results, units, dates and reference numbers are kept exactly as recorded.';
