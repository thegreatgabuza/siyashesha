import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  FREE_RECORD_LIMIT,
  getPlanEntitlements,
  getPlanShortBadge,
} from '@/lib/subscription';

describe('Subscription tiers & feature entitlements (#3)', () => {
  it('enforces Free Basic limits (10 records, no Pro features)', () => {
    const free = getPlanEntitlements('free');
    assert.equal(free.isPro, false);
    assert.equal(free.maxRecords, FREE_RECORD_LIMIT);
    assert.equal(free.maxRecords, 10);
    assert.equal(free.canUseSmartOcr, false);
    assert.equal(free.canUseClinicalAssistant, false);
    assert.equal(free.canShareWithDoctorPin, false);
    assert.equal(free.canUseBiometricLock, false);
    assert.equal(free.canExportRecords, false);
    assert.equal(free.canExportFullAnnualPdfAndDsar, false);
    assert.equal(free.hasFounderBadge, false);
  });

  it('grants Pro features on Monthly Pro while reserving full annual archive & Founder badge', () => {
    const monthly = getPlanEntitlements('monthly_premium');
    assert.equal(monthly.isPro, true);
    assert.equal(monthly.maxRecords, Number.POSITIVE_INFINITY);
    assert.equal(monthly.canUseSmartOcr, true);
    assert.equal(monthly.canUseClinicalAssistant, true);
    assert.equal(monthly.canShareWithDoctorPin, true);
    assert.equal(monthly.canUseBiometricLock, true);
    assert.equal(monthly.canExportRecords, true);
    assert.equal(monthly.canExportFullAnnualPdfAndDsar, false);
    assert.equal(monthly.hasFounderBadge, false);
  });

  it('grants Annual Pro & Lifetime Founder Pass full entitlements', () => {
    const annual = getPlanEntitlements('annual_premium');
    assert.equal(annual.isPro, true);
    assert.equal(annual.isAnnualOrLifetime, true);
    assert.equal(annual.canExportFullAnnualPdfAndDsar, true);
    assert.equal(annual.hasFounderBadge, false);

    const lifetime = getPlanEntitlements('lifetime_premium');
    assert.equal(lifetime.isPro, true);
    assert.equal(lifetime.isAnnualOrLifetime, true);
    assert.equal(lifetime.isFounder, true);
    assert.equal(lifetime.canExportFullAnnualPdfAndDsar, true);
    assert.equal(lifetime.hasFounderBadge, true);
  });

  it('returns distinct badge labels for each plan tier', () => {
    assert.equal(getPlanShortBadge('free').label, 'FREE BASIC');
    assert.equal(getPlanShortBadge('monthly_premium').label, 'MONTHLY PRO');
    assert.equal(getPlanShortBadge('annual_premium').label, 'ANNUAL PRO');
    assert.equal(getPlanShortBadge('lifetime_premium').label, 'FOUNDER PASS');
  });
});
