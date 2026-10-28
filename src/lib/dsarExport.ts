import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import dayjs from 'dayjs';

import { useAppStore } from '@/store/useAppStore';

export interface DsarExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  sha256Seal?: string;
  recordCount: number;
  medicationCount: number;
  diaryCount: number;
  appointmentCount: number;
  error?: string;
}

/**
 * Builds the complete POPIA Section 23 / HIPAA DSAR Data Archive payload.
 */
export function buildDsarJsonPayload() {
  const state = useAppStore.getState();
  const now = new Date().toISOString();

  return {
    _legalCompliance: {
      frameworks: [
        'Protection of Personal Information Act (POPIA), Act No. 4 of 2013, Section 23 (Access to personal information)',
        'POPIA Section 24 (Correction or deletion of personal information and destruction of record)',
        'Health Insurance Portability and Accountability Act (HIPAA), 45 CFR § 164.524 (Access of individuals to protected health information)',
      ],
      jurisdiction: 'Republic of South Africa',
      regulatoryNotice:
        'This file is an official, complete, portable export of all personal health records, clinical observations, audit trails, and security logs maintained on the Siyashesha Health Passport platform for the identified patient.',
      exportedAt: now,
      application: 'Siyashesha Health Passport',
      version: '1.0.0',
    },
    patientProfile: state.patientProfile,
    emergencyProfile: {
      visibilitySettings: state.emergencyVisibility,
      emergencyContact: state.patientProfile.emergencyContact,
      criticalAllergies: state.patientProfile.allergies,
      bloodGroup: state.patientProfile.bloodGroup,
      chronicConditions: state.patientProfile.chronicConditions,
      medicalDevices: state.patientProfile.medicalDevices,
      previousProcedures: state.patientProfile.previousProcedures,
    },
    medicalRecordsVault: state.records.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      facility: r.facility,
      doctor: r.doctor,
      diagnosis: r.diagnosis,
      followUp: r.followUp,
      eventDate: r.eventDate,
      uploadedAt: r.uploadedAt,
      sourceType: r.sourceType,
      documentType: r.documentType,
      clinicalNotes: r.clinicalNotes,
      structuredFields: r.fields,
      remoteStorageUrl: r.originalFile?.remoteUrl,
    })),
    medicationManagement: {
      activeAndPastPrescriptions: state.medications,
      userCustomMedications: state.userMedications,
      adherenceDoseLog: state.takenLog,
      skippedDosesLog: state.skippedLog,
    },
    diaryNotesAndObservations: state.diaryNotes.map((d) => ({
      id: d.id,
      title: d.title,
      body: d.body,
      entryDate: d.entryDate,
      category: d.category,
      pinned: d.pinned,
      attachmentsCount: d.attachments.length,
      attachments: d.attachments.map((a) => ({
        id: a.id,
        kind: a.kind,
        name: a.name,
        duration: a.duration,
      })),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    })),
    calendarAppointments: state.appointments,
    doctorSharingAuthorizations: state.sharedLinks.map((s) => ({
      shareId: s.id,
      recipientDoctorOrClinic: s.recipientName,
      recipientFacility: s.recipientFacility,
      sharedRecordIds: s.recordIds,
      sharedDiaryIds: s.diaryNoteIds,
      accessDuration: s.durationId,
      status: s.status,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
    })),
    securityAndPreferences: {
      themePreference: state.themePreference,
      systemLanguage: state.language,
      biometricLockEnabled: state.biometricLock,
      sharingRequiresPin: state.sharingRequiresPin,
      mfaEnabled: state.mfaEnabled,
      notificationSettings: state.notifications,
    },
    immutableAccountAuditTrail: state.auditEvents,
  };
}

/**
 * Generates and shares a certified POPIA / HIPAA DSAR Health Data Archive file.
 */
export async function exportDsarArchive(): Promise<DsarExportResult> {
  try {
    const payload = buildDsarJsonPayload();
    const jsonString = JSON.stringify(payload, null, 2);

    // Compute cryptographic SHA-256 seal for integrity verification
    const sha256Seal = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      jsonString
    );

    const timeStamp = dayjs().format('YYYYMMDD_HHmmss');
    const fileName = `siyashesha_health_archive_${timeStamp}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, jsonString, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: 'Siyashesha Health Passport — POPIA / HIPAA DSAR Archive',
        UTI: 'public.json',
      });
    }

    // Log compliance audit event
    useAppStore.getState().logAudit(
      'export',
      `Exported full POPIA §23 / HIPAA DSAR Health Archive (SHA-256: ${sha256Seal.slice(0, 12)}…)`
    );

    return {
      success: true,
      filePath,
      fileName,
      sha256Seal,
      recordCount: payload.medicalRecordsVault.length,
      medicationCount: payload.medicationManagement.activeAndPastPrescriptions.length,
      diaryCount: payload.diaryNotesAndObservations.length,
      appointmentCount: payload.calendarAppointments.length,
    };
  } catch (err: any) {
    console.error('[DSAR] Export error:', err);
    return {
      success: false,
      recordCount: 0,
      medicationCount: 0,
      diaryCount: 0,
      appointmentCount: 0,
      error: err?.message || 'Failed to generate DSAR health archive',
    };
  }
}
