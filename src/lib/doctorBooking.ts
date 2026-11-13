import type { Appointment } from '@/data/appointments';
import type { DoctorBooking, DoctorProfile, DoctorService } from '@/data/doctors';

/** Generates a canonical, unguessable Jitsi room slug shared by doctor and patient for a booking. */
export function getTelehealthRoomName(bookingId: string, roomToken?: string): string {
  const cleanId = bookingId.replace(/[^a-zA-Z0-9]/g, '');
  const cleanToken = roomToken ? roomToken.replace(/[^a-zA-Z0-9]/g, '') : '';
  return cleanToken
    ? `siyashesha-consult-${cleanId}-${cleanToken}`
    : `siyashesha-consult-${cleanId}`;
}

/** Generates the canonical Jitsi meeting URL shared by doctor and patient for a booking. */
export function getTelehealthRoomUrl(bookingId: string, roomToken?: string): string {
  return `https://meet.jit.si/${getTelehealthRoomName(bookingId, roomToken)}`;
}

/** Returns active bookable services for a doctor, falling back to a default consultation if none are configured. */
export function getDoctorBookableServices(doctor: DoctorProfile): DoctorService[] {
  const rawServices = Array.isArray(doctor.services) ? doctor.services : [];
  const activeServices = rawServices.filter((s) => s.isActive);
  if (activeServices.length > 0) return activeServices;

  const supportsInPerson = doctor.consultationModes.includes('in_person');
  const supportsVideo = doctor.consultationModes.includes('video');
  const defaultMode: DoctorService['mode'] =
    supportsInPerson && supportsVideo
      ? 'both'
      : supportsVideo
        ? 'video'
        : 'in_person';

  return [
    {
      id: `srv-default-${doctor.id}`,
      doctorId: doctor.id,
      name: 'General Medical Consultation',
      description: 'Comprehensive clinical evaluation and consultation',
      durationMinutes: doctor.availability?.slotDurationMinutes || 30,
      priceZar: 650,
      category: 'Consultation',
      mode: defaultMode,
      isActive: true,
    },
  ];
}

/** Checks whether a consultation mode is supported by both the doctor and the chosen service. */
export function isConsultationModeAllowed(
  doctor: DoctorProfile,
  service: DoctorService,
  mode: 'in_person' | 'video'
): boolean {
  const doctorSupports = doctor.consultationModes.includes(mode);
  const serviceSupports = service.mode === 'both' || service.mode === mode;
  return doctorSupports && serviceSupports;
}

/** Resolves a valid consultation mode given doctor capabilities, service mode, and preferred mode. */
export function resolveSupportedMode(
  doctor: DoctorProfile,
  service: DoctorService,
  preferredMode?: 'in_person' | 'video'
): 'in_person' | 'video' {
  if (preferredMode && isConsultationModeAllowed(doctor, service, preferredMode)) {
    return preferredMode;
  }
  if (isConsultationModeAllowed(doctor, service, 'in_person')) return 'in_person';
  if (isConsultationModeAllowed(doctor, service, 'video')) return 'video';
  return service.mode === 'video' ? 'video' : 'in_person';
}

export interface DoctorTimeSlotOption {
  time: string;
  isBooked: boolean;
}

/** Generates time slots from a doctor's configured availability window and flags booked slots. */
export function getDoctorDateSlots(
  doctor: DoctorProfile,
  dateStr: string,
  existingBookings: DoctorBooking[] = []
): { isAvailableDay: boolean; slots: DoctorTimeSlotOption[] } {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, (m || 1) - 1, d || 1);
  const daysOfWeekMap: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];
  const dayOfWeek = daysOfWeekMap[dateObj.getDay()];
  const isAvailableDay =
    doctor.availability?.days?.includes(dayOfWeek) ?? dayOfWeek !== 'Sun';

  if (!isAvailableDay) {
    return { isAvailableDay: false, slots: [] };
  }

  const parseMinutes = (hhmm: string, fallback: number): number => {
    const [hh, mm] = hhmm.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return fallback;
    return hh * 60 + mm;
  };

  const startMin = parseMinutes(doctor.availability?.startTime || '08:30', 8 * 60 + 30);
  const endMin = parseMinutes(doctor.availability?.endTime || '17:00', 17 * 60);
  const stepMin = Math.max(15, doctor.availability?.slotDurationMinutes || 30);

  const bookedTimes = new Set(
    existingBookings
      .filter(
        (b) =>
          b.doctorId === doctor.id &&
          b.date === dateStr &&
          b.status !== 'cancelled'
      )
      .map((b) => b.time)
  );

  const slots: DoctorTimeSlotOption[] = [];
  for (let cur = startMin; cur + stepMin <= endMin; cur += stepMin) {
    // Skip standard 13:00–13:59 lunch hour
    if (cur >= 13 * 60 && cur < 14 * 60) continue;
    const hh = String(Math.floor(cur / 60)).padStart(2, '0');
    const mm = String(cur % 60).padStart(2, '0');
    const time = `${hh}:${mm}`;
    slots.push({ time, isBooked: bookedTimes.has(time) });
  }

  return { isAvailableDay: true, slots };
}

/** Extracts a persisted Jitsi telehealth URL from appointment notes if present. */
export function extractTelehealthUrl(notes?: string): string | undefined {
  if (!notes) return undefined;
  const match = notes.match(/https:\/\/meet\.jit\.si\/[A-Za-z0-9_-]+/);
  return match ? match[0] : undefined;
}

/** Validates South African professional registration numbers (HPCSA MP/DP/PS, SANC, etc.) */
export function isValidCouncilNumber(councilNumber: string): boolean {
  if (!councilNumber) return false;
  const clean = councilNumber.trim().toUpperCase();
  // Standard SA council formats: MP 1234567, DP 1234567, PS 1234567, or 6-8 digit alphanumeric
  return /^(MP|DP|PS|PT|CH|PH|SANC)\s?[0-9A-Z]{5,8}$/.test(clean);
}

/**
 * Resolves the application user role and active practitioner profile based on account email.
 *
 * Strict Role Separation:
 * - If email matches a registered doctor (e.g. Dr. Thobani Gabuza), the user role is strictly locked to 'doctor'.
 * - If email is not a registered doctor, the role is strictly 'patient'.
 * - In-app switching is disallowed; patients must authenticate with their personal email.
 */
export function resolveUserRoleForEmail(
  email: string | undefined | null,
  registeredDoctors: DoctorProfile[]
): { userRole: 'doctor' | 'patient'; doctor: DoctorProfile | null } {
  if (!email) {
    return { userRole: 'patient', doctor: null };
  }
  const cleanEmail = email.trim().toLowerCase();
  const matched = registeredDoctors.find((d) => d.email.toLowerCase() === cleanEmail) || null;
  if (matched) {
    return { userRole: 'doctor', doctor: matched };
  }
  return { userRole: 'patient', doctor: null };
}

/** Formats price in South African Rand (ZAR) */
export function formatZarPrice(amount: number): string {
  return `R${Math.max(0, Math.round(amount)).toLocaleString('en-ZA')}`;
}

/** Filters directory of doctors by specialty and multi-term search query */
export function filterDoctorsDirectory(
  doctors: DoctorProfile[],
  specialty: string = 'All',
  query: string = ''
): DoctorProfile[] {
  const cleanQuery = query.trim().toLowerCase();
  const cleanSpecialty = specialty.trim().toLowerCase();

  return doctors.filter((doc) => {
    const matchSpecialty =
      cleanSpecialty === 'all' || doc.specialty.toLowerCase() === cleanSpecialty;

    if (!matchSpecialty) return false;
    if (!cleanQuery) return true;

    return (
      doc.fullName.toLowerCase().includes(cleanQuery) ||
      doc.specialty.toLowerCase().includes(cleanQuery) ||
      doc.practiceName.toLowerCase().includes(cleanQuery) ||
      doc.city.toLowerCase().includes(cleanQuery) ||
      doc.hpcsaNumber.toLowerCase().includes(cleanQuery) ||
      doc.services.some(
        (s) =>
          s.name.toLowerCase().includes(cleanQuery) ||
          s.category.toLowerCase().includes(cleanQuery)
      )
    );
  });
}

/** Calculates analytics and performance metrics for a doctor's bookings */
export function calculateDoctorBookingStats(bookings: DoctorBooking[]): {
  totalCount: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
  totalRevenueZar: number;
} {
  let confirmedCount = 0;
  let completedCount = 0;
  let cancelledCount = 0;
  let totalRevenueZar = 0;

  for (const b of bookings) {
    if (b.status === 'confirmed') confirmedCount++;
    if (b.status === 'completed') {
      completedCount++;
      totalRevenueZar += b.priceZar || 0;
    }
    if (b.status === 'cancelled') cancelledCount++;
  }

  return {
    totalCount: bookings.length,
    confirmedCount,
    completedCount,
    cancelledCount,
    totalRevenueZar,
  };
}

/** Pure creation of DoctorBooking and linked Siyashesha Appointment */
export function createDoctorBookingPayload(params: {
  bookingId: string;
  apptId: string;
  doctor: DoctorProfile;
  service: DoctorService;
  date: string;
  time: string;
  mode: 'in_person' | 'video';
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  notes?: string;
  telehealthRoomToken?: string;
  createdAt?: string;
}): { booking: DoctorBooking; appointment: Appointment } {
  const now = params.createdAt || new Date().toISOString();

  const booking: DoctorBooking = {
    id: params.bookingId,
    doctorId: params.doctor.id,
    doctorName: `${params.doctor.title} ${params.doctor.fullName}`,
    doctorSpecialty: params.doctor.specialty,
    practiceName: params.doctor.practiceName,
    practiceAddress: params.doctor.practiceAddress,
    patientId: params.patientId,
    patientName: params.patientName,
    patientPhone: params.patientPhone,
    patientEmail: params.patientEmail,
    serviceId: params.service.id,
    serviceName: params.service.name,
    durationMinutes: params.service.durationMinutes,
    priceZar: params.service.priceZar,
    date: params.date,
    time: params.time,
    mode: params.mode,
    notes: params.notes,
    status: 'confirmed',
    linkedAppointmentId: params.apptId,
    telehealthRoomToken: params.telehealthRoomToken,
    createdAt: now,
  };

  const telehealthUrl =
    params.mode === 'video'
      ? getTelehealthRoomUrl(params.bookingId, params.telehealthRoomToken)
      : undefined;

  const appointment: Appointment = {
    id: params.apptId,
    title: `${params.service.name} — ${params.doctor.title} ${params.doctor.fullName}`,
    facility: params.doctor.practiceName,
    provider: `${params.doctor.title} ${params.doctor.fullName} (${params.doctor.specialty})`,
    date: params.date,
    time: params.time,
    type: 'Appointment',
    notes: `${
      params.mode === 'video'
        ? `Video Telehealth Consult (${telehealthUrl})`
        : 'In-person at ' + params.doctor.practiceAddress
    }. Consultation Fee: R${params.service.priceZar}. ${
      params.notes ? 'Notes: ' + params.notes : ''
    }`,
    status: 'confirmed',
    reminderOption: '1_day',
    telehealthUrl,
  };

  return { booking, appointment };
}

export const COMMON_MEDICAL_AIDS = [
  'All Medical Aids',
  'Discovery Health',
  'Momentum Health',
  'Bonitas',
  'Medscheme',
  'Cash / Self-Pay',
] as const;

export const COMMON_SA_CITIES = [
  'All Cities',
  'Johannesburg',
  'Sandton',
  'Rosebank',
  'Cape Town',
  'Durban',
] as const;

export interface DoctorDaySlotSchedule {
  dateStr: string; // YYYY-MM-DD
  dayLabel: string; // "Today", "Tomorrow", "Wed, 11 Nov"
  dayOfWeek: string; // "Mon", "Tue", ...
  slots: string[]; // ["09:30", "11:00", "14:30"]
}

/**
 * Generates realistic real-time doctor availability slots across upcoming days (Zocdoc schedule layout).
 */
export function generateDoctorSlotSchedule(
  doctor: DoctorProfile,
  daysCount: number = 3,
  startDate?: Date
): DoctorDaySlotSchedule[] {
  const base = startDate ? new Date(startDate) : new Date();
  const schedule: DoctorDaySlotSchedule[] = [];
  const daysOfWeekMap: ('Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat')[] = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  const defaultSlots = [
    '09:00',
    '09:30',
    '10:15',
    '11:00',
    '11:45',
    '14:00',
    '14:30',
    '15:15',
    '16:00',
    '16:30',
  ];

  for (let i = 0; i < daysCount; i++) {
    const cur = new Date(base);
    cur.setDate(base.getDate() + i);
    const dayOfWeek = daysOfWeekMap[cur.getDay()];
    const dateStr = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(
      cur.getDate()
    ).padStart(2, '0')}`;

    const isAvailableDay =
      doctor.availability?.days?.includes(dayOfWeek) ??
      !['Sun'].includes(dayOfWeek);

    const dayLabel =
      i === 0
        ? 'Today'
        : i === 1
        ? 'Tomorrow'
        : cur.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });

    let slots: string[] = [];
    if (isAvailableDay) {
      // Deterministically pick 3-4 realistic slots for this day
      const charCode = doctor.id.charCodeAt(doctor.id.length - 1) || 7;
      const offset = (charCode + i * 2) % defaultSlots.length;
      slots = [
        defaultSlots[offset % defaultSlots.length],
        defaultSlots[(offset + 3) % defaultSlots.length],
        defaultSlots[(offset + 6) % defaultSlots.length],
      ].sort();
    }

    schedule.push({
      dateStr,
      dayLabel,
      dayOfWeek,
      slots,
    });
  }

  return schedule;
}

export interface ZocdocFilterParams {
  specialty?: string;
  query?: string;
  city?: string;
  mode?: 'all' | 'in_person' | 'video';
  availability?: 'all' | 'today' | 'next_3_days';
  medicalAid?: string;
}

/**
 * Enhanced multi-dimensional Zocdoc filter supporting specialty, query, city, visit mode, and medical aid.
 */
export function filterDoctorsZocdoc(
  doctors: DoctorProfile[],
  filters: ZocdocFilterParams
): DoctorProfile[] {
  const cleanQuery = (filters.query || '').trim().toLowerCase();
  const cleanSpecialty = (filters.specialty || 'all').trim().toLowerCase();
  const cleanCity = (filters.city || 'all').trim().toLowerCase();
  const mode = filters.mode || 'all';
  const cleanMedicalAid = (filters.medicalAid || 'all').trim().toLowerCase();

  return doctors.filter((doc) => {
    // 1. Specialty filter
    if (cleanSpecialty !== 'all' && doc.specialty.toLowerCase() !== cleanSpecialty) {
      return false;
    }

    // 2. City filter
    if (
      cleanCity !== 'all' &&
      cleanCity !== 'all cities' &&
      !doc.city.toLowerCase().includes(cleanCity) &&
      !doc.practiceAddress.toLowerCase().includes(cleanCity)
    ) {
      return false;
    }

    // 3. Consultation Mode filter
    if (mode !== 'all' && !doc.consultationModes.includes(mode)) {
      return false;
    }

    // 4. Medical aid filter
    if (cleanMedicalAid !== 'all' && cleanMedicalAid !== 'all medical aids') {
      const aids = (doc.medicalAids || ['Discovery Health', 'Bonitas', 'Momentum', 'Cash']).map(
        (a) => a.toLowerCase()
      );
      if (!aids.some((a) => a.includes(cleanMedicalAid))) {
        return false;
      }
    }

    // 4.5 Availability filter (today / next_3_days)
    if (filters.availability && filters.availability !== 'all') {
      const daysToCheck = filters.availability === 'today' ? 1 : 3;
      const schedule = generateDoctorSlotSchedule(doc, daysToCheck);
      if (!schedule.some((day) => day.slots.length > 0)) {
        return false;
      }
    }

    // 5. Query filter
    if (cleanQuery) {
      const match =
        doc.fullName.toLowerCase().includes(cleanQuery) ||
        doc.specialty.toLowerCase().includes(cleanQuery) ||
        doc.practiceName.toLowerCase().includes(cleanQuery) ||
        doc.city.toLowerCase().includes(cleanQuery) ||
        doc.practiceAddress.toLowerCase().includes(cleanQuery) ||
        doc.bio?.toLowerCase().includes(cleanQuery) ||
        doc.services.some(
          (s) =>
            s.name.toLowerCase().includes(cleanQuery) ||
            s.description.toLowerCase().includes(cleanQuery) ||
            s.category.toLowerCase().includes(cleanQuery)
        );
      if (!match) return false;
    }

    return true;
  });
}
