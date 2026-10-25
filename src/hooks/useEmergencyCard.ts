import { useMemo } from 'react';

import { emergencyFieldDefs, type EmergencyFieldKey } from '@/data/emergencyProfile';
import { activeMedications } from '@/data/medications';
import { bloodGroupLabel } from '@/lib/bloodGroup';
import { emergencyReadiness } from '@/lib/passport';
import { useAppStore } from '@/store/useAppStore';

/**
 * Everything the ICE card shows, in one place, so the Home passport card, the Emergency screen,
 * the QR code and the PDF can never disagree. Unknown values read "Unknown" and an empty allergy
 * list reads "No allergies recorded" (no record is not the same as no allergy).
 */
export function useEmergencyCard() {
  const patient = useAppStore((s) => s.patientProfile);
  const visibility = useAppStore((s) => s.emergencyVisibility);
  const userMedications = useAppStore((s) => s.userMedications);
  const medications = useAppStore((s) => s.medications);

  return useMemo(() => {
    const meds = [
      ...(medications ?? activeMedications).filter((m) => m.status === 'active').map((m) => `${m.name} ${m.strength}`),
      ...userMedications.map((m) => [m.name, m.dose].filter(Boolean).join(' ')),
    ];
    const bloodGroup = bloodGroupLabel(patient.bloodGroup);
    const allergies = patient.allergies ?? [];
    const allergyList = allergies.map((a) => a.substance);
    const contact = patient.emergencyContact;
    const hasContact = !!contact?.phone?.trim();

    const values: Record<EmergencyFieldKey, string> = {
      fullName: [patient.firstName, patient.lastName].filter(Boolean).join(' ') || 'Unknown',
      dateOfBirth: patient.dateOfBirth || 'Unknown',
      bloodGroup,
      allergies:
        allergies.map((a) => (a.reaction && a.reaction !== 'Not recorded' ? `${a.substance} (${a.reaction})` : a.substance)).join('; ') ||
        'No allergies recorded',
      chronicConditions: (patient.chronicConditions ?? []).join('; ') || 'None recorded',
      currentMedications: meds.join(', ') || 'None recorded',
      previousProcedures: (patient.previousProcedures ?? []).join('; ') || 'None recorded',
      medicalDevices: (patient.medicalDevices ?? []).join('; ') || 'None recorded',
    };

    const visibleFields = emergencyFieldDefs.filter((f) => visibility[f.key]);
    const qrValue = JSON.stringify({
      app: 'Siyashesha Health Passport',
      emergencyContact: hasContact ? `${contact.name} (${contact.relationship}) ${contact.phone}` : 'Unknown',
      ...visibleFields.reduce((acc, f) => ({ ...acc, [f.label]: values[f.key] }), {} as Record<string, string>),
    });

    return {
      patient,
      values,
      visibleFields,
      qrValue,
      bloodGroup,
      bloodGroupKnown: bloodGroup !== 'Unknown',
      allergyList,
      contact,
      hasContact,
      readiness: emergencyReadiness(patient),
    };
  }, [patient, visibility, userMedications, medications]);
}
