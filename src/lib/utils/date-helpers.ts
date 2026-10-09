import { DateRangePreset } from '@/types/analytics';

export const TIMEZONE = 'Asia/Kolkata';

/**
 * Extracts the hour (0-23) in Indian Standard Time (Asia/Kolkata)
 */
export function getISTHour(dateInput: string | Date): number {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hourPart = parts.find((p) => p.type === 'hour');
  return hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();
}

/**
 * Extracts the calendar date key 'YYYY-MM-DD' in Indian Standard Time (Asia/Kolkata)
 */
export function getISTDateKey(dateInput: string | Date = new Date()): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getDateRangeBounds(
  preset: DateRangePreset,
  customStart?: string,
  customEnd?: string
): {
  startDate: string | null;
  endDate: string | null;
} {
  const now = new Date();
  const todayStr = getISTDateKey(now);

  switch (preset) {
    case 'today': {
      const start = new Date(`${todayStr}T00:00:00.000+05:30`);
      const end = new Date(`${todayStr}T23:59:59.999+05:30`);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case 'yesterday': {
      const noon = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon.setDate(noon.getDate() - 1);
      const yesterdayStr = getISTDateKey(noon);
      const start = new Date(`${yesterdayStr}T00:00:00.000+05:30`);
      const end = new Date(`${yesterdayStr}T23:59:59.999+05:30`);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    case '7d': {
      const noon = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon.setDate(noon.getDate() - 7);
      const pastStr = getISTDateKey(noon);
      const start = new Date(`${pastStr}T00:00:00.000+05:30`);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    case '30d': {
      const noon = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon.setDate(noon.getDate() - 30);
      const pastStr = getISTDateKey(noon);
      const start = new Date(`${pastStr}T00:00:00.000+05:30`);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    case '90d': {
      const noon = new Date(`${todayStr}T12:00:00.000+05:30`);
      noon.setDate(noon.getDate() - 90);
      const pastStr = getISTDateKey(noon);
      const start = new Date(`${pastStr}T00:00:00.000+05:30`);
      return { startDate: start.toISOString(), endDate: now.toISOString() };
    }
    case 'custom': {
      const parseBoundary = (val: string | undefined, isEnd: boolean): string | null => {
        if (!val) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
          const time = isEnd ? '23:59:59.999' : '00:00:00.000';
          return new Date(`${val}T${time}+05:30`).toISOString();
        }
        return new Date(val).toISOString();
      };
      return {
        startDate: parseBoundary(customStart, false),
        endDate: parseBoundary(customEnd, true),
      };
    }
    case 'all':
    default:
      return { startDate: null, endDate: null };
  }
}

export function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00+05:30' : ''));
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TIMEZONE,
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

