export interface ShareDuration {
  id: '24h' | '48h' | '7d' | '30d';
  label: string;
  hours: number;
}

export const shareDurations: ShareDuration[] = [
  { id: '24h', label: '24 hours', hours: 24 },
  { id: '48h', label: '48 hours', hours: 48 },
  { id: '7d', label: '7 days', hours: 24 * 7 },
  { id: '30d', label: '30 days', hours: 24 * 30 },
];

export interface SharedLink {
  id: string;
  recipientName: string;
  recipientFacility: string;
  recordIds: string[];
  diaryNoteIds: string[];
  durationId: ShareDuration['id'];
  pin: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
}

export const sharingHistorySeed: SharedLink[] = [
  {
    id: 'share-001',
    recipientName: 'Dr S. Naidoo',
    recipientFacility: 'Milpark Cardiology',
    recordIds: ['rec-001', 'rec-007'],
    diaryNoteIds: [],
    durationId: '7d',
    pin: '4821',
    createdAt: '2026-09-28T09:15:00+02:00',
    expiresAt: '2026-10-05T09:15:00+02:00',
    status: 'active',
  },
  {
    id: 'share-002',
    recipientName: 'Dr R. Abrahams',
    recipientFacility: 'Netcare Milpark Hospital',
    recordIds: ['rec-004', 'rec-008', 'rec-011'],
    diaryNoteIds: [],
    durationId: '48h',
    pin: '7730',
    createdAt: '2024-11-03T14:40:00+02:00',
    expiresAt: '2024-11-05T14:40:00+02:00',
    status: 'expired',
  },
  {
    id: 'share-003',
    recipientName: 'Sr P. Dlamini',
    recipientFacility: 'Edenvale Community Health Centre',
    recordIds: ['rec-002', 'rec-003'],
    diaryNoteIds: [],
    durationId: '24h',
    pin: '2259',
    createdAt: '2026-03-06T11:00:00+02:00',
    expiresAt: '2026-03-07T11:00:00+02:00',
    status: 'revoked',
  },
];
