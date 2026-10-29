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
  firstName: 'Jessica',
  lastName: 'Tebatso',
  preferredName: 'Jessica',
  dateOfBirth: '1978-04-12',
  idNumber: '7804125800080',
  gender: 'Female',
  phone: '+27 71 442 0198',
  email: 'jessica.tebatso@gmail.com',
  address: '14 Protea Close, Greenstone Hill, Edenvale, 1609',
  province: 'Gauteng',
  bloodGroup: 'O positive',
  allergies: [{ substance: 'Penicillin', reaction: 'Rash and facial swelling' }],
  chronicConditions: ['Type 2 Diabetes Mellitus', 'Hypertension'],
  previousProcedures: ['Laparoscopic cholecystectomy (2024)'],
  medicalDevices: [],
  emergencyContact: {
    name: 'Sipho Tebatso',
    relationship: 'Husband',
    phone: '+27 82 555 0142',
  },
  emergencyContacts: [
    {
      name: 'Sipho Tebatso',
      relationship: 'Husband',
      phone: '+27 82 555 0142',
    },
    {
      name: 'Nomsa Tebatso',
      relationship: 'Sister',
      phone: '+27 73 891 4020',
    },
  ],
  memberSince: '2024-02-11',
};
