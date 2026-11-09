import type { Appointment } from '@/data/appointments';
import type { DoctorBooking, DoctorProfile, DoctorService } from '@/data/doctors';

/** Validates South African professional registration numbers (HPCSA MP/DP/PS, SANC, etc.) */
export function isValidCouncilNumber(councilNumber: string): boolean {
  if (!councilNumber) return false;
  const clean = councilNumber.trim().toUpperCase();
  // Standard SA council formats: MP 1234567, DP 1234567, PS 1234567, or 6-8 digit alphanumeric
  return /^(MP|DP|PS|PT|CH|PH|SANC)\s?[0-9A-Z]{5,8}$/.test(clean);
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
    createdAt: now,
  };

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
        ? 'Video Telehealth Consult'
        : 'In-person at ' + params.doctor.practiceAddress
    }. Consultation Fee: R${params.service.priceZar}. ${
      params.notes ? 'Notes: ' + params.notes : ''
    }`,
    status: 'confirmed',
    reminderOption: '1_day',
  };

  return { booking, appointment };
}
