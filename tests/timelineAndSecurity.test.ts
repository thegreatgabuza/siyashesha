import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { MedicalRecord } from '@/data/records';
import { medicalRecords } from '@/data/records';
import { medicationsSeed } from '@/data/medications';
import { appointmentsSeed } from '@/data/appointments';
import { diaryNotesSeed } from '@/data/diarySeed';
import { sharingHistorySeed } from '@/data/sharing';
import { auditSeed } from '@/data/audit';
import { patient } from '@/data/patient';
import {
  categoryToTimelineType,
  deriveHba1cSeries,
  hba1cSeries,
  HISTORICAL_HBA1C_BASELINE,
  recordToTimelineSummary,
  timelineEvents,
} from '@/data/timeline';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walkFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

describe('Clinical Timeline derivation & API Key Hardening (#4)', () => {
  it('maps medical record categories to clinical timeline event types', () => {
    assert.equal(categoryToTimelineType('Blood Tests'), 'Lab Result');
    assert.equal(categoryToTimelineType('Radiology'), 'Lab Result');
    assert.equal(categoryToTimelineType('Prescriptions'), 'Prescription');
    assert.equal(categoryToTimelineType('Discharge Summaries'), 'Discharge Summary');
    assert.equal(categoryToTimelineType('Vaccinations'), 'Vaccination');
  });

  it('extracts concise timeline summaries and HbA1c trend series from records', () => {
    const record: MedicalRecord = {
      id: 'rec_custom_hba1c',
      title: 'HbA1c Follow-up Lab',
      category: 'Blood Tests',
      sourceType: 'Upload',
      documentType: 'Pathology Report',
      facility: 'PathCare Sandton',
      doctor: 'Dr N. Mokoena',
      eventDate: '2026-10-01',
      uploadedAt: '2026-10-01',
      status: 'Patient confirmed',
      diagnosis: 'Glycaemic control improved',
      followUp: 'Repeat in 6 months',
      clinicalNotes: 'HbA1c measured at 6.8%.',
      fields: [{ label: 'HbA1c', value: '6.8%' }],
    };

    assert.equal(
      recordToTimelineSummary(record),
      'Glycaemic control improved. Repeat in 6 months'
    );

    const series = deriveHba1cSeries([record]);
    const latest = series[series.length - 1];
    assert.ok(latest, 'Expected HbA1c series point');
    assert.equal(latest.value, 6.8);
    assert.equal(latest.date, '2026-10-01');
  });

  it('enforces zero client-side Gemini API keys in src/ and .env files (#4 security audit)', () => {
    const srcFiles = walkFiles(path.join(ROOT_DIR, 'src'));
    for (const file of srcFiles) {
      const content = fs.readFileSync(file, 'utf8');
      assert.equal(
        content.includes('EXPO_PUBLIC_GEMINI_API_KEY'),
        false,
        `Client source file ${path.relative(ROOT_DIR, file)} must not reference EXPO_PUBLIC_GEMINI_API_KEY`
      );
      assert.equal(
        /AIzaSy[A-Za-z0-9_-]{33}/.test(content),
        false,
        `Client source file ${path.relative(ROOT_DIR, file)} must not contain a hardcoded Google API key`
      );
    }

    for (const envName of ['.env', '.env.local', '.env.example']) {
      const envPath = path.join(ROOT_DIR, envName);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        assert.equal(
          content.includes('EXPO_PUBLIC_GEMINI_API_KEY'),
          false,
          `${envName} must not expose EXPO_PUBLIC_GEMINI_API_KEY to the client bundle`
        );
        assert.equal(
          content.includes('http://localhost:3000'),
          false,
          `${envName} must not contain development localhost:3000 API URLs`
        );
      }
    }

    const easConfig = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'eas.json'), 'utf8'));
    const prodEnv = { ...(easConfig.build?.base?.env ?? {}), ...(easConfig.build?.production?.env ?? {}) };
    assert.equal(
      String(prodEnv.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '').startsWith('pk_test_'),
      false,
      'eas.json production profile must not inherit or hardcode a Clerk pk_test_ key'
    );
  });

  it('enforces zero pre-seeded mock data across all production data modules', () => {
    assert.equal(patient.firstName, '');
    assert.equal(patient.lastName, '');
    assert.equal(patient.idNumber, '');
    assert.equal(medicalRecords.length, 0);
    assert.equal(medicationsSeed.length, 0);
    assert.equal(appointmentsSeed.length, 0);
    assert.equal(diaryNotesSeed.length, 0);
    assert.equal(sharingHistorySeed.length, 0);
    assert.equal(auditSeed.length, 0);
    assert.equal(timelineEvents.length, 0);
    assert.equal(hba1cSeries.length, 0);
    assert.equal(HISTORICAL_HBA1C_BASELINE.length, 0);
  });
});
