export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface PatientProfile {
  firstName: string;
  lastName: string;
  preferredName: string;
  avatarUrl?: string;
  dateOfBirth: string; // ISO
  idNumber: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  bloodGroup: string;
  allergies: { substance: string; reaction: string }[];
  chronicConditions: string[];
  previousProcedures: string[];
  medicalDevices: string[];
  emergencyContact: EmergencyContact;
  emergencyContacts?: EmergencyContact[];
  memberSince: string; // ISO
}

export const patient: PatientProfile = {
  firstName: '',
  lastName: '',
  preferredName: '',
  dateOfBirth: '',
  idNumber: '',
  gender: '',
  phone: '',
  email: '',
  address: '',
  province: 'Gauteng',
  bloodGroup: '',
  allergies: [],
  chronicConditions: [],
  previousProcedures: [],
  medicalDevices: [],
  emergencyContact: {
    name: '',
    relationship: '',
    phone: '',
  },
  emergencyContacts: [],
  memberSince: new Date().toISOString().slice(0, 10),
};
