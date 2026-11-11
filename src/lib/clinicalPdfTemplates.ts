import dayjs from 'dayjs';

import type {
  DoctorBooking,
  DoctorConsultationNotes,
  DoctorPrescriptionItem,
  DoctorProfile,
  DoctorSickCertificate,
} from '@/data/doctors';

/**
 * Generates an official, HPCSA Rule 16 compliant Medical Certificate (Sick Note) HTML document.
 */
export function generateHpcsaSickNoteHtml(
  certificate: DoctorSickCertificate,
  doctor: DoctorProfile
): string {
  const issueDateFormatted = dayjs(certificate.issuedAt || certificate.dateOfExamination).format('DD MMMM YYYY');
  const examDateFormatted = dayjs(certificate.dateOfExamination).format('DD MMMM YYYY');
  const startDateFormatted = dayjs(certificate.incapacityStartDate).format('DD MMMM YYYY');
  const endDateFormatted = dayjs(certificate.incapacityEndDate).format('DD MMMM YYYY');
  const resumeDateFormatted = dayjs(certificate.resumeDutyDate).format('DD MMMM YYYY');

  const diffDays = Math.max(
    1,
    dayjs(certificate.incapacityEndDate).diff(dayjs(certificate.incapacityStartDate), 'day') + 1
  );

  const diagnosisContent =
    certificate.natureOfIncapacity === 'specified' && certificate.diagnosisStatement
      ? `<div class="info-row">
          <span class="label">Clinical Diagnosis:</span>
          <span class="value bold highlight">${certificate.diagnosisStatement}</span>
        </div>`
      : `<div class="info-row">
          <span class="label">Nature of Incapacity:</span>
          <span class="value italic">Confidential medical condition as diagnosed by me (HPCSA Rule 16(1)(g) compliant)</span>
        </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Medical Certificate — ${certificate.patientName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      padding: 32px 36px;
      line-height: 1.5;
      font-size: 13px;
    }
    .letterhead {
      border-bottom: 3px double #0B2559;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .doc-name {
      font-size: 20px;
      font-weight: 800;
      color: #0B2559;
      letter-spacing: -0.3px;
    }
    .doc-sub {
      font-size: 12px;
      color: #334155;
      font-weight: 600;
      margin-top: 2px;
    }
    .practice-info {
      text-align: right;
      font-size: 11px;
      color: #475569;
      line-height: 1.4;
    }
    .badge-hpcsa {
      display: inline-block;
      background: #EFF6FF;
      color: #1D4ED8;
      border: 1px solid #BFDBFE;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 11px;
      margin-top: 4px;
    }
    .cert-title-container {
      text-align: center;
      margin: 20px 0 24px;
    }
    .cert-title {
      font-size: 17px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #0B2559;
      border: 1px solid #0B2559;
      display: inline-block;
      padding: 6px 20px;
      border-radius: 6px;
      background: #F8FAFC;
    }
    .cert-subtitle {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #64748B;
      margin-top: 6px;
    }
    .cert-meta {
      display: flex;
      justify-content: space-between;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .section {
      margin-bottom: 18px;
    }
    .info-row {
      display: flex;
      margin-bottom: 8px;
      line-height: 1.5;
    }
    .label {
      width: 170px;
      color: #64748B;
      font-size: 12px;
      font-weight: 500;
      flex-shrink: 0;
    }
    .value {
      flex: 1;
      color: #0F172A;
      font-size: 13px;
    }
    .bold { font-weight: 700; }
    .italic { font-style: italic; color: #475569; }
    .highlight { color: #0B2559; }

    .statement-box {
      background: #F0FDF4;
      border-left: 4px solid #16A34A;
      padding: 14px 16px;
      border-radius: 0 8px 8px 0;
      margin: 18px 0;
      font-size: 13px;
      line-height: 1.6;
      color: #14532D;
    }
    .dates-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
      margin: 16px 0;
    }
    .date-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .date-card-label {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748B;
    }
    .date-card-val {
      font-size: 14px;
      font-weight: 800;
      color: #0B2559;
      margin-top: 4px;
    }

    .recommendations-box {
      border: 1px dashed #CBD5E1;
      background: #FAFAFA;
      padding: 12px 14px;
      border-radius: 8px;
      margin-top: 14px;
    }
    .recommendations-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #475569;
      margin-bottom: 4px;
    }

    .legal-notice {
      margin-top: 24px;
      padding: 10px 12px;
      background: #F1F5F9;
      border-radius: 6px;
      font-size: 10px;
      color: #475569;
      line-height: 1.45;
    }

    .signatures {
      margin-top: 36px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .stamp-box {
      border: 2px dashed #94A3B8;
      width: 170px;
      height: 90px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #94A3B8;
      text-align: center;
      padding: 6px;
    }
    .sig-line-wrap {
      text-align: right;
    }
    .sig-line {
      border-top: 1.5px solid #0B2559;
      width: 220px;
      padding-top: 6px;
      font-size: 11px;
      color: #334155;
    }
    .sig-title {
      font-weight: 700;
      color: #0B2559;
      font-size: 12px;
    }
  </style>
</head>
<body>

  <!-- LETTERHEAD -->
  <div class="letterhead">
    <div>
      <div class="doc-name">${doctor.title} ${doctor.fullName}</div>
      <div class="doc-sub">${doctor.specialty} · ${doctor.qualifications || 'MBChB (UCT), FCFP (SA)'}</div>
      <div class="badge-hpcsa">HPCSA Reg: ${doctor.hpcsaNumber}</div>
    </div>
    <div class="practice-info">
      <div style="font-weight: 700; color: #0F172A;">${doctor.practiceName}</div>
      <div>${doctor.practiceAddress}</div>
      <div>${doctor.city}, ${doctor.province}</div>
      <div>Tel: ${doctor.phone} · Email: ${doctor.email}</div>
      <div>Practice No: ${certificate.doctorPracticeNumber || '0542318'}</div>
    </div>
  </div>

  <!-- CERTIFICATE TITLE -->
  <div class="cert-title-container">
    <div class="cert-title">Medical Certificate of Incapacity</div>
    <div class="cert-subtitle">Mediese Sertifikaat van Ongeskiktheid · Issued under HPCSA Rule 16</div>
  </div>

  <!-- META BAR -->
  <div class="cert-meta">
    <div><strong>Certificate No:</strong> ${certificate.certificateNumber}</div>
    <div><strong>Date of Issue:</strong> ${issueDateFormatted}</div>
    <div><strong>Duration:</strong> ${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}</div>
  </div>

  <!-- PATIENT DETAILS -->
  <div class="section">
    <div class="info-row">
      <span class="label">Patient Full Name:</span>
      <span class="value bold">${certificate.patientName}</span>
    </div>
    ${certificate.patientIdNumber ? `
    <div class="info-row">
      <span class="label">SA ID / Passport No:</span>
      <span class="value">${certificate.patientIdNumber}</span>
    </div>` : ''}
    <div class="info-row">
      <span class="label">Date of Examination:</span>
      <span class="value">${examDateFormatted}</span>
    </div>
    ${diagnosisContent}
  </div>

  <!-- LEGAL CLINICAL STATEMENT -->
  <div class="statement-box">
    I, the undersigned medical practitioner, hereby certify that I personally examined <strong>${certificate.patientName}</strong> on <strong>${examDateFormatted}</strong>, and in my professional clinical opinion, the patient is incapacitated and unfit for normal work duties due to medical illness.
  </div>

  <!-- DATES GRID -->
  <div class="dates-grid">
    <div class="date-card">
      <div class="date-card-label">Incapacity From</div>
      <div class="date-card-val">${startDateFormatted}</div>
    </div>
    <div class="date-card">
      <div class="date-card-label">Up to & Including</div>
      <div class="date-card-val">${endDateFormatted}</div>
    </div>
    <div class="date-card">
      <div class="date-card-label">Resume Duty On</div>
      <div class="date-card-val" style="color: #16A34A;">${resumeDateFormatted}</div>
    </div>
  </div>

  <!-- RECOMMENDATIONS -->
  ${certificate.recommendation ? `
  <div class="recommendations-box">
    <div class="recommendations-title">Medical Recommendations & Duty Adjustments:</div>
    <div style="font-size: 12px; color: #1E293B;">${certificate.recommendation}</div>
  </div>` : ''}

  <!-- HPCSA LEGAL COMPLIANCE NOTICE -->
  <div class="legal-notice">
    <strong>Health Professions Council of South Africa (HPCSA) Notice:</strong> This certificate is issued strictly in accordance with Rule 16 of the Ethical and Professional Rules of the Medical and Dental Professions Board of South Africa. Alteration of this certificate is a criminal offence under South African law.
  </div>

  <!-- SIGNATURE BLOCK -->
  <div class="signatures">
    <div class="stamp-box">
      <strong>OFFICIAL PRACTICE STAMP</strong><br />
      ${doctor.practiceName}<br />
      HPCSA: ${doctor.hpcsaNumber}<br />
      ${doctor.city}
    </div>

    <div class="sig-line-wrap">
      <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 22px; color: #0B2559; margin-bottom: 2px;">
        ${doctor.fullName}
      </div>
      <div class="sig-line">
        <div class="sig-title">${doctor.title} ${doctor.fullName}</div>
        <div>${doctor.specialty}</div>
        <div>HPCSA: ${doctor.hpcsaNumber} · BHF: ${certificate.doctorPracticeNumber || '0542318'}</div>
      </div>
    </div>
  </div>

</body>
</html>`;
}

/**
 * Generates an official Doctor's Prescription (e-Script) HTML document.
 */
export function generateDoctorPrescriptionHtml(options: {
  doctor: DoctorProfile;
  booking: DoctorBooking;
  prescriptions: DoctorPrescriptionItem[];
  clinicalNotes?: DoctorConsultationNotes;
}): string {
  const { doctor, booking, prescriptions, clinicalNotes } = options;
  const consultDate = dayjs(booking.date).format('DD MMMM YYYY');

  const prescriptionRows = prescriptions
    .map(
      (rx, idx) => `
    <tr>
      <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; font-weight: 700; color: #0F172A;">
        <span style="font-size: 10px; color: #64748B; margin-right: 4px;">#${idx + 1}</span>
        ${rx.medicationName} ${rx.dosage ? `(${rx.dosage})` : ''}
      </td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; color: #334155; font-size: 12px;">
        ${rx.instructions}
      </td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #0F172A; font-weight: 600;">
        ${rx.quantity}
      </td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #16A34A; font-weight: 700;">
        ${rx.repeats > 0 ? `${rx.repeats}x Repeats` : '0 (No Repeat)'}
      </td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Prescription — ${booking.patientName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      padding: 32px 36px;
      line-height: 1.5;
      font-size: 13px;
    }
    .letterhead {
      border-bottom: 3px double #0B2559;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .doc-name {
      font-size: 20px;
      font-weight: 800;
      color: #0B2559;
    }
    .doc-sub {
      font-size: 12px;
      color: #334155;
      font-weight: 600;
      margin-top: 2px;
    }
    .practice-info {
      text-align: right;
      font-size: 11px;
      color: #475569;
      line-height: 1.4;
    }
    .rx-header-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      padding: 10px 14px;
      border-radius: 8px;
      margin-bottom: 18px;
    }
    .rx-symbol {
      font-size: 26px;
      font-weight: 900;
      font-family: serif;
      color: #0B2559;
    }
    .patient-block {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 18px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background: #F1F5F9;
      padding: 8px;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #475569;
      border-bottom: 1px solid #CBD5E1;
      text-align: left;
    }
    .notes-box {
      margin-top: 16px;
      padding: 10px 12px;
      background: #EFF6FF;
      border-left: 3px solid #2563EB;
      border-radius: 0 6px 6px 0;
      font-size: 11.5px;
      color: #1E3A8A;
    }
    .signatures {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .stamp-box {
      border: 2px dashed #94A3B8;
      width: 170px;
      height: 80px;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #94A3B8;
      text-align: center;
      padding: 4px;
    }
    .sig-line {
      border-top: 1.5px solid #0B2559;
      width: 220px;
      padding-top: 6px;
      font-size: 11px;
      color: #334155;
      text-align: right;
    }
  </style>
</head>
<body>

  <!-- LETTERHEAD -->
  <div class="letterhead">
    <div>
      <div class="doc-name">${doctor.title} ${doctor.fullName}</div>
      <div class="doc-sub">${doctor.specialty} · ${doctor.qualifications || 'MBChB (UCT), FCFP (SA)'}</div>
      <div style="font-size: 11px; font-weight: 700; color: #1D4ED8; margin-top: 2px;">
        HPCSA: ${doctor.hpcsaNumber} · BHF Practice: 0542318
      </div>
    </div>
    <div class="practice-info">
      <div style="font-weight: 700; color: #0F172A;">${doctor.practiceName}</div>
      <div>${doctor.practiceAddress}</div>
      <div>${doctor.city}, ${doctor.province}</div>
      <div>Tel: ${doctor.phone}</div>
    </div>
  </div>

  <!-- RX BANNER -->
  <div class="rx-header-banner">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span class="rx-symbol">℞</span>
      <div>
        <div style="font-weight: 800; font-size: 14px; text-transform: uppercase; color: #0B2559;">
          Electronic Prescription (e-Script)
        </div>
        <div style="font-size: 10px; color: #64748B;">Valid South African Medical Prescription</div>
      </div>
    </div>
    <div style="text-align: right; font-size: 11px;">
      <div><strong>Date:</strong> ${consultDate}</div>
      <div><strong>Prescription ID:</strong> RX-${booking.id.toUpperCase()}</div>
    </div>
  </div>

  <!-- PATIENT INFO -->
  <div class="patient-block">
    <div><strong>Patient:</strong> ${booking.patientName}</div>
    <div><strong>Contact:</strong> ${booking.patientPhone || 'Not provided'}</div>
    <div><strong>Email:</strong> ${booking.patientEmail || 'Not provided'}</div>
    <div><strong>Service:</strong> ${booking.serviceName}</div>
  </div>

  <!-- PRESCRIPTION TABLE -->
  <table>
    <thead>
      <tr>
        <th style="width: 42%;">Medication & Strength</th>
        <th style="width: 38%;">Directions / Sig</th>
        <th style="width: 10%; text-align: center;">Qty</th>
        <th style="width: 10%; text-align: center;">Repeats</th>
      </tr>
    </thead>
    <tbody>
      ${prescriptionRows}
    </tbody>
  </table>

  ${
    clinicalNotes?.assessment
      ? `<div class="notes-box">
          <strong>Clinical Diagnosis:</strong> ${clinicalNotes.assessment}
          ${clinicalNotes.plan ? `<br /><strong>Plan / Advice:</strong> ${clinicalNotes.plan}` : ''}
        </div>`
      : ''
  }

  <!-- SIGNATURES -->
  <div class="signatures">
    <div class="stamp-box">
      <strong>OFFICIAL PRACTICE STAMP</strong><br />
      ${doctor.practiceName}<br />
      HPCSA: ${doctor.hpcsaNumber}
    </div>

    <div>
      <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 24px; color: #0B2559; text-align: right; margin-bottom: 2px;">
        ${doctor.fullName}
      </div>
      <div class="sig-line">
        <div style="font-weight: 700; color: #0B2559;">${doctor.title} ${doctor.fullName}</div>
        <div>HPCSA: ${doctor.hpcsaNumber}</div>
        <div>Dispensing / Prescribing Practitioner</div>
      </div>
    </div>
  </div>

</body>
</html>`;
}
