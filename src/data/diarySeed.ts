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

export const diaryNotesSeed: DiaryNote[] = [];
