import type { HealthPassportTarget } from '@/data/healthDays';

export const passportTargetRoutes: Record<HealthPassportTarget, string> = {
  records: '/records',
  medications: '/more/medications',
  timeline: '/more/timeline',
  emergency: '/more/emergency',
  calendar: '/calendar',
  sharing: '/more/sharing',
};
