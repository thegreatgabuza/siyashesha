export type DiaryCategory = 'Personal' | 'Appointment' | 'Medication' | 'Symptoms' | 'Other';

export const diaryCategories: DiaryCategory[] = [
  'Personal',
  'Appointment',
  'Medication',
  'Symptoms',
  'Other',
];

export interface DiaryAttachment {
  id: string;
  kind: 'photo' | 'document' | 'voice';
  duration?: string;
  name: string;
  uri?: string;
}

export interface DiaryNote {
  id: string;
  title: string;
  body: string;
  entryDate: string;
  createdAt: string;
  updatedAt: string;
  category?: DiaryCategory;
  pinned: boolean;
  attachments: DiaryAttachment[];
  reminderAt?: string;
  linkedAppointmentId?: string;
  isDraft?: boolean;
}

export const diaryNotesSeed: DiaryNote[] = [
  {
    id: 'diary-001',
    title: 'Questions for my doctor',
    body: 'Ask Dr Mokoena: 1) Can I reduce the Metformin dose now that my HbA1c has improved? 2) Is the tingling in my feet something to worry about? 3) Should I get my eyes checked again this year?',
    entryDate: '2026-10-05',
    createdAt: '2026-10-05T18:20:00+02:00',
    updatedAt: '2026-10-05T18:20:00+02:00',
    category: 'Appointment',
    pinned: true,
    attachments: [],
    linkedAppointmentId: 'appt-001',
  },
  {
    id: 'diary-002',
    title: 'Feeling better this week',
    body: 'Blood sugar readings have been steadier since I started having breakfast before my morning Metformin dose. Walking 20 minutes most evenings with Sipho — it helps with my mood too.',
    entryDate: '2026-09-28',
    createdAt: '2026-09-28T20:05:00+02:00',
    updatedAt: '2026-09-28T20:05:00+02:00',
    category: 'Personal',
    pinned: false,
    attachments: [],
  },
  {
    id: 'diary-003',
    title: 'Mild dizziness after Amlodipine',
    body: 'Felt a bit light-headed about an hour after my morning dose today. Resolved after sitting down and having water. Will mention this at my next review.',
    entryDate: '2026-09-15',
    createdAt: '2026-09-15T08:45:00+02:00',
    updatedAt: '2026-09-15T08:45:00+02:00',
    category: 'Symptoms',
    pinned: false,
    attachments: [],
  },
  {
    id: 'diary-004',
    title: 'Pharmacy switched my Atorvastatin brand',
    body: 'The pharmacy gave me a generic brand of Atorvastatin this month — same 20mg strength. Keeping the box in case I need to show the clinic.',
    entryDate: '2026-08-02',
    createdAt: '2026-08-02T12:10:00+02:00',
    updatedAt: '2026-08-02T12:10:00+02:00',
    category: 'Medication',
    pinned: false,
    attachments: [{ id: 'att-004-1', kind: 'photo', name: 'Atorvastatin box.jpg' }],
  },
];
