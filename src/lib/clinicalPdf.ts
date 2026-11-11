import dayjs from 'dayjs';

import type {
  DoctorBooking,
  DoctorConsultationNotes,
  DoctorPrescriptionItem,
  DoctorProfile,
  DoctorSickCertificate,
} from '@/data/doctors';
import {
  generateDoctorPrescriptionHtml,
  generateHpcsaSickNoteHtml,
} from './clinicalPdfTemplates';
import { printAndShareHtml, type ExportDeliveryMode } from './pdf';

export {
  generateDoctorPrescriptionHtml,
  generateHpcsaSickNoteHtml,
};

/**
 * High-level helper to export and share/download an HPCSA Medical Sick Certificate PDF.
 */
export async function exportDoctorSickNotePdf(
  certificate: DoctorSickCertificate,
  doctor: DoctorProfile,
  mode: ExportDeliveryMode = 'share'
): Promise<string> {
  const html = generateHpcsaSickNoteHtml(certificate, doctor);
  const fileName = `Medical_Certificate_${certificate.patientName.replace(/\s+/g, '_')}_${dayjs(certificate.dateOfExamination).format('YYYY-MM-DD')}.pdf`;
  return await printAndShareHtml(html, `Medical Certificate — ${certificate.patientName}`, mode, fileName);
}

/**
 * High-level helper to export and share/download an official Doctor Prescription PDF.
 */
export async function exportDoctorPrescriptionPdf(
  options: {
    doctor: DoctorProfile;
    booking: DoctorBooking;
    prescriptions: DoctorPrescriptionItem[];
    clinicalNotes?: DoctorConsultationNotes;
  },
  mode: ExportDeliveryMode = 'share'
): Promise<string> {
  const html = generateDoctorPrescriptionHtml(options);
  const fileName = `Prescription_${options.booking.patientName.replace(/\s+/g, '_')}_${dayjs(options.booking.date).format('YYYY-MM-DD')}.pdf`;
  return await printAndShareHtml(html, `Prescription — ${options.booking.patientName}`, mode, fileName);
}
