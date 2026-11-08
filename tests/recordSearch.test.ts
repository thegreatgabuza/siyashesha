import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { MedicalRecord } from '@/data/records';
import {
  countByCategory,
  distinctCategories,
  groupByMonth,
  matchesSearch,
  reviewLabel,
  sortRecords,
} from '@/lib/recordSearch';

const sampleRecords: MedicalRecord[] = [
  {
    id: 'rec_1',
    title: 'Full Blood Count & HbA1c Panel',
    category: 'Blood Tests',
    sourceType: 'Upload',
    documentType: 'Pathology Report',
    facility: 'Lancet Laboratories Rosebank',
    doctor: 'Dr S. Patel',
    eventDate: '2026-09-14',
    uploadedAt: '2026-09-15',
    status: 'Patient confirmed',
    diagnosis: 'Type 2 Diabetes Follow-up',
    clinicalNotes: 'HbA1c improved to 6.4%. Continue Metformin 500mg.',
    fields: [{ label: 'HbA1c', value: '6.4%' }],
  },
  {
    id: 'rec_2',
    title: 'Chest X-Ray PA View',
    category: 'Radiology',
    sourceType: 'Scan',
    documentType: 'Radiology Report',
    facility: 'Netcare Milpark Radiology',
    doctor: 'Dr K. Naidoo',
    eventDate: '2026-03-02',
    uploadedAt: '2026-03-03',
    status: 'Extracted from document',
    diagnosis: 'Clear lung fields',
    clinicalNotes: 'No acute cardiopulmonary abnormality.',
    fields: [],
  },
  {
    id: 'rec_3',
    title: 'Amlodipine & Metformin Chronic Script',
    category: 'Prescriptions',
    sourceType: 'Upload',
    documentType: 'Chronic Prescription',
    facility: 'Dis-Chem Sandton',
    doctor: 'Dr S. Patel',
    eventDate: '2026-09-20',
    uploadedAt: '2026-09-20',
    status: 'Patient confirmed',
    clinicalNotes: '6-month repeat script.',
    fields: [],
  },
];

describe('Medical Record Vault search, sorting & grouping', () => {
  it('matches multi-word queries across title, facility, diagnosis, and extracted fields', () => {
    assert.equal(matchesSearch(sampleRecords[0], ''), true);
    assert.equal(matchesSearch(sampleRecords[0], 'metformin 6.4%'), true);
    assert.equal(matchesSearch(sampleRecords[0], 'lancet september 2026'), true);
    assert.equal(matchesSearch(sampleRecords[0], 'radiology'), false);
  });

  it('sorts records by newest, oldest, title, category, and facility', () => {
    const newest = sortRecords(sampleRecords, 'newest');
    assert.deepEqual(
      newest.map((r) => r.id),
      ['rec_3', 'rec_1', 'rec_2']
    );

    const oldest = sortRecords(sampleRecords, 'oldest');
    assert.deepEqual(
      oldest.map((r) => r.id),
      ['rec_2', 'rec_1', 'rec_3']
    );

    const byTitle = sortRecords(sampleRecords, 'title');
    assert.deepEqual(
      byTitle.map((r) => r.id),
      ['rec_3', 'rec_2', 'rec_1']
    );
  });

  it('aggregates category counts, distinct categories, review labels, and monthly groups', () => {
    const counts = countByCategory(sampleRecords);
    assert.equal(counts.get('Blood Tests'), 1);
    assert.equal(counts.get('Radiology'), 1);
    assert.equal(counts.get('Prescriptions'), 1);

    assert.deepEqual(distinctCategories(sampleRecords), [
      'Blood Tests',
      'Radiology',
      'Prescriptions',
    ]);

    assert.equal(reviewLabel(sampleRecords[0]), 'Reviewed');
    assert.equal(reviewLabel(sampleRecords[1]), 'Needs review');

    const sortedNewest = sortRecords(sampleRecords, 'newest');
    const grouped = groupByMonth(sortedNewest);
    assert.equal(grouped.length, 2);
    assert.equal(grouped[0].label, 'September 2026');
    assert.equal(grouped[0].records.length, 2);
    assert.equal(grouped[1].label, 'March 2026');
    assert.equal(grouped[1].records.length, 1);
  });
});
