import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Medication } from '@/data/medications';
import { computeAdherence } from '@/lib/adherence';
import {
  getDayAgenda,
  getHealthDaysForDateString,
  getMonthMarks,
  upcomingHealthDays,
} from '@/lib/calendarMarks';
import { pastDateKeys } from '@/lib/date';

const testMedications: Medication[] = [
  {
    id: 'med-test-1',
    name: 'Metformin',
    strength: '500 mg',
    indication: 'Type 2 Diabetes Mellitus',
    route: 'Oral',
    frequency: 'Twice daily',
    directions: 'Take with meals',
    prescriber: 'Dr S. Patel',
    facility: 'Rosebank Family Practice',
    provenance: 'Prescription Scan',
    times: ['08:00', '20:00'],
    status: 'active',
    startDate: '2026-01-10',
  },
];

describe('Health Calendar marks & Medication Adherence calculations', () => {
  it('identifies WHO / SA National Health Awareness Days on known dates', () => {
    // World AIDS Day is 1 December
    const dec1 = getHealthDaysForDateString('2026-12-01');
    assert.ok(dec1.length >= 1, 'Expected at least 1 health awareness day on 2026-12-01');

    const upcoming = upcomingHealthDays(new Date('2026-11-01T09:00:00Z'), 5);
    assert.equal(upcoming.length, 5);
  });

  it('builds day agenda and month marks for scheduled appointments', () => {
    const customAppts = [
      {
        id: 'appt_1',
        title: 'Cardiology Review',
        provider: 'Dr K. Mthembu',
        specialty: 'Cardiologist',
        facility: 'Netcare Sunninghill',
        date: '2026-11-15',
        time: '10:30',
        type: 'Appointment' as const,
        status: 'confirmed' as const,
      },
    ];
    const agenda = getDayAgenda('2026-11-15', customAppts);
    assert.equal(agenda.appointments.length, 1);
    assert.equal(agenda.appointments[0].title, 'Cardiology Review');

    const marks = getMonthMarks('2026-11', customAppts);
    assert.ok(marks['2026-11-15'], 'Expected 2026-11-15 to be marked in November 2026');
  });

  it('computes 7-day medication adherence percent and streak', () => {
    const empty = computeAdherence({}, 7, testMedications);
    assert.equal(empty.hasData, false);
    assert.equal(empty.percent, 0);
    assert.equal(empty.streak, 0);
    assert.equal(empty.scheduled, 2); // 08:00 and 20:00

    const days = pastDateKeys(7);
    const fullLog: Record<string, boolean> = {};
    for (const day of days) {
      fullLog[`med-test-1-08:00__${day}`] = true;
      fullLog[`med-test-1-20:00__${day}`] = true;
    }

    const perfect = computeAdherence(fullLog, 7, testMedications);
    assert.equal(perfect.hasData, true);
    assert.equal(perfect.percent, 100);
    assert.equal(perfect.streak, 7);
  });
});
