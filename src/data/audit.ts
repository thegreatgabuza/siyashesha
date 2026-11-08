export type AuditEventType =
  | 'login'
  | 'upload'
  | 'translation'
  | 'share'
  | 'revoke'
  | 'reminder'
  | 'language'
  | 'profile'
  | 'edit'
  | 'export';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  description: string;
  timestamp: string;
}

export const auditSeed: AuditEvent[] = [];
