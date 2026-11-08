import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { PatientProfile } from '@/data/patient';
import { bloodGroupLabel, isKnownBloodGroup, parseBloodGroup } from '@/lib/bloodGroup';
import {
  completionPercent,
  derivePassportProgress,
  emergencyReadiness,
  nextBestStep,
} from '@/lib/passport';

const basePatient: PatientProfile = {
  firstName: 'Thabo',
  lastName: 'Mokoena',
  preferredName: 'Thabo',
  dateOfBirth: '1988-05-14',
  gender: 'Male',
  idNumber: '8805145000081',
  bloodGroup: 'O+',
  phone: '+27 82 000 1111',
  email: 'thabo@example.co.za',
  address: 'Sandton, Johannesburg',
  province: 'Gauteng',
  allergies: [
    {
      substance: 'Penicillin',
      reaction: 'Anaphylaxis',
    },
  ],
  chronicConditions: ['Hypertension'],
  previousProcedures: [],
  medicalDevices: [],
  emergencyContact: {
    name: 'Lerato Mokoena',
    relationship: 'Spouse',
    phone: '+27 82 999 0000',
  },
  emergencyContacts: [],
  memberSince: '2026-01-15',
};

describe('Safety-critical blood group parsing & ICE readiness', () => {
  it('normalizes valid ABO/Rh blood groups and rejects ambiguous strings', () => {
    assert.equal(parseBloodGroup('O+'), 'O+');
    assert.equal(parseBloodGroup('o pos'), 'O+');
    assert.equal(parseBloodGroup('ab negative'), 'AB−');
    assert.equal(parseBloodGroup('A-'), 'A−');
    assert.equal(parseBloodGroup('B−'), 'B−');

    assert.equal(parseBloodGroup('Not sure'), null);
    assert.equal(parseBloodGroup('Unknown'), null);
    assert.equal(parseBloodGroup(''), null);
    assert.equal(parseBloodGroup(null), null);

    assert.equal(isKnownBloodGroup('AB+'), true);
    assert.equal(isKnownBloodGroup('Unknown'), false);
    assert.equal(bloodGroupLabel('Not recorded'), 'Unknown');
  });

  it('computes emergencyReadiness gaps accurately for first responders', () => {
    const readyState = emergencyReadiness(basePatient);
    assert.equal(readyState.ready, true);
    assert.equal(readyState.gaps.length, 0);

    const incomplete: PatientProfile = {
      ...basePatient,
      bloodGroup: 'Unknown',
      allergies: [],
      emergencyContact: { name: '', relationship: '', phone: '   ' },
    };
    const gapState = emergencyReadiness(incomplete);
    assert.equal(gapState.ready, false);
    assert.deepEqual(
      gapState.gaps.map((g) => g.key),
      ['bloodGroup', 'allergies', 'contact']
    );
  });

  it('derives passport progress across all 5 milestones', () => {
    const full = derivePassportProgress({
      patient: basePatient,
      medicationCount: 2,
      recordCount: 4,
      biometricLock: true,
    });
    assert.equal(full.done, 5);
    assert.equal(full.total, 5);
    assert.equal(full.progress, 1);
    assert.equal(full.next, null);

    const partial = derivePassportProgress({
      patient: basePatient,
      medicationCount: 0,
      recordCount: 1,
      biometricLock: false,
    });
    assert.equal(partial.done, 3);
    assert.equal(partial.next?.id, 'medication');

    assert.equal(completionPercent(['profile', 'emergency']), 40);
    assert.equal(nextBestStep(['profile', 'emergency'])?.id, 'medication');
  });
});
