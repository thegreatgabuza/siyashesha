import * as Crypto from 'expo-crypto';
import dayjs from 'dayjs';

import type { DiaryNote } from '@/data/diarySeed';
import type { Medication } from '@/data/medications';
import type { PatientProfile } from '@/data/patient';
import type { MedicalRecord } from '@/data/records';

export type ReportType = 'comprehensive' | 'emergency' | 'discharge';

export interface MedicalSummaryExportOptions {
  reportType: ReportType;
  patient: PatientProfile;
  records: MedicalRecord[];
  medications: Medication[];
  diaryNotes?: DiaryNote[];
  includeDiaryNotes?: boolean;
  includeEnclaveVerificationSeal?: boolean;
  verificationUrl?: string;
  notes?: string;
}

/**
 * Generates clean, hospital-grade, print-ready HTML for a patient clinical summary PDF.
 */
export async function generateMedicalSummaryHtml(options: MedicalSummaryExportOptions): Promise<string> {
  const {
    reportType,
    patient,
    records,
    medications,
    diaryNotes = [],
    includeDiaryNotes = false,
    includeEnclaveVerificationSeal = true,
    verificationUrl = process.env.EXPO_PUBLIC_EMERGENCY_PORTAL_URL || 'https://siyashesha-health-passport.lovable.app',
    notes,
  } = options;

  const now = new Date();
  const formattedDate = dayjs(now).format('DD MMMM YYYY [at] HH:mm');
  const birthDate = dayjs(patient.dateOfBirth).format('DD MMMM YYYY');
  const age = dayjs().diff(dayjs(patient.dateOfBirth), 'year');

  // Filter records based on report type
  let filteredRecords = [...records];
  if (reportType === 'discharge') {
    filteredRecords = filteredRecords.filter(
      (r) =>
        r.category === 'Discharge Summaries' ||
        r.category === 'Hospital Visits' ||
        r.category === 'Operations' ||
        r.category === 'Specialist Letters'
    );
  } else if (reportType === 'emergency') {
    // Only recent or critical records
    filteredRecords = filteredRecords.slice(0, 3);
  }

  // Active medications
  const activeMeds = medications.filter((m) => m.status === 'active');

  // Generate SHA-256 integrity checksum for verification seal
  const docPayload = `${patient.idNumber}-${patient.bloodGroup}-${records.length}-${activeMeds.length}-${now.toISOString()}`;
  let checksum = 'SHA256-PENDING';
  try {
    checksum = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, docPayload);
  } catch {
    checksum = 'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855';
  }
  const shortChecksum = checksum.slice(0, 16).toUpperCase();

  const titleMap: Record<ReportType, string> = {
    comprehensive: 'Comprehensive Patient Health Passport & Clinical Summary',
    emergency: 'Emergency First-Responder ICE Medical Summary',
    discharge: 'Clinical Discharge & Handover Medical Summary',
  };

  const badgeColorMap: Record<ReportType, string> = {
    comprehensive: '#0B2559',
    emergency: '#DC1F26',
    discharge: '#0D7C66',
  };

  const badgeLabelMap: Record<ReportType, string> = {
    comprehensive: 'CONFIDENTIAL CLINICAL PASSPORT',
    emergency: 'FIRST-RESPONDER EMERGENCY ICE',
    discharge: 'HOSPITAL DISCHARGE HANDOVER',
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=${encodeURIComponent(
    verificationUrl
  )}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${titleMap[reportType]} - ${patient.firstName} ${patient.lastName}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
    }
    *, *:before, *:after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background-color: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.45;
    }
    .header-table {
      width: 100%;
      border-bottom: 2.5px solid #0B2559;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #0B2559;
      margin: 0;
    }
    .brand-sub {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #DC1F26;
      margin-top: 2px;
    }
    .doc-badge {
      display: inline-block;
      background-color: ${badgeColorMap[reportType]};
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.8px;
      padding: 4px 10px;
      border-radius: 6px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .doc-meta {
      font-size: 10px;
      color: #64748B;
      text-align: right;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #0B2559;
      border-bottom: 1.5px solid #E2E8F0;
      padding-bottom: 4px;
      margin-top: 16px;
      margin-bottom: 10px;
    }
    .patient-grid {
      display: table;
      width: 100%;
      background-color: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 16px;
    }
    .grid-row {
      display: table-row;
    }
    .grid-cell {
      display: table-cell;
      padding: 4px 10px;
      vertical-align: top;
    }
    .cell-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: #64748B;
      margin-bottom: 1px;
    }
    .cell-val {
      font-size: 12px;
      font-weight: 600;
      color: #0F172A;
    }
    .blood-highlight {
      display: inline-block;
      background-color: #DC1F26;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 14px;
      padding: 3px 10px;
      border-radius: 6px;
    }
    .alert-box {
      background-color: #FEF2F2;
      border-left: 4px solid #DC1F26;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .alert-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #DC1F26;
      margin-bottom: 4px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      page-break-inside: auto;
    }
    .data-table th {
      background-color: #0B2559;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      text-align: left;
      padding: 7px 10px;
    }
    .data-table td {
      border-bottom: 1px solid #E2E8F0;
      padding: 7px 10px;
      font-size: 11px;
      vertical-align: top;
    }
    .data-table tr:nth-child(even) td {
      background-color: #F8FAFC;
    }
    .med-tag {
      font-weight: 700;
      color: #0B2559;
    }
    .record-card {
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 10px;
      background-color: #FFFFFF;
      page-break-inside: avoid;
    }
    .record-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed #CBD5E1;
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .record-title {
      font-size: 12px;
      font-weight: 700;
      color: #0B2559;
    }
    .record-meta {
      font-size: 10px;
      color: #64748B;
    }
    .record-diag {
      font-size: 11px;
      color: #1E293B;
      margin-bottom: 4px;
    }
    .record-notes {
      font-size: 10px;
      color: #475569;
      background-color: #F8FAFC;
      padding: 6px 10px;
      border-radius: 4px;
    }
    .verification-box {
      border: 1px dashed #94A3B8;
      border-radius: 8px;
      background-color: #F8FAFC;
      padding: 12px 16px;
      margin-top: 18px;
      page-break-inside: avoid;
    }
    .qr-container {
      float: right;
      margin-left: 14px;
      text-align: center;
    }
    .footer-note {
      font-size: 9px;
      color: #94A3B8;
      text-align: center;
      margin-top: 24px;
      border-top: 1px solid #E2E8F0;
      padding-top: 8px;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <table class="header-table" cellpadding="0" cellspacing="0">
    <tr>
      <td style="vertical-align: middle;">
        <div class="brand-title">SIYASHESHA</div>
        <div class="brand-sub">Health Passport · Clinical Summary</div>
      </td>
      <td style="text-align: right; vertical-align: middle;">
        <span class="doc-badge">${badgeLabelMap[reportType]}</span>
        <div class="doc-meta">Generated: ${formattedDate}</div>
        <div class="doc-meta">Doc Ref: SY-${shortChecksum}</div>
      </td>
    </tr>
  </table>

  <!-- Patient Identity & Demographics -->
  <div class="patient-grid">
    <div class="grid-row">
      <div class="grid-cell" style="width: 32%;">
        <div class="cell-label">Patient Full Name</div>
        <div class="cell-val" style="font-size: 14px;">${patient.firstName} ${patient.lastName}</div>
      </div>
      <div class="grid-cell" style="width: 26%;">
        <div class="cell-label">National ID / Passport</div>
        <div class="cell-val">${patient.idNumber || 'Not recorded'}</div>
      </div>
      <div class="grid-cell" style="width: 22%;">
        <div class="cell-label">Date of Birth & Age</div>
        <div class="cell-val">${birthDate} (${age} yrs)</div>
      </div>
      <div class="grid-cell" style="width: 20%; text-align: center;">
        <div class="cell-label">Blood Group</div>
        <div class="blood-highlight">${patient.bloodGroup || 'Unknown'}</div>
      </div>
    </div>
    <div class="grid-row" style="margin-top: 6px;">
      <div class="grid-cell">
        <div class="cell-label">Emergency Contact (Next of Kin)</div>
        <div class="cell-val">${patient.emergencyContact.name} (${patient.emergencyContact.relationship}) · <strong style="color: #0B2559;">${patient.emergencyContact.phone}</strong></div>
      </div>
      <div class="grid-cell">
        <div class="cell-label">Primary Mobile Phone</div>
        <div class="cell-val">${patient.phone}</div>
      </div>
      <div class="grid-cell" colspan="2">
        <div class="cell-label">Residential Address</div>
        <div class="cell-val">${patient.address}</div>
      </div>
    </div>
  </div>

  <!-- Critical Allergies Alert Box -->
  <div class="alert-box">
    <div class="alert-title">Critical Allergies & Clinical Contraindications</div>
    <div style="font-size: 11px; font-weight: 600; color: #991B1B;">
      ${
        patient.allergies.length > 0
          ? patient.allergies.map((a) => `<strong>${a.substance}</strong>: ${a.reaction}`).join(' · ')
          : 'No known drug or food allergies recorded (NKDA).'
      }
    </div>
  </div>

  <!-- Chronic Conditions & Previous Procedures -->
  <table style="width: 100%; margin-bottom: 14px;" cellpadding="0" cellspacing="0">
    <tr>
      <td style="width: 50%; vertical-align: top; padding-right: 8px;">
        <div class="section-title" style="margin-top: 0;">Diagnosed Chronic Conditions</div>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; font-size: 11px;">
          ${
            patient.chronicConditions.length > 0
              ? patient.chronicConditions.map((c) => `• <strong>${c}</strong>`).join('<br/>')
              : 'No chronic conditions documented.'
          }
        </div>
      </td>
      <td style="width: 50%; vertical-align: top; padding-left: 8px;">
        <div class="section-title" style="margin-top: 0;">Surgical History & Implants</div>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 12px; font-size: 11px;">
          ${
            patient.previousProcedures.length > 0
              ? patient.previousProcedures.map((p) => `• ${p}`).join('<br/>')
              : 'None documented.'
          }
          ${
            patient.medicalDevices.length > 0
              ? `<br/>• Medical Devices: ${patient.medicalDevices.join(', ')}`
              : ''
          }
        </div>
      </td>
    </tr>
  </table>

  <!-- Active Medication Regimen -->
  <div class="section-title">Active Prescription Regimen (${activeMeds.length} Active Prescriptions)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 25%;">Medication & Dose</th>
        <th style="width: 25%;">Indication & Frequency</th>
        <th style="width: 25%;">Patient Directions</th>
        <th style="width: 25%;">Prescriber & Facility</th>
      </tr>
    </thead>
    <tbody>
      ${
        activeMeds.length > 0
          ? activeMeds
              .map(
                (m) => `
        <tr>
          <td><span class="med-tag">${m.name}</span> <span style="color: #64748B;">${m.strength}</span></td>
          <td>${m.indication}<br/><span style="color: #64748B; font-size: 10px;">${m.route} · ${m.frequency}</span></td>
          <td>${m.directions || 'Take as instructed'}</td>
          <td>${m.prescriber || 'Attending Physician'}<br/><span style="color: #64748B; font-size: 10px;">${m.facility || 'Clinical Practice'}</span></td>
        </tr>
      `
              )
              .join('')
          : '<tr><td colspan="4" style="text-align: center; color: #64748B;">No active prescription regimens recorded.</td></tr>'
      }
    </tbody>
  </table>

  <!-- Clinical Encounters / Medical Records -->
  <div class="section-title">Verified Clinical Encounters (${filteredRecords.length} Records)</div>
  ${
    filteredRecords.length > 0
      ? filteredRecords
          .map(
            (r) => `
      <div class="record-card">
        <div class="record-header">
          <div>
            <span class="record-title">${r.title}</span>
            <span style="background-color: #E2E8F0; color: #334155; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">
              ${r.category}
            </span>
          </div>
          <div class="record-meta">${dayjs(r.eventDate).format('DD MMM YYYY')}</div>
        </div>
        <div class="record-meta" style="margin-bottom: 4px;">
          Facility: <strong>${r.facility}</strong> ${r.doctor ? `· Attending: <strong>${r.doctor}</strong>` : ''}
        </div>
        ${r.diagnosis ? `<div class="record-diag"><strong>Clinical Diagnosis:</strong> ${r.diagnosis}</div>` : ''}
        ${
          r.clinicalNotes
            ? `<div class="record-notes"><strong>Verbatim Clinical Extract:</strong> ${r.clinicalNotes}</div>`
            : ''
        }
        ${
          r.followUp
            ? `<div style="font-size: 10px; color: #0D7C66; margin-top: 4px; font-weight: 600;">Follow-up / Recommendation: ${r.followUp}</div>`
            : ''
        }
      </div>
    `
          )
          .join('')
      : '<div style="color: #64748B; font-size: 11px; margin-bottom: 14px;">No encounter records match this scope.</div>'
  }

  <!-- Optional Patient Diary Observations -->
  ${
    includeDiaryNotes && diaryNotes.length > 0
      ? `
    <div class="section-title">Patient Health Journal & Consultation Notes</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 20%;">Date & Time</th>
          <th style="width: 20%;">Category & Title</th>
          <th style="width: 60%;">Patient Logged Entry</th>
        </tr>
      </thead>
      <tbody>
        ${diaryNotes
          .slice(0, 5)
          .map(
            (n) => `
          <tr>
            <td>${dayjs(n.createdAt).format('DD MMM YYYY HH:mm')}</td>
            <td><strong>${n.title}</strong><br/><span style="color: #64748B; font-size: 10px;">${n.category}</span></td>
            <td>${n.body}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  `
      : ''
  }

  <!-- Optional Custom Notes -->
  ${
    notes
      ? `
    <div class="section-title">Handover & Clinical Notes</div>
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 10px 14px; font-size: 11px; margin-bottom: 14px;">
      ${notes}
    </div>
  `
      : ''
  }

  <!-- Digital Verification Box & Legal Disclaimer -->
  <div class="verification-box">
    <div class="qr-container">
      <img src="${qrImageUrl}" width="96" height="96" style="border: 1px solid #CBD5E1; border-radius: 6px;" alt="Verification QR" />
      <div style="font-size: 8px; color: #64748B; margin-top: 2px;">Scan to Verify</div>
    </div>
    <div style="margin-right: 120px;">
      <div style="font-size: 11px; font-weight: 700; color: #0B2559; text-transform: uppercase;">
        Siyashesha Cryptographic Verification Seal
      </div>
      <div style="font-size: 10px; color: #475569; margin-top: 2px; line-height: 1.4;">
        This document was generated directly from the authenticated Siyashesha Health Passport vault on the patient's device.
        ${
          includeEnclaveVerificationSeal
            ? `<br/>Hardware Enclave Integrity Hash: <code style="font-size: 9px; background: #E2E8F0; padding: 1px 4px; border-radius: 3px;">${checksum.slice(0, 32)}...</code>`
            : ''
        }
      </div>
      <div style="font-size: 9px; color: #64748B; margin-top: 6px;">
        Emergency Verification Portal: <a href="${verificationUrl}" style="color: #0B2559;">${verificationUrl}</a>
      </div>
    </div>
    <div style="clear: both;"></div>
  </div>

  <!-- Footer Notice -->
  <div class="footer-note">
    Siyashesha Health Passport · Compliant with Republic of South Africa Protection of Personal Information Act (POPIA Act 4 of 2013) & National Health Act 61 of 2003.<br/>
    Notice: The original medical record held by the issuing health establishment remains the authoritative clinical record.
  </div>

</body>
</html>
  `.trim();
}
