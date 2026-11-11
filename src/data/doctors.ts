export interface DoctorService {
  id: string;
  doctorId: string;
  name: string;
  description: string;
  durationMinutes: number; // 15, 30, 45, 60
  priceZar: number; // in South African Rand (ZAR)
  category: 'Consultation' | 'Follow-up' | 'Procedure' | 'Screening' | 'Prescription' | 'Telehealth';
  mode: 'in_person' | 'video' | 'both';
  isActive: boolean;
}

export interface DoctorAvailability {
  days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[];
  startTime: string; // "08:30"
  endTime: string; // "17:00"
  slotDurationMinutes: number; // 30
}

export interface DoctorProfile {
  id: string;
  userId?: string;
  title: string; // "Dr.", "Prof.", etc.
  fullName: string;
  specialty: string; // "General Practitioner", "Paediatrician", etc.
  hpcsaNumber: string; // Professional board number (e.g. "MP 0782341")
  practiceName: string; // "Sandton Health Medical Suites"
  practiceAddress: string; // "Suite 204, Sandton City Medical Centre"
  city: string; // "Johannesburg"
  province: string; // "Gauteng"
  phone: string;
  email: string;
  bio: string;
  qualifications: string[]; // e.g. ["MBChB (UCT)", "FCFP (SA)"]
  avatarUrl?: string;
  rating?: number; // 4.9
  reviewsCount?: number; // 38
  consultationModes: ('in_person' | 'video')[];
  availability: DoctorAvailability;
  services: DoctorService[];
  medicalAids?: string[];
  patientHighlight?: string;
  createdAt: string;
}

export interface PatientClinicalSummary {
  bloodGroup?: string;
  dateOfBirth?: string;
  gender?: string;
  allergies?: { substance: string; reaction: string }[];
  chronicConditions?: string[];
  activeMedications?: string[];
  emergencyContact?: { name: string; relationship: string; phone: string };
  vitalNotes?: string;
}

export interface DoctorConsultationNotes {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icd10Code?: string;
  recordedAt: string;
}

export interface DoctorPrescriptionItem {
  id: string;
  medicationName: string;
  dosage: string;
  instructions: string;
  durationDays: number;
  repeats: number;
  quantity: string;
}

export interface DoctorSickCertificate {
  id: string;
  certificateNumber: string;
  patientName: string;
  patientIdNumber?: string;
  dateOfExamination: string;
  incapacityStartDate: string;
  incapacityEndDate: string;
  resumeDutyDate: string;
  natureOfIncapacity: 'confidential' | 'specified';
  diagnosisStatement?: string;
  recommendation: string;
  doctorName: string;
  doctorHpcsaNumber: string;
  doctorPracticeNumber?: string;
  issuedAt: string;
}

export interface DoctorBooking {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  practiceName: string;
  practiceAddress: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  priceZar: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  mode: 'in_person' | 'video';
  notes?: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  linkedAppointmentId?: string;
  patientSummary?: PatientClinicalSummary;
  clinicalNotes?: DoctorConsultationNotes;
  prescriptions?: DoctorPrescriptionItem[];
  sickNote?: DoctorSickCertificate;
  createdAt: string;
}

export const DOCTOR_SPECIALTIES = [
  'General Practitioner',
  'Paediatrician',
  'Dentist',
  'Clinical Psychologist',
  'Obstetrician & Gynaecologist',
  'Cardiologist',
  'Dermatologist',
  'Physiotherapist',
  'Psychiatrist',
  'Orthopaedic Surgeon',
  'Optometrist',
  'Dietitian',
] as const;

export type DoctorSpecialty = (typeof DOCTOR_SPECIALTIES)[number];

export const SERVICE_CATEGORIES = [
  'Consultation',
  'Follow-up',
  'Procedure',
  'Screening',
  'Prescription',
  'Telehealth',
] as const;

/** Verified South African community doctors directory */
export const initialDoctors: DoctorProfile[] = [
  {
    id: 'doc-thobani-gabuza',
    title: 'Dr.',
    fullName: 'Thobani Gabuza',
    specialty: 'General Practitioner',
    hpcsaNumber: 'MP 0849210',
    practiceName: 'Gabuza Family Medicine & Wellness Practice',
    practiceAddress: 'Suite 204, Sandton Medical Suites, 83 Rivonia Rd',
    city: 'Johannesburg',
    province: 'Gauteng',
    phone: '+27 82 456 7890',
    email: 'thobanisgabuzam2@gmail.com',
    bio: 'Family physician & general practitioner specialising in preventative clinical care, chronic disease management, and digital health consultations.',
    qualifications: ['MBChB (UCT)', 'Dip Primary Emergency Care (CMSA)', 'FCFP (SA)'],
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    rating: 5.0,
    reviewsCount: 32,
    consultationModes: ['in_person', 'video'],
    availability: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '08:30',
      endTime: '17:00',
      slotDurationMinutes: 30,
    },
    medicalAids: ['Discovery Health', 'Momentum Health', 'Bonitas', 'Medscheme', 'Cash / Self-Pay'],
    patientHighlight: 'Dr. Gabuza was very empathetic, punctual, and gave clear guidance on my treatment plan.',
    services: [
      {
        id: 'srv-thobani-1',
        doctorId: 'doc-thobani-gabuza',
        name: 'General Medical Consultation',
        description: 'Comprehensive physical examination, diagnosis, acute care, and medication prescriptions.',
        durationMinutes: 30,
        priceZar: 550,
        category: 'Consultation',
        mode: 'both',
        isActive: true,
      },
      {
        id: 'srv-thobani-2',
        doctorId: 'doc-thobani-gabuza',
        name: 'Follow-Up & Script Renewal',
        description: 'Review of diagnostic tests, chronic medication adjustments, and medical certificates.',
        durationMinutes: 15,
        priceZar: 350,
        category: 'Follow-up',
        mode: 'both',
        isActive: true,
      },
      {
        id: 'srv-thobani-3',
        doctorId: 'doc-thobani-gabuza',
        name: 'Comprehensive Health Check & ECG',
        description: 'Cardiovascular assessment, resting ECG, blood pressure, glucose, and preventive health plan.',
        durationMinutes: 60,
        priceZar: 1100,
        category: 'Screening',
        mode: 'in_person',
        isActive: true,
      },
      {
        id: 'srv-thobani-4',
        doctorId: 'doc-thobani-gabuza',
        name: 'Telehealth Video Consultation',
        description: 'Encrypted video consultation for minor ailments, script repeats, or medical advice from home.',
        durationMinutes: 20,
        priceZar: 420,
        category: 'Telehealth',
        mode: 'video',
        isActive: true,
      },
      {
        id: 'srv-thobani-5',
        doctorId: 'doc-thobani-gabuza',
        name: 'Minor Surgical Procedure & Wound Care',
        description: 'In-practice suturing, dressing changes, abscess incision & drainage, or cryotherapy under local anaesthetic.',
        durationMinutes: 45,
        priceZar: 850,
        category: 'Procedure',
        mode: 'in_person',
        isActive: true,
      },
      {
        id: 'srv-thobani-6',
        doctorId: 'doc-thobani-gabuza',
        name: 'Pediatric Wellness & Immunisation Check',
        description: 'Comprehensive developmental milestone screening, growth tracking, and childhood vaccination check.',
        durationMinutes: 30,
        priceZar: 480,
        category: 'Screening',
        mode: 'in_person',
        isActive: true,
      },
    ],
    createdAt: '2026-01-01T08:00:00.000Z',
  },
  {
    id: 'doc-001',
    title: 'Dr.',
    fullName: 'Thabo Ndlovu',
    specialty: 'General Practitioner',
    hpcsaNumber: 'MP 0784920',
    practiceName: 'Sandton Family & Urgent Care',
    practiceAddress: 'Suite 302, Sandton City Medical Mews, 83 Rivonia Rd',
    city: 'Johannesburg',
    province: 'Gauteng',
    phone: '+27 11 884 9200',
    email: 'dr.thabo@sandtoncare.co.za',
    bio: 'Family physician with over 14 years of clinical experience in preventive health, chronic disease management (diabetes & hypertension), and acute medical consultations.',
    qualifications: ['MBChB (UCT)', 'Dip Primary Emergency Care (CMSA)', 'FCFP (SA)'],
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 54,
    consultationModes: ['in_person', 'video'],
    availability: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '08:30',
      endTime: '17:00',
      slotDurationMinutes: 30,
    },
    medicalAids: ['Discovery Health', 'Bonitas', 'Bankmed', 'Medscheme', 'Cash / Self-Pay'],
    patientHighlight: 'Prompt service, attentive staff, and excellent follow-up after urgent consult.',
    services: [
      {
        id: 'srv-001-1',
        doctorId: 'doc-001',
        name: 'General Medical Consultation',
        description: 'Comprehensive physical examination, diagnosis, acute treatment, and medication prescription.',
        durationMinutes: 30,
        priceZar: 550,
        category: 'Consultation',
        mode: 'both',
        isActive: true,
      },
      {
        id: 'srv-001-2',
        doctorId: 'doc-001',
        name: 'Follow-Up & Prescription Refill',
        description: 'Review of lab results, chronic medication adjustments, and medical certificates.',
        durationMinutes: 15,
        priceZar: 320,
        category: 'Follow-up',
        mode: 'both',
        isActive: true,
      },
      {
        id: 'srv-001-3',
        doctorId: 'doc-001',
        name: 'Executive Health & Wellness Screening',
        description: 'Cardiovascular risk profile, blood pressure, glucose & cholesterol point-of-care, ECG, and lifestyle plan.',
        durationMinutes: 60,
        priceZar: 1100,
        category: 'Screening',
        mode: 'in_person',
        isActive: true,
      },
      {
        id: 'srv-001-4',
        doctorId: 'doc-001',
        name: 'Telehealth Video Consultation',
        description: 'Secure remote video consult for minor ailments, follow-ups, and script renewals from home.',
        durationMinutes: 20,
        priceZar: 420,
        category: 'Telehealth',
        mode: 'video',
        isActive: true,
      },
    ],
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'doc-002',
    title: 'Dr.',
    fullName: 'Amina Patel',
    specialty: 'Paediatrician',
    hpcsaNumber: 'MP 0643198',
    practiceName: "Rosebank Children's Health Centre",
    practiceAddress: '14 Oxford Road, Rosebank Medical Suites',
    city: 'Johannesburg',
    province: 'Gauteng',
    phone: '+27 11 788 3400',
    email: 'info@rosebankpaediatrics.co.za',
    bio: 'Specialist paediatrician dedicated to infant nutrition, developmental milestones, childhood respiratory conditions, and adolescent healthcare.',
    qualifications: ['MBBCh (Wits)', 'FCPaed (SA)', 'MMed Paediatrics (Wits)'],
    avatarUrl: 'https://images.unsplash.com/photo-1594824813576-0f81d1136b6f?w=400&auto=format&fit=crop&q=80',
    rating: 4.95,
    reviewsCount: 78,
    consultationModes: ['in_person', 'video'],
    availability: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      startTime: '09:00',
      endTime: '16:00',
      slotDurationMinutes: 45,
    },
    medicalAids: ['Discovery Health', 'Momentum Health', 'Profmed', 'Cash / Self-Pay'],
    patientHighlight: 'Wonderful bedside manner with our newborn; answered every question with patience.',
    services: [
      {
        id: 'srv-002-1',
        doctorId: 'doc-002',
        name: 'Infant & Child Wellness Check',
        description: 'Full growth and milestone evaluation, developmental screening, and nutrition guidance.',
        durationMinutes: 45,
        priceZar: 850,
        category: 'Consultation',
        mode: 'in_person',
        isActive: true,
      },
      {
        id: 'srv-002-2',
        doctorId: 'doc-002',
        name: 'Acute Childhood Illness Consultation',
        description: 'Evaluation and management of fevers, ear infections, coughs, and gastrointestinal symptoms.',
        durationMinutes: 30,
        priceZar: 680,
        category: 'Consultation',
        mode: 'both',
        isActive: true,
      },
      {
        id: 'srv-002-3',
        doctorId: 'doc-002',
        name: 'Paediatric Telehealth Guidance',
        description: 'Remote assessment for non-emergency symptoms, feeding concerns, and follow-ups.',
        durationMinutes: 25,
        priceZar: 480,
        category: 'Telehealth',
        mode: 'video',
        isActive: true,
      },
    ],
    createdAt: '2026-02-15T09:00:00.000Z',
  },
  {
    id: 'doc-003',
    title: 'Dr.',
    fullName: 'Sarah Van Der Merwe',
    specialty: 'Clinical Psychologist',
    hpcsaNumber: 'PS 0148293',
    practiceName: 'Gardens Mental Wellness & Therapy Studio',
    practiceAddress: '42 Kloof Street, Gardens Health Pavilion',
    city: 'Cape Town',
    province: 'Western Cape',
    phone: '+27 21 424 8830',
    email: 'practice@sarahvandermerwe.co.za',
    bio: 'Registered clinical psychologist offering evidence-based CBT, stress & burnout management, trauma recovery, and holistic emotional well-being support.',
    qualifications: ['MA Clinical Psychology (Stellenbosch)', 'PhD Psychology (UCT)'],
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80',
    rating: 4.88,
    reviewsCount: 42,
    consultationModes: ['in_person', 'video'],
    availability: {
      days: ['Mon', 'Tue', 'Wed', 'Thu'],
      startTime: '08:30',
      endTime: '17:30',
      slotDurationMinutes: 50,
    },
    medicalAids: ['Discovery Health', 'Medscheme', 'Bankmed', 'Cash / Self-Pay'],
    patientHighlight: 'Warm, compassionate environment that made opening up comfortable from day one.',
    services: [
      {
        id: 'srv-003-1',
        doctorId: 'doc-003',
        name: 'Individual Therapy & Consultation',
        description: 'One-on-one confidential 50-minute psychological therapy session exploring anxiety, depression, or life changes.',
        durationMinutes: 50,
        priceZar: 950,
        category: 'Consultation',
        mode: 'both',
        isActive: true,
      },
      {
        id: 'srv-003-2',
        doctorId: 'doc-003',
        name: 'Virtual Teletherapy Session',
        description: 'Encrypted video call therapy session in the privacy of your home.',
        durationMinutes: 50,
        priceZar: 880,
        category: 'Telehealth',
        mode: 'video',
        isActive: true,
      },
    ],
    createdAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'doc-004',
    title: 'Dr.',
    fullName: 'Sibusiso Khumalo',
    specialty: 'Dentist',
    hpcsaNumber: 'DP 0492817',
    practiceName: 'Durban North Dental & Aesthetic Care',
    practiceAddress: '78 Adelaide Tambo Drive, Durban North',
    city: 'Durban',
    province: 'KwaZulu-Natal',
    phone: '+27 31 563 4900',
    email: 'reception@durbannorthdental.co.za',
    bio: 'Gentle, modern dental care focusing on preventive oral health, painless restorations, teeth whitening, and emergency dental pain relief.',
    qualifications: ['BChD (UWC)', 'Postgrad Dip Aesthetic Dentistry (Pretoria)'],
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
    rating: 4.92,
    reviewsCount: 65,
    consultationModes: ['in_person'],
    availability: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      startTime: '08:00',
      endTime: '16:30',
      slotDurationMinutes: 45,
    },
    medicalAids: ['Discovery Health', 'Bonitas', 'KeyHealth', 'Cash / Self-Pay'],
    patientHighlight: 'Gentle and completely pain-free dental checkup. High-tech equipment in clinic.',
    services: [
      {
        id: 'srv-004-1',
        doctorId: 'doc-004',
        name: 'Dental Examination & Scale & Polish',
        description: 'Comprehensive dental exam, digital bite-wing X-rays if needed, and ultrasonic plaque scaling and polish.',
        durationMinutes: 45,
        priceZar: 680,
        category: 'Procedure',
        mode: 'in_person',
        isActive: true,
      },
      {
        id: 'srv-004-2',
        doctorId: 'doc-004',
        name: 'Emergency Dental Pain & Treatment',
        description: 'Assessment of acute toothache, emergency dressing, or restorative filling treatment.',
        durationMinutes: 45,
        priceZar: 850,
        category: 'Procedure',
        mode: 'in_person',
        isActive: true,
      },
    ],
    createdAt: '2026-03-10T11:00:00.000Z',
  },
  {
    id: 'doc-005',
    title: 'Dr.',
    fullName: 'Lindiwe Dlamini',
    specialty: 'Obstetrician & Gynaecologist',
    hpcsaNumber: 'MP 0591024',
    practiceName: 'Sunninghill Women & Maternal Pavilion',
    practiceAddress: 'Corner Witkoppen & Nanyuki Rd, Sunninghill',
    city: 'Johannesburg',
    province: 'Gauteng',
    phone: '+27 11 806 7200',
    email: 'info@drdlaminiobgyn.co.za',
    bio: 'Specialist in women’s reproductive health, high-risk obstetrics, antenatal ultrasound scanning, and minimally invasive gynaecological procedures.',
    qualifications: ['MBChB (UKZN)', 'FCOG (SA)', 'MMed O&G (Wits)'],
    avatarUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&auto=format&fit=crop&q=80',
    rating: 4.96,
    reviewsCount: 89,
    consultationModes: ['in_person', 'video'],
    availability: {
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime: '08:30',
      endTime: '16:30',
      slotDurationMinutes: 40,
    },
    medicalAids: ['Discovery Health', 'Momentum Health', 'Bonitas', 'Fedhealth', 'Cash / Self-Pay'],
    patientHighlight: 'Superb antenatal care throughout pregnancy. Always felt in the safest hands.',
    services: [
      {
        id: 'srv-005-1',
        doctorId: 'doc-005',
        name: 'Comprehensive Well-Woman Check & Pap Smear',
        description: 'Pelvic examination, liquid-based cytology pap smear, breast examination, and contraceptive review.',
        durationMinutes: 40,
        priceZar: 980,
        category: 'Screening',
        mode: 'in_person',
        isActive: true,
      },
      {
        id: 'srv-005-2',
        doctorId: 'doc-005',
        name: 'Antenatal Ultrasound & Pregnancy Consult',
        description: 'High-resolution fetal growth ultrasound, maternal blood pressure & urine check, and clinical review.',
        durationMinutes: 45,
        priceZar: 1150,
        category: 'Consultation',
        mode: 'in_person',
        isActive: true,
      },
      {
        id: 'srv-005-3',
        doctorId: 'doc-005',
        name: 'Gynaecological Telehealth Follow-up',
        description: 'Virtual discussion of lab/biopsy results, hormone therapy adjustments, or medication refills.',
        durationMinutes: 20,
        priceZar: 490,
        category: 'Telehealth',
        mode: 'video',
        isActive: true,
      },
    ],
    createdAt: '2026-03-20T08:30:00.000Z',
  },
];

const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

/** Pre-seeded patient bookings for Dr. Thobani Gabuza's practice portal */
export const initialDoctorBookings: DoctorBooking[] = [
  {
    id: 'bk-gabuza-001',
    doctorId: 'doc-thobani-gabuza',
    doctorName: 'Dr. Thobani Gabuza',
    doctorSpecialty: 'General Practitioner',
    practiceName: 'Gabuza Family Medicine & Wellness Practice',
    practiceAddress: 'Suite 204, Sandton Medical Suites, 83 Rivonia Rd',
    patientId: 'pat-thobani-p1',
    patientName: 'Kagiso Sithole',
    patientPhone: '+27 82 555 1234',
    patientEmail: 'kagiso.sithole@gmail.com',
    serviceId: 'srv-thobani-1',
    serviceName: 'General Medical Consultation',
    durationMinutes: 30,
    priceZar: 550,
    date: getRelativeDate(0),
    time: '16:00',
    mode: 'in_person',
    notes: 'Persistent dry cough, mild fever, and chest tightness following flu.',
    status: 'confirmed',
    patientSummary: {
      bloodGroup: 'O+',
      dateOfBirth: '1988-06-14',
      gender: 'Male',
      allergies: [
        { substance: 'Penicillin', reaction: 'Severe anaphylactic shock & urticaria' },
        { substance: 'Aspirin (NSAIDs)', reaction: 'Bronchospasm / acute wheezing' },
      ],
      chronicConditions: ['Moderate Persistent Asthma', 'Seasonal Allergic Rhinitis'],
      activeMedications: ['Salbutamol Inhaler 100mcg PRN', 'Budesonide Turbuhaler 200mcg BD'],
      emergencyContact: {
        name: 'Nomsa Sithole',
        relationship: 'Spouse',
        phone: '+27 82 999 1234',
      },
      vitalNotes: 'Known asthmatic; peak flow at last visit 380 L/min (baseline 460).',
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'bk-gabuza-002',
    doctorId: 'doc-thobani-gabuza',
    doctorName: 'Dr. Thobani Gabuza',
    doctorSpecialty: 'General Practitioner',
    practiceName: 'Gabuza Family Medicine & Wellness Practice',
    practiceAddress: 'Suite 204, Sandton Medical Suites, 83 Rivonia Rd',
    patientId: 'pat-thobani-p2',
    patientName: 'Lerato Molefe',
    patientPhone: '+27 83 234 5678',
    patientEmail: 'lerato.molefe@outlook.co.za',
    serviceId: 'srv-thobani-4',
    serviceName: 'Telehealth Video Consultation',
    durationMinutes: 20,
    priceZar: 420,
    date: getRelativeDate(1),
    time: '09:30',
    mode: 'video',
    notes: 'Routine review of chronic hypertension script and recent home blood pressure readings.',
    status: 'confirmed',
    patientSummary: {
      bloodGroup: 'A+',
      dateOfBirth: '1979-11-22',
      gender: 'Female',
      allergies: [
        { substance: 'Sulfa antibiotics (Bactrim)', reaction: 'Erythematous rash & facial edema' },
      ],
      chronicConditions: ['Essential Hypertension (Stage 2)', 'Mild Dyslipidemia'],
      activeMedications: ['Amlodipine 5mg Daily', 'Atorvastatin 20mg Nocte'],
      emergencyContact: {
        name: 'Bongani Molefe',
        relationship: 'Brother',
        phone: '+27 83 999 5678',
      },
      vitalNotes: 'Home BP log average: 136/84 mmHg over past 14 days.',
    },
    createdAt: new Date(Date.now() - 72000000).toISOString(),
  },
  {
    id: 'bk-gabuza-003',
    doctorId: 'doc-thobani-gabuza',
    doctorName: 'Dr. Thobani Gabuza',
    doctorSpecialty: 'General Practitioner',
    practiceName: 'Gabuza Family Medicine & Wellness Practice',
    practiceAddress: 'Suite 204, Sandton Medical Suites, 83 Rivonia Rd',
    patientId: 'pat-thobani-p3',
    patientName: 'David Van Zyl',
    patientPhone: '+27 84 987 6543',
    patientEmail: 'david.vanzyl@investec.co.za',
    serviceId: 'srv-thobani-3',
    serviceName: 'Comprehensive Health Check & ECG',
    durationMinutes: 60,
    priceZar: 1100,
    date: getRelativeDate(2),
    time: '11:00',
    mode: 'in_person',
    notes: 'Annual executive corporate medical screening and resting ECG examination.',
    status: 'confirmed',
    patientSummary: {
      bloodGroup: 'B+',
      dateOfBirth: '1974-03-08',
      gender: 'Male',
      allergies: [],
      chronicConditions: ['Borderline Hypercholesterolemia'],
      activeMedications: ['Omega-3 1000mg Daily', 'Vitamin D3 2000IU'],
      emergencyContact: {
        name: 'Clara Van Zyl',
        relationship: 'Spouse',
        phone: '+27 84 111 2233',
      },
      vitalNotes: 'Non-smoker; resting pulse 64 bpm.',
    },
    createdAt: new Date(Date.now() - 120000000).toISOString(),
  },
  {
    id: 'bk-gabuza-004',
    doctorId: 'doc-thobani-gabuza',
    doctorName: 'Dr. Thobani Gabuza',
    doctorSpecialty: 'General Practitioner',
    practiceName: 'Gabuza Family Medicine & Wellness Practice',
    practiceAddress: 'Suite 204, Sandton Medical Suites, 83 Rivonia Rd',
    patientId: 'pat-thobani-p4',
    patientName: 'Nandi Mokoena',
    patientPhone: '+27 82 901 2345',
    patientEmail: 'nandi.mokoena@vodamail.co.za',
    serviceId: 'srv-thobani-6',
    serviceName: 'Pediatric Wellness & Immunisation Check',
    durationMinutes: 30,
    priceZar: 480,
    date: getRelativeDate(3),
    time: '14:00',
    mode: 'in_person',
    notes: '6-month baby developmental milestone assessment and routine vaccination schedule.',
    status: 'confirmed',
    patientSummary: {
      bloodGroup: 'O+',
      dateOfBirth: '2026-05-10',
      gender: 'Female',
      allergies: [],
      chronicConditions: [],
      activeMedications: [],
      emergencyContact: {
        name: 'Thandi Mokoena',
        relationship: 'Mother',
        phone: '+27 82 901 2345',
      },
      vitalNotes: 'Weight: 7.8 kg (50th percentile), head circ: 43 cm.',
    },
    createdAt: new Date(Date.now() - 150000000).toISOString(),
  },
  {
    id: 'bk-gabuza-005',
    doctorId: 'doc-thobani-gabuza',
    doctorName: 'Dr. Thobani Gabuza',
    doctorSpecialty: 'General Practitioner',
    practiceName: 'Gabuza Family Medicine & Wellness Practice',
    practiceAddress: 'Suite 204, Sandton Medical Suites, 83 Rivonia Rd',
    patientId: 'pat-thobani-p5',
    patientName: 'Nomvula Khumalo',
    patientPhone: '+27 71 345 6789',
    patientEmail: 'nomvula.khumalo@icloud.com',
    serviceId: 'srv-thobani-2',
    serviceName: 'Follow-Up & Script Renewal',
    durationMinutes: 15,
    priceZar: 350,
    date: getRelativeDate(-1),
    time: '10:15',
    mode: 'in_person',
    notes: 'Review of Lancet Laboratories thyroid TSH panel results; renewed Eltroxin repeat script.',
    status: 'completed',
    patientSummary: {
      bloodGroup: 'AB+',
      dateOfBirth: '1982-08-30',
      gender: 'Female',
      allergies: [{ substance: 'Codeine', reaction: 'Severe nausea & vomiting' }],
      chronicConditions: ['Primary Hypothyroidism'],
      activeMedications: ['Eltroxin 100mcg Daily'],
      emergencyContact: {
        name: 'Jabulani Khumalo',
        relationship: 'Husband',
        phone: '+27 71 888 9900',
      },
    },
    clinicalNotes: {
      subjective: 'Patient presents for review of thyroid panel. Reports improved energy levels, good sleep, no heat intolerance or palpitations.',
      objective: 'BP 122/78 mmHg, HR 68 bpm regular. Thyroid non-tender, no palpable nodules. Recent Lancet TSH 2.1 mIU/L (euthyroid).',
      assessment: 'Primary Hypothyroidism, clinically and biochemically well-controlled on current Levothyroxine dosage (E03.9).',
      plan: 'Continue Eltroxin 100mcg daily fasting. Repeat TSH & Free T4 in 6 months. 6-month repeat script issued.',
      icd10Code: 'E03.9',
      recordedAt: new Date(Date.now() - 250000000).toISOString(),
    },
    prescriptions: [
      {
        id: 'rx-005-1',
        medicationName: 'Eltroxin (Levothyroxine Sodium) 100mcg',
        dosage: '1 tablet daily',
        instructions: 'Take 30 minutes before breakfast with full glass of water',
        durationDays: 30,
        repeats: 5,
        quantity: '30 tablets',
      },
    ],
    createdAt: new Date(Date.now() - 250000000).toISOString(),
  },
  {
    id: 'bk-gabuza-006',
    doctorId: 'doc-thobani-gabuza',
    doctorName: 'Dr. Thobani Gabuza',
    doctorSpecialty: 'General Practitioner',
    practiceName: 'Gabuza Family Medicine & Wellness Practice',
    practiceAddress: 'Suite 204, Sandton Medical Suites, 83 Rivonia Rd',
    patientId: 'pat-thobani-p6',
    patientName: 'Sipho Dlamini',
    patientPhone: '+27 76 890 1234',
    patientEmail: 'sipho.dlamini@standardbank.co.za',
    serviceId: 'srv-thobani-1',
    serviceName: 'General Medical Consultation',
    durationMinutes: 30,
    priceZar: 550,
    date: getRelativeDate(-3),
    time: '15:30',
    mode: 'in_person',
    notes: 'Follow-up check for acute bronchitis resolution; clear lung auscultation confirmed.',
    status: 'completed',
    patientSummary: {
      bloodGroup: 'O-',
      dateOfBirth: '1985-03-12',
      gender: 'Male',
      allergies: [],
      chronicConditions: ['None reported'],
      activeMedications: ['Amoxicillin 500mg completed'],
      emergencyContact: {
        name: 'Zodwa Dlamini',
        relationship: 'Spouse',
        phone: '+27 76 555 4321',
      },
    },
    clinicalNotes: {
      subjective: 'Follow-up consultation for acute bronchitis. Cough markedly reduced, productive of minimal clear phlegm. No fevers.',
      objective: 'Temp 36.6 C, SpO2 98% room air. Chest: Vesicular breath sounds bilaterally, no wheezes or crackles remaining.',
      assessment: 'Resolving Acute Bronchitis (J20.9). Patient recovering well.',
      plan: 'Finish residual course of supportive therapy. Resume full physical training next week.',
      icd10Code: 'J20.9',
      recordedAt: new Date(Date.now() - 350000000).toISOString(),
    },
    sickNote: {
      id: 'sn-006',
      certificateNumber: 'MC-2026-08492-06',
      patientName: 'Sipho Dlamini',
      patientIdNumber: '8503125200084',
      dateOfExamination: getRelativeDate(-3),
      incapacityStartDate: getRelativeDate(-3),
      incapacityEndDate: getRelativeDate(-1),
      resumeDutyDate: getRelativeDate(0),
      natureOfIncapacity: 'specified',
      diagnosisStatement: 'Acute exacerbation of bronchitis with severe nocturnal cough',
      recommendation: 'Unfit for normal workplace duties. Recommended rest and isolation from cold exposure.',
      doctorName: 'Dr. Thobani Gabuza',
      doctorHpcsaNumber: 'MP 0849210',
      doctorPracticeNumber: '0542318',
      issuedAt: new Date(Date.now() - 350000000).toISOString(),
    },
    createdAt: new Date(Date.now() - 350000000).toISOString(),
  },
  {
    id: 'bk-gabuza-007',
    doctorId: 'doc-thobani-gabuza',
    doctorName: 'Dr. Thobani Gabuza',
    doctorSpecialty: 'General Practitioner',
    practiceName: 'Gabuza Family Medicine & Wellness Practice',
    practiceAddress: 'Suite 204, Sandton Medical Suites, 83 Rivonia Rd',
    patientId: 'pat-thobani-p7',
    patientName: 'Zanele Mthembu',
    patientPhone: '+27 82 771 9082',
    patientEmail: 'zanele.mthembu@mtn.com',
    serviceId: 'srv-thobani-4',
    serviceName: 'Telehealth Video Consultation',
    durationMinutes: 20,
    priceZar: 420,
    date: getRelativeDate(-4),
    time: '16:15',
    mode: 'video',
    notes: 'Patient requested reschedule due to international flight delay.',
    status: 'cancelled',
    createdAt: new Date(Date.now() - 400000000).toISOString(),
  },
];
