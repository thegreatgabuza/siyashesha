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
  createdAt: string;
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
