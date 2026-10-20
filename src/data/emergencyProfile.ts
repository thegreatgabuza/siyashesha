export type EmergencyFieldKey =
  | 'fullName'
  | 'dateOfBirth'
  | 'bloodGroup'
  | 'allergies'
  | 'chronicConditions'
  | 'currentMedications'
  | 'previousProcedures'
  | 'medicalDevices';

export interface EmergencyFieldDef {
  key: EmergencyFieldKey;
  label: string;
  defaultVisible: boolean;
  mandatory?: boolean;
}

export const emergencyFieldDefs: EmergencyFieldDef[] = [
  { key: 'fullName', label: 'Full Name', defaultVisible: true },
  { key: 'dateOfBirth', label: 'Date of Birth', defaultVisible: true },
  { key: 'bloodGroup', label: 'Blood Group', defaultVisible: true },
  { key: 'allergies', label: 'Allergies', defaultVisible: true },
  { key: 'chronicConditions', label: 'Chronic Conditions', defaultVisible: true },
  { key: 'currentMedications', label: 'Current Medications', defaultVisible: true },
  { key: 'previousProcedures', label: 'Previous Procedures', defaultVisible: false },
  { key: 'medicalDevices', label: 'Medical Devices', defaultVisible: false },
];

export const defaultEmergencyVisibility: Record<EmergencyFieldKey, boolean> =
  emergencyFieldDefs.reduce(
    (acc, f) => ({ ...acc, [f.key]: f.defaultVisible }),
    {} as Record<EmergencyFieldKey, boolean>
  );
