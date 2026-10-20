export type AuditEventType =
  | 'login'
  | 'upload'
  | 'translation'
  | 'share'
  | 'revoke'
  | 'reminder'
  | 'language'
  | 'profile'
  | 'export';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  description: string;
  timestamp: string;
}

export const auditSeed: AuditEvent[] = [
  {
    id: 'audit-001',
    type: 'reminder',
    description: 'Marked Metformin 500mg (morning) as taken',
    timestamp: '2026-10-12T07:12:00+02:00',
  },
  {
    id: 'audit-002',
    type: 'login',
    description: 'Signed in with 2FA verification',
    timestamp: '2026-10-12T06:58:00+02:00',
  },
  {
    id: 'audit-003',
    type: 'share',
    description: 'Shared HbA1c panel and cardiology letter with Dr S. Naidoo for 7 days',
    timestamp: '2026-09-28T09:15:00+02:00',
  },
  {
    id: 'audit-004',
    type: 'translation',
    description: 'Translated cardiology review letter into isiZulu',
    timestamp: '2026-09-20T17:30:00+02:00',
  },
  {
    id: 'audit-005',
    type: 'upload',
    description: 'Uploaded HbA1c, Lipogram & Renal Function Panel',
    timestamp: '2026-09-03T10:05:00+02:00',
  },
  {
    id: 'audit-006',
    type: 'export',
    description: 'Exported Emergency ICE card as PDF',
    timestamp: '2026-08-14T13:22:00+02:00',
  },
  {
    id: 'audit-007',
    type: 'revoke',
    description: 'Revoked sharing link for Sr P. Dlamini',
    timestamp: '2026-03-07T11:05:00+02:00',
  },
  {
    id: 'audit-008',
    type: 'language',
    description: 'Changed app language to isiZulu',
    timestamp: '2026-02-02T19:40:00+02:00',
  },
];
