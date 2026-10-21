import dayjs from 'dayjs';

import type { MedicalRecord, RecordCategory } from '@/data/records';

export type RecordSort = 'newest' | 'oldest' | 'title' | 'category' | 'facility';

export const recordSortOptions: { key: RecordSort; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'title', label: 'Title A–Z' },
  { key: 'category', label: 'Category' },
  { key: 'facility', label: 'Facility' },
];

/** Epoch milliseconds for a record's event date, or null when missing or invalid. */
export function eventTime(record: MedicalRecord): number | null {
  if (!record.eventDate) return null;
  const parsed = dayjs(record.eventDate);
  return parsed.isValid() ? parsed.valueOf() : null;
}

/** Text a record can be found by. Only fields the record actually contains are included. */
function searchableText(record: MedicalRecord): string {
  const dateText = eventTime(record) !== null
    ? [
        record.eventDate,
        dayjs(record.eventDate).format('D MMM YYYY'),
        dayjs(record.eventDate).format('D MMMM YYYY'),
        dayjs(record.eventDate).format('MMMM YYYY'),
      ]
    : [];
  const fieldText = (record.fields ?? []).flatMap((f) => [f.label, f.value]);
  return [
    record.title,
    record.category,
    record.documentType,
    record.facility,
    record.doctor ?? '',
    record.diagnosis ?? '',
    record.followUp ?? '',
    record.clinicalNotes,
    ...fieldText,
    ...dateText,
  ]
    .join(' \n ')
    .toLowerCase();
}

/**
 * Every word in the query must appear somewhere in the record, so "metformin 2026"
 * finds a 2026 metformin prescription. An empty query matches everything.
 */
export function matchesSearch(record: MedicalRecord, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = searchableText(record);
  return terms.every((term) => haystack.includes(term));
}

/** Sorts a copy of the list. Records with a missing or invalid date always go last. */
export function sortRecords(records: MedicalRecord[], sort: RecordSort): MedicalRecord[] {
  const byTitle = (a: MedicalRecord, b: MedicalRecord) => a.title.localeCompare(b.title);
  const byDate = (a: MedicalRecord, b: MedicalRecord, direction: 1 | -1) => {
    const ta = eventTime(a);
    const tb = eventTime(b);
    if (ta === null && tb === null) return byTitle(a, b);
    if (ta === null) return 1;
    if (tb === null) return -1;
    return direction * (ta - tb) || byTitle(a, b);
  };

  const copy = [...records];
  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => byDate(a, b, -1));
    case 'oldest':
      return copy.sort((a, b) => byDate(a, b, 1));
    case 'title':
      return copy.sort(byTitle);
    case 'category':
      return copy.sort((a, b) => a.category.localeCompare(b.category) || byDate(a, b, -1));
    case 'facility':
      return copy.sort((a, b) => a.facility.localeCompare(b.facility) || byDate(a, b, -1));
  }
}

/** Number of records in each category, from the list passed in. */
export function countByCategory(records: MedicalRecord[]): Map<RecordCategory, number> {
  const counts = new Map<RecordCategory, number>();
  for (const record of records) {
    counts.set(record.category, (counts.get(record.category) ?? 0) + 1);
  }
  return counts;
}

/** Categories that have at least one record in the full vault, in first-seen order without duplicates. */
export function distinctCategories(records: MedicalRecord[]): RecordCategory[] {
  return Array.from(new Set(records.map((r) => r.category)));
}

/** Status shown to the user, derived from the stored status value. */
export function reviewLabel(record: MedicalRecord): 'Reviewed' | 'Needs review' {
  return record.status === 'Patient confirmed' ? 'Reviewed' : 'Needs review';
}

export function formatEventDate(record: MedicalRecord): string {
  const parsed = eventTime(record);
  return parsed === null ? 'Date not recorded' : dayjs(parsed).format('D MMM YYYY');
}
