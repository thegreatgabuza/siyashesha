import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  emergencyServiceContacts,
  filterEmergencyContacts,
  NATIONAL_SPEED_DIALS,
} from '@/data/emergencyContactsDirectory';
import {
  filterMedicalAidProviders,
  medicalAidProviders,
} from '@/data/medicalAidDirectory';

describe('Medical Aid & Insurance Provider Directory (16 SA Schemes)', () => {
  it('loads all 16 verified South African medical aid and insurance providers', () => {
    assert.equal(medicalAidProviders.length, 16);

    for (const provider of medicalAidProviders) {
      assert.ok(provider.id, 'Provider must have an id');
      assert.ok(provider.name.length > 2, 'Provider must have a valid name');
      assert.ok(provider.schemeType, 'Provider must have a scheme type');
      assert.ok(['medical_aid', 'health_insurance', 'gap_cover'].includes(provider.category));
      assert.ok(provider.websiteUrl.startsWith('https://') || provider.websiteUrl.startsWith('http://'));
      assert.ok(provider.logoBase64.startsWith('data:image/png;base64,'));
    }
  });

  it('categorizes medical aids, health insurance and gap cover accurately', () => {
    const medicalAids = filterMedicalAidProviders('', 'medical_aid');
    const healthInsurances = filterMedicalAidProviders('', 'health_insurance');
    const gapCovers = filterMedicalAidProviders('', 'gap_cover');

    assert.equal(medicalAids.length, 13, 'Expected 13 medical aid schemes');
    assert.equal(healthInsurances.length, 2, 'Expected 2 health insurance providers');
    assert.equal(gapCovers.length, 1, 'Expected 1 gap cover provider');

    // Check specific anchors
    assert.ok(medicalAids.some((p) => p.name === 'Discovery Health'));
    assert.ok(medicalAids.some((p) => p.name === 'Bonitas'));
    assert.ok(medicalAids.some((p) => p.name === 'GEMS'));
    assert.ok(healthInsurances.some((p) => p.name === 'Affinity Health'));
    assert.ok(healthInsurances.some((p) => p.name === 'Unity Health'));
    assert.ok(gapCovers.some((p) => p.name === 'Ambledown'));
  });

  it('filters providers by multi-term search query', () => {
    const discovery = filterMedicalAidProviders('discovery');
    assert.equal(discovery.length, 1);
    assert.equal(discovery[0].name, 'Discovery Health');

    const gov = filterMedicalAidProviders('government');
    assert.ok(gov.length >= 1);
    assert.ok(gov.some((p) => p.name === 'GEMS'));

    const police = filterMedicalAidProviders('police');
    assert.equal(police.length, 1);
    assert.equal(police[0].name, 'POLMED');
  });
});

describe('Emergency & Crisis Helplines Directory (30 Verified Services)', () => {
  it('includes persistent national emergency speed dials (112, 10177, 10111)', () => {
    assert.equal(NATIONAL_SPEED_DIALS.length, 3);
    const speedNumbers = NATIONAL_SPEED_DIALS.map((s) => s.cleanNumber);
    assert.ok(speedNumbers.includes('112'));
    assert.ok(speedNumbers.includes('10177'));
    assert.ok(speedNumbers.includes('10111'));
  });

  it('validates 30 verified emergency and crisis support lines across South Africa', () => {
    assert.equal(emergencyServiceContacts.length, 30);

    for (const c of emergencyServiceContacts) {
      assert.ok(c.id, 'Must have id');
      assert.ok(c.name, 'Must have name');
      assert.ok(c.number, 'Must have number');
      assert.ok(c.cleanNumber.length >= 3, 'Must have dialable clean number');
      assert.ok(c.purpose.length > 10, 'Must have explanatory purpose');
      assert.ok(
        ['national', 'rescue', 'mental_health', 'gbv_vulnerable', 'health_regional'].includes(
          c.category
        )
      );
    }
  });

  it('distinguishes private emergency services and specialist helpline protocols', () => {
    const er24 = emergencyServiceContacts.find((c) => c.id === 'em-er24');
    const netcare = emergencyServiceContacts.find((c) => c.id === 'em-netcare911');
    assert.ok(er24?.isPrivate, 'ER24 must be flagged as private EMS');
    assert.ok(netcare?.isPrivate, 'Netcare 911 must be flagged as private EMS');

    const gbv = emergencyServiceContacts.find((c) => c.id === 'em-gbv-centre');
    assert.equal(gbv?.pleaseCallMeCode, '*120*7867#');

    const substance = emergencyServiceContacts.find((c) => c.id === 'em-substance-abuse');
    assert.equal(substance?.smsNumber, '32312');

    const poison = emergencyServiceContacts.find((c) => c.id === 'em-poison');
    assert.equal(poison?.cleanNumber, '0861555777');
  });

  it('filters crisis lines by category and query keyword accurately', () => {
    const mentalLines = filterEmergencyContacts('', 'mental_health');
    assert.ok(mentalLines.length >= 8);
    assert.ok(mentalLines.some((c) => c.name.includes('SADAG')));

    const poisonSearch = filterEmergencyContacts('poison');
    assert.equal(poisonSearch.length, 1);
    assert.equal(poisonSearch[0].id, 'em-poison');

    const childSearch = filterEmergencyContacts('childline');
    assert.equal(childSearch.length, 1);
    assert.equal(childSearch[0].number, '116');

    const seaSearch = filterEmergencyContacts('sea rescue');
    assert.equal(seaSearch.length, 1);
    assert.equal(seaSearch[0].id, 'em-nsri');
  });
});
