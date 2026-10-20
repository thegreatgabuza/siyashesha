import dayjs from 'dayjs';

export function todayKey(date: Date = new Date()): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function formatFriendlyDate(iso: string): string {
  return dayjs(iso).format('D MMM YYYY');
}

export function formatDayMonth(iso: string): string {
  return dayjs(iso).format('D MMM');
}

export function formatTime12(time: string): string {
  return dayjs(`2000-01-01T${time}`).format('h:mm A');
}

export function pastDateKeys(days: number): string[] {
  return Array.from({ length: days }, (_, i) => dayjs().subtract(i + 1, 'day').format('YYYY-MM-DD'));
}

export function relativeFromNow(iso: string): string {
  const diffDays = dayjs(iso).startOf('day').diff(dayjs().startOf('day'), 'day');
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
}
