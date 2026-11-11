import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  initialDoctorBookings,
  initialDoctors,
  type DoctorBooking,
  type DoctorProfile,
  type DoctorService,
  type DoctorSickCertificate,
} from '@/data/doctors';
import {
  generateDoctorPrescriptionHtml,
  generateHpcsaSickNoteHtml,
} from '@/lib/clinicalPdfTemplates';
import {
  calculateDoctorBookingStats,
  createDoctorBookingPayload,
  filterDoctorsDirectory,
  filterDoctorsZocdoc,
  formatZarPrice,
  generateDoctorSlotSchedule,
  isValidCouncilNumber,
  resolveUserRoleForEmail,
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

  it('generates real-time Zocdoc availability slot schedules for doctors', () => {
    const doc = initialDoctors[0]; // Dr. Thobani Gabuza
    const schedule = generateDoctorSlotSchedule(doc, 3);

    assert.equal(schedule.length, 3, 'Expected 3-day schedule');
    assert.equal(schedule[0].dayLabel, 'Today');
    assert.equal(schedule[1].dayLabel, 'Tomorrow');

    for (const day of schedule) {
      assert.ok(day.dateStr.length === 10, 'Expected valid YYYY-MM-DD date');
      assert.ok(Array.isArray(day.slots), 'Expected slots array');
    }
  });

  it('filters doctors with multi-dimensional Zocdoc criteria (specialty, location, mode, medical aid)', () => {
    // 1. Specialty: Paediatrician
    const paediatricians = filterDoctorsZocdoc(initialDoctors, { specialty: 'Paediatrician' });
    assert.ok(paediatricians.length >= 1);
    assert.equal(paediatricians[0].fullName, 'Amina Patel');

    // 2. City: Cape Town
    const cdtDocs = filterDoctorsZocdoc(initialDoctors, { city: 'Cape Town' });
    assert.ok(cdtDocs.length >= 1);
    assert.equal(cdtDocs[0].city, 'Cape Town');

    // 3. Consultation Mode: Video
    const videoDocs = filterDoctorsZocdoc(initialDoctors, { mode: 'video' });
    assert.ok(videoDocs.length >= 4);
    assert.ok(videoDocs.every((d) => d.consultationModes.includes('video')));

    // 4. Medical Aid: Bonitas
    const bonitasDocs = filterDoctorsZocdoc(initialDoctors, { medicalAid: 'Bonitas' });
    assert.ok(bonitasDocs.length >= 2);

    // 5. Query: "ECG"
    const ecgDocs = filterDoctorsZocdoc(initialDoctors, { query: 'ECG' });
    assert.ok(ecgDocs.length >= 1);
    assert.ok(ecgDocs.some((d) => d.fullName.includes('Gabuza') || d.fullName.includes('Ndlovu')));

    // 6. Query: "Dentist"
    const dentists = filterDoctorsZocdoc(initialDoctors, { query: 'Dentist' });
    assert.equal(dentists.length, 1);
    assert.equal(dentists[0].fullName, 'Sibusiso Khumalo');
  });

  it('enforces strict role separation: doctor view is automatic and locked by account email', () => {
    // 1. Doctor email resolution
    const doctorAuth = resolveUserRoleForEmail('thobanisgabuzam2@gmail.com', initialDoctors);
    assert.equal(doctorAuth.userRole, 'doctor', 'Doctor email must automatically resolve to doctor role');
    assert.ok(doctorAuth.doctor, 'Must resolve to doctor profile');
    assert.equal(doctorAuth.doctor?.fullName, 'Thobani Gabuza');

    // 2. Case insensitivity check
    const upperDoctorAuth = resolveUserRoleForEmail('THOBANISGABUZAM2@GMAIL.COM', initialDoctors);
    assert.equal(upperDoctorAuth.userRole, 'doctor');

    // 3. Another community doctor
    const aminaAuth = resolveUserRoleForEmail('info@rosebankpaediatrics.co.za', initialDoctors);
    assert.equal(aminaAuth.userRole, 'doctor');
    assert.equal(aminaAuth.doctor?.fullName, 'Amina Patel');

    // 4. Patient email resolution (must never be granted doctor role)
    const patientAuth = resolveUserRoleForEmail('jessica.tebatso@gmail.com', initialDoctors);
    assert.equal(patientAuth.userRole, 'patient', 'Patient email must strictly resolve to patient role');
    assert.equal(patientAuth.doctor, null);

    // 5. Empty / undefined email resolution
    const emptyAuth = resolveUserRoleForEmail('', initialDoctors);
    assert.equal(emptyAuth.userRole, 'patient');
    assert.equal(emptyAuth.doctor, null);

    const nullAuth = resolveUserRoleForEmail(null, initialDoctors);
    assert.equal(nullAuth.userRole, 'patient');
    assert.equal(nullAuth.doctor, null);
  });

  it('validates pre-consult patient passport summaries and safety critical allergies', () => {
    const kagisoBooking = initialDoctorBookings.find((b) => b.patientName === 'Kagiso Sithole');
    assert.ok(kagisoBooking, 'Expected Kagiso Sithole booking');
    assert.ok(kagisoBooking.patientSummary, 'Must contain patient clinical summary');
    assert.equal(kagisoBooking.patientSummary.bloodGroup, 'O+');
    assert.ok(
      kagisoBooking.patientSummary.allergies?.some((a) => a.substance.includes('Penicillin')),
      'Must have safety-critical Penicillin allergy recorded'
    );
    assert.ok(
      kagisoBooking.patientSummary.chronicConditions?.includes('Moderate Persistent Asthma'),
      'Must have Asthma chronic condition'
    );
    assert.ok(kagisoBooking.patientSummary.emergencyContact?.name, 'Must have ICE contact');

    const leratoBooking = initialDoctorBookings.find((b) => b.patientName === 'Lerato Molefe');
    assert.ok(leratoBooking?.patientSummary);
    assert.equal(leratoBooking.patientSummary.bloodGroup, 'A+');
    assert.ok(
      leratoBooking.patientSummary.allergies?.some((a) => a.substance.includes('Sulfa')),
      'Must have Sulfa allergy recorded'
    );
  });

  it('generates HPCSA Rule 16 compliant Medical Certificate (Sick Note) HTML', () => {
    const doctor = initialDoctors[0]; // Dr. Thobani Gabuza
    const cert: DoctorSickCertificate = {
      id: 'sn-test-01',
      certificateNumber: 'MC-2026-08492-99',
      patientName: 'Kagiso Sithole',
      patientIdNumber: '8806145800082',
      dateOfExamination: '2026-11-11',
      incapacityStartDate: '2026-11-11',
      incapacityEndDate: '2026-11-13',
      resumeDutyDate: '2026-11-14',
      natureOfIncapacity: 'specified',
      diagnosisStatement: 'Acute upper respiratory tract infection (J06.9)',
      recommendation: 'Complete bed rest and isolation from cold exposure.',
      doctorName: `${doctor.title} ${doctor.fullName}`,
      doctorHpcsaNumber: doctor.hpcsaNumber,
      doctorPracticeNumber: '0542318',
      issuedAt: '2026-11-11T12:00:00Z',
    };

    const html = generateHpcsaSickNoteHtml(cert, doctor);
    assert.ok(html.includes('Medical Certificate of Incapacity'));
    assert.ok(html.includes('Dr. Thobani Gabuza'));
    assert.ok(html.includes('MP 0849210'));
    assert.ok(html.includes('Kagiso Sithole'));
    assert.ok(html.includes('8806145800082'));
    assert.ok(html.includes('Acute upper respiratory tract infection (J06.9)'));
    assert.ok(html.includes('HPCSA Rule 16'));
    assert.ok(html.includes('11 November 2026'));
    assert.ok(html.includes('14 November 2026'));

    // Check confidentiality mode
    const confidentialCert: DoctorSickCertificate = {
      ...cert,
      natureOfIncapacity: 'confidential',
      diagnosisStatement: undefined,
    };
    const confidentialHtml = generateHpcsaSickNoteHtml(confidentialCert, doctor);
    assert.ok(confidentialHtml.includes('Confidential medical condition as diagnosed by me'));
    assert.ok(confidentialHtml.includes('HPCSA Rule 16(1)(g)'));
    assert.ok(!confidentialHtml.includes('Acute upper respiratory tract infection'));
  });

  it('generates official South African Electronic Prescription (e-Script) HTML', () => {
    const doctor = initialDoctors[0];
    const booking = initialDoctorBookings[0];

    const html = generateDoctorPrescriptionHtml({
      doctor,
      booking,
      prescriptions: [
        {
          id: 'rx-test-1',
          medicationName: 'Amoxicillin 500mg',
          dosage: '1 capsule TDS',
          instructions: 'Take after meals for 5 days',
          durationDays: 5,
          repeats: 0,
          quantity: '15 capsules',
        },
        {
          id: 'rx-test-2',
          medicationName: 'Salbutamol Inhaler 100mcg',
          dosage: '1-2 puffs PRN',
          instructions: 'Inhale for acute wheezing',
          durationDays: 30,
          repeats: 1,
          quantity: '1 canister',
        },
      ],
      clinicalNotes: {
        subjective: 'Persistent dry cough and wheeze',
        objective: 'Mild expiratory wheeze bilaterally',
        assessment: 'Acute Bronchitis with Bronchospasm',
        plan: 'Antibiotics and bronchodilator therapy',
        recordedAt: '2026-11-11T12:00:00Z',
      },
    });

    assert.ok(html.includes('Electronic Prescription (e-Script)'));
    assert.ok(html.includes('Amoxicillin 500mg'));
    assert.ok(html.includes('1 capsule TDS'));
    assert.ok(html.includes('Salbutamol Inhaler 100mcg'));
    assert.ok(html.includes('1x Repeats'));
    assert.ok(html.includes('Acute Bronchitis with Bronchospasm'));
    assert.ok(html.includes('MP 0849210'));
    assert.ok(html.includes(booking.patientName));
  });

  it('aggregates doctor practice schedule appointments distinguishing physical vs video visits', () => {
    const doctorId = 'doc-thobani-gabuza';
    const doctorBookings = initialDoctorBookings.filter((b) => b.doctorId === doctorId);

    const physicalBookings = doctorBookings.filter((b) => b.mode === 'in_person');
    const videoBookings = doctorBookings.filter((b) => b.mode === 'video');

    assert.ok(physicalBookings.length > 0, 'Must have scheduled physical room consultations');
    assert.ok(videoBookings.length > 0, 'Must have scheduled online video consultations');
    assert.equal(
      physicalBookings.length + videoBookings.length,
      doctorBookings.length,
      'Every consultation must have a valid mode'
    );

    // Each booking must contain required clinical context
    for (const b of doctorBookings) {
      assert.ok(b.patientName, 'Booking must have patient name');
      assert.ok(b.date, 'Booking must have date');
      assert.ok(b.time, 'Booking must have time');
      assert.ok(b.durationMinutes > 0, 'Booking must have duration');
      assert.ok(b.priceZar > 0, 'Booking must have consultation tariff');
    }
  });

  it('extracts unique patient records directory with clinical safety summaries for doctor view', () => {
    const doctorId = 'doc-thobani-gabuza';
    const doctorBookings = initialDoctorBookings.filter((b) => b.doctorId === doctorId);

    const patientsMap = new Map<string, {
      name: string;
      phone: string;
      email: string;
      visitsCount: number;
      hasAllergies: boolean;
      hasChronic: boolean;
    }>();

    for (const b of doctorBookings) {
      const existing = patientsMap.get(b.patientId);
      if (!existing) {
        patientsMap.set(b.patientId, {
          name: b.patientName,
          phone: b.patientPhone,
          email: b.patientEmail,
          visitsCount: 1,
          hasAllergies: (b.patientSummary?.allergies?.length ?? 0) > 0,
          hasChronic: (b.patientSummary?.chronicConditions?.length ?? 0) > 0,
        });
      } else {
        existing.visitsCount += 1;
      }
    }

    assert.ok(patientsMap.size >= 2, 'Doctor practice must have multiple registered patients');
    const kagiso = patientsMap.get('pat-thobani-p1');
    assert.ok(kagiso, 'Kagiso Sithole must exist in patient records');
    assert.ok(kagiso.hasAllergies, 'Kagiso must have critical allergies on record');
    assert.ok(kagiso.hasChronic, 'Kagiso must have chronic conditions on record');

    const lerato = patientsMap.get('pat-thobani-p2');
    assert.ok(lerato, 'Lerato Molefe must exist in patient records');
    assert.ok(lerato.hasAllergies, 'Lerato must have recorded allergy');
  });
});
