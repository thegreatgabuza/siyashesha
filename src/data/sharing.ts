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

export const sharingHistorySeed: SharedLink[] = [];
