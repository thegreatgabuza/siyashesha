import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  initialDoctorBookings,
  initialDoctors,
  type DoctorProfile,
  type DoctorService,
} from '@/data/doctors';
import {
  calculateDoctorBookingStats,
  createDoctorBookingPayload,
  filterDoctorsDirectory,
  formatZarPrice,
  isValidCouncilNumber,
} from '@/lib/doctorBooking';

describe('Doctor Role, Services Management & Patient Booking', () => {
  it('initializes with verified community doctors having active services', () => {
    assert.ok(initialDoctors.length >= 5, 'Expected at least 5 verified doctors in directory');
    for (const doc of initialDoctors) {
      assert.ok(doc.id, 'Doctor must have an ID');
      assert.ok(doc.fullName, 'Doctor must have a full name');
      assert.ok(doc.specialty, 'Doctor must have a specialty');
      assert.ok(isValidCouncilNumber(doc.hpcsaNumber), `Must have valid council number: ${doc.hpcsaNumber}`);
      assert.ok(doc.services.length > 0, `Doctor ${doc.fullName} must have at least one service`);
      for (const srv of doc.services) {
        assert.ok(srv.priceZar > 0, 'Service price must be positive ZAR');
        assert.ok(srv.durationMinutes >= 15, 'Service duration must be at least 15 mins');
      }
    }
  });

  it('has verified doctor account for Dr. Thobani Gabuza (thobanisgabuzam2@gmail.com)', () => {
    const doc = initialDoctors.find((d) => d.email.toLowerCase() === 'thobanisgabuzam2@gmail.com');
    assert.ok(doc, 'Expected Dr. Thobani Gabuza account in verified directory');
    assert.equal(doc.fullName, 'Thobani Gabuza');
    assert.equal(doc.specialty, 'General Practitioner');
    assert.equal(doc.hpcsaNumber, 'MP 0849210');
    assert.ok(doc.services.length >= 6, 'Expected at least 6 published clinical services');
  });

  it('seeds realistic patient bookings for Dr. Thobani Gabuza', () => {
    assert.ok(initialDoctorBookings.length >= 6, 'Expected at least 6 pre-seeded doctor bookings');
    const doc = initialDoctors.find((d) => d.id === 'doc-thobani-gabuza');
    assert.ok(doc, 'Doctor profile must exist');
    const serviceIds = new Set(doc.services.map((s) => s.id));

    for (const booking of initialDoctorBookings) {
      assert.equal(booking.doctorId, 'doc-thobani-gabuza');
      assert.ok(serviceIds.has(booking.serviceId), `Booking references valid service: ${booking.serviceId}`);
      assert.ok(booking.patientName.length > 2, 'Patient must have valid name');
      assert.ok(booking.patientPhone.startsWith('+27'), 'Phone must be valid SA number (+27)');
      assert.ok(booking.patientEmail.includes('@'), 'Must have valid patient email');
      assert.ok(['confirmed', 'completed', 'cancelled'].includes(booking.status));
      assert.ok(['in_person', 'video'].includes(booking.mode));
      assert.ok(booking.priceZar > 0);
    }

    const stats = calculateDoctorBookingStats(initialDoctorBookings);
    assert.ok(stats.confirmedCount >= 3, 'Expected at least 3 confirmed upcoming bookings');
    assert.ok(stats.completedCount >= 2, 'Expected at least 2 completed bookings');
    assert.ok(stats.cancelledCount >= 1, 'Expected at least 1 cancelled booking');
    assert.ok(stats.totalRevenueZar > 0, 'Revenue from completed bookings must be positive');
  });

  it('validates South African professional council numbers', () => {
    assert.equal(isValidCouncilNumber('MP 0784920'), true);
    assert.equal(isValidCouncilNumber('PS 0148293'), true);
    assert.equal(isValidCouncilNumber('DP 0492817'), true);
    assert.equal(isValidCouncilNumber('SANC 1234567'), true);
    assert.equal(isValidCouncilNumber('INVALID'), false);
    assert.equal(isValidCouncilNumber(''), false);
  });

  it('filters doctors directory by specialty and search queries accurately', () => {
    // 1. Filter by specialty
    const paediatricians = filterDoctorsDirectory(initialDoctors, 'Paediatrician');
    assert.ok(paediatricians.length >= 1);
    assert.ok(paediatricians.every((d) => d.specialty === 'Paediatrician'));

    // 2. Filter by search query
    const results = filterDoctorsDirectory(initialDoctors, 'All', 'Sandton');
    assert.ok(results.length >= 1);
    assert.ok(
      results.some((d) => d.practiceAddress.includes('Sandton') || d.practiceName.includes('Sandton'))
    );

    // 3. Filter by procedure / service name
    const dentalClean = filterDoctorsDirectory(initialDoctors, 'All', 'scale & polish');
    assert.equal(dentalClean.length, 1);
    assert.equal(dentalClean[0].fullName, 'Sibusiso Khumalo');
  });

  it('creates synced DoctorBooking and Patient Appointment payload', () => {
    const doctor = initialDoctors[0];
    const service = doctor.services[0];

    const { booking, appointment } = createDoctorBookingPayload({
      bookingId: 'bk_test_001',
      apptId: 'appt_test_001',
      doctor,
      service,
      date: '2026-11-25',
      time: '14:30',
      mode: 'video',
      patientId: 'pat_001',
      patientName: 'Sipho Sithole',
      patientPhone: '+27 82 555 1234',
      patientEmail: 'sipho@example.co.za',
      notes: 'Follow-up on blood pressure reading',
    });

    assert.equal(booking.id, 'bk_test_001');
    assert.equal(booking.doctorId, doctor.id);
    assert.equal(booking.serviceName, service.name);
    assert.equal(booking.priceZar, service.priceZar);
    assert.equal(booking.status, 'confirmed');
    assert.equal(booking.mode, 'video');

    assert.equal(appointment.id, 'appt_test_001');
    assert.equal(appointment.date, '2026-11-25');
    assert.equal(appointment.time, '14:30');
    assert.ok(appointment.title.includes(service.name));
    assert.ok(appointment.notes?.includes('Video Telehealth Consult'));
    assert.equal(appointment.status, 'confirmed');
  });

  it('computes doctor booking statistics and consultation value accurately', () => {
    const stats = calculateDoctorBookingStats([
      {
        id: '1',
        doctorId: 'doc-001',
        doctorName: 'Dr Thabo',
        doctorSpecialty: 'GP',
        practiceName: 'Clinic',
        practiceAddress: 'Address',
        patientId: 'p1',
        patientName: 'Patient 1',
        patientPhone: '',
        patientEmail: '',
        serviceId: 's1',
        serviceName: 'Consult',
        durationMinutes: 30,
        priceZar: 550,
        date: '2026-11-10',
        time: '09:00',
        mode: 'in_person',
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        doctorId: 'doc-001',
        doctorName: 'Dr Thabo',
        doctorSpecialty: 'GP',
        practiceName: 'Clinic',
        practiceAddress: 'Address',
        patientId: 'p2',
        patientName: 'Patient 2',
        patientPhone: '',
        patientEmail: '',
        serviceId: 's2',
        serviceName: 'Followup',
        durationMinutes: 15,
        priceZar: 350,
        date: '2026-11-10',
        time: '10:00',
        mode: 'video',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        doctorId: 'doc-001',
        doctorName: 'Dr Thabo',
        doctorSpecialty: 'GP',
        practiceName: 'Clinic',
        practiceAddress: 'Address',
        patientId: 'p3',
        patientName: 'Patient 3',
        patientPhone: '',
        patientEmail: '',
        serviceId: 's3',
        serviceName: 'Consult',
        durationMinutes: 30,
        priceZar: 550,
        date: '2026-11-09',
        time: '11:00',
        mode: 'in_person',
        status: 'cancelled',
        createdAt: new Date().toISOString(),
      },
    ]);

    assert.equal(stats.totalCount, 3);
    assert.equal(stats.completedCount, 1);
    assert.equal(stats.confirmedCount, 1);
    assert.equal(stats.cancelledCount, 1);
    assert.equal(stats.totalRevenueZar, 550);
    assert.equal(formatZarPrice(stats.totalRevenueZar), 'R550');
  });
});
